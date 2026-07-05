-- ツグモノ 初期スキーマ
-- projects / answers / documents / purchases + RLS

-- ========== projects: 1事業 = 1プロジェクト ==========
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  industry text not null check (industry in ('restaurant', 'retail', 'manufacturing')),
  business_name text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'interviewing', 'review', 'paid', 'generated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ========== answers: インタビュー回答（セッション跨ぎで永続化） ==========
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  question_key text not null,
  question_text text not null,
  answer_text text,
  is_followup boolean not null default false,
  created_at timestamptz not null default now(),
  -- 同一質問への回答は上書き（1プロジェクト1質問キー1行）
  unique (project_id, question_key)
);

create index answers_project_id_idx on public.answers (project_id);

-- ========== documents: 生成された概要書 ==========
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version int not null default 1,
  content_json jsonb not null,
  pdf_path text,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create index documents_project_id_idx on public.documents (project_id);

-- ========== purchases: Stripe決済記録 ==========
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stripe_session_id text unique not null,
  amount int not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index purchases_project_id_idx on public.purchases (project_id);

-- ========== RLS ==========
alter table public.projects enable row level security;
alter table public.answers enable row level security;
alter table public.documents enable row level security;
alter table public.purchases enable row level security;

-- projects: 本人のみ全操作可
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- answers: 親プロジェクトの所有者のみ
create policy "answers_select_own" on public.answers
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
create policy "answers_insert_own" on public.answers
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
create policy "answers_update_own" on public.answers
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
create policy "answers_delete_own" on public.answers
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- documents: 親プロジェクトの所有者のみ読み取り可。作成・更新はサーバー（service role）のみ
create policy "documents_select_own" on public.documents
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- purchases: 親プロジェクトの所有者のみ読み取り可。作成・更新はサーバー（service role）のみ
create policy "purchases_select_own" on public.purchases
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- ========== Storage: 生成PDF用の非公開バケット ==========
-- ダウンロードはサーバー側で所有権確認のうえ署名付きURLを発行する
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
