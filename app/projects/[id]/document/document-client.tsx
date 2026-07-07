"use client";

import { useState } from "react";
import { PRICE_JPY, type DocumentContent } from "@/lib/types";
import { ensurePdf, regenerateDocument } from "./actions";

interface DocumentState {
  id: string;
  version: number;
  content: DocumentContent;
  hasPdf: boolean;
}

const MAIN_FIELDS: { key: keyof Omit<DocumentContent, "nonname_sheet">; label: string }[] = [
  { key: "summary", label: "事業の概要" },
  { key: "business_overview", label: "1. 事業基本情報" },
  { key: "products", label: "2. 商品・サービス" },
  { key: "customers", label: "3. 顧客" },
  { key: "suppliers", label: "4. 仕入・取引先" },
  { key: "operations", label: "5. オペレーション" },
  { key: "assets_licenses", label: "6. 資産・許認可" },
  { key: "risks_handover", label: "7. リスク・引継ぎ事項" },
];

const NONNAME_FIELDS: { key: keyof DocumentContent["nonname_sheet"]; label: string }[] = [
  { key: "industry_label", label: "業種" },
  { key: "region", label: "地域" },
  { key: "summary", label: "事業概要" },
  { key: "strengths", label: "強み・特徴" },
  { key: "scale", label: "規模感" },
  { key: "handover_notes", label: "引継ぎに関する希望" },
];

/** 未決済向け：概要1セクションのみの透かしプレビュー＋購入導線 */
function PreviewPane({
  projectId,
  summary,
}: {
  projectId: string;
  summary: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(
        "お支払い画面を開けませんでした。少し時間をおいて、もう一度お試しください。"
      );
    } catch {
      setError("通信に失敗しました。接続をご確認ください。");
    }
    setBusy(false);
  }

  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-xl border border-gray-200 p-6">
        {/* 透かし */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex flex-wrap content-around justify-around opacity-[0.13]"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="-rotate-12 text-3xl font-bold text-gray-900"
            >
              サンプル
            </span>
          ))}
        </div>
        <h2 className="font-semibold">事業の概要（プレビュー）</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {summary}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <p className="text-sm text-gray-600">
          🔒 以下はお支払い後にご覧いただけます
        </p>
        <ul className="mt-2 text-sm text-gray-500">
          <li>・7セクションの本文（基本情報〜リスク・引継ぎ事項）</li>
          <li>・匿名のノンネームシート（お相手に最初に見せる1枚）</li>
          <li>・内容の修正と PDF のダウンロード</li>
        </ul>
      </div>

      <div className="mt-8 rounded-xl border-2 border-blue-700 p-6 text-center">
        <p className="text-lg font-bold">
          事業概要書一式　{PRICE_JPY.toLocaleString()}円（税込・買い切り）
        </p>
        <p className="mt-1 text-sm text-gray-600">
          お支払い後、全文の確認・修正・PDFダウンロードができます。
        </p>
        <button
          onClick={() => void handleCheckout()}
          disabled={busy}
          className="mt-4 rounded-lg bg-blue-700 px-8 py-4 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {busy ? "お支払い画面を開いています…" : "購入して全文を見る"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function DocumentClient({
  projectId,
  paid,
  initialDocument,
}: {
  projectId: string;
  paid: boolean;
  initialDocument: DocumentState;
}) {
  const [doc, setDoc] = useState(initialDocument);
  const [content, setContent] = useState<DocumentContent>(
    initialDocument.content
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  const dirty = JSON.stringify(content) !== JSON.stringify(doc.content);

  // 未決済：透かしプレビューのみ
  if (!paid) {
    return (
      <PreviewPane projectId={projectId} summary={initialDocument.content.summary} />
    );
  }

  function setMain(key: keyof Omit<DocumentContent, "nonname_sheet">, v: string) {
    setContent((prev) => ({ ...prev, [key]: v }));
  }
  function setNonname(
    key: keyof DocumentContent["nonname_sheet"],
    v: string
  ) {
    setContent((prev) => ({
      ...prev,
      nonname_sheet: { ...prev.nonname_sheet, [key]: v },
    }));
  }

  async function handleEnsurePdf() {
    setBusy(true);
    setMessage(null);
    const res = await ensurePdf(projectId, doc.id);
    if (res.ok) {
      setDoc((prev) => ({ ...prev, hasPdf: true }));
      setMessage({ kind: "ok", text: "PDFを作成しました。ダウンロードできます。" });
    } else {
      setMessage({
        kind: "error",
        text: "PDFの作成に失敗しました。もう一度お試しください。",
      });
    }
    setBusy(false);
  }

  async function handleRegenerate() {
    setBusy(true);
    setMessage(null);
    const res = await regenerateDocument(projectId, content);
    if (res.ok) {
      setDoc({
        id: res.result.documentId,
        version: res.result.version,
        content,
        hasPdf: !res.result.pdfFailed,
      });
      setMessage(
        res.result.pdfFailed
          ? {
              kind: "error",
              text: "内容は保存しましたが、PDFの作成に失敗しました。もう一度「保存して再PDF化」を押してください。",
            }
          : {
              kind: "ok",
              text: `第${res.result.version}版として保存し、PDFを作り直しました。`,
            }
      );
    } else {
      setMessage({
        kind: "error",
        text: "保存に失敗しました。もう一度お試しください。",
      });
    }
    setBusy(false);
  }

  return (
    <div className="mt-8">
      {/* 操作バー */}
      <div className="sticky top-0 z-10 -mx-2 mb-8 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-sm text-gray-600">
          第{doc.version}版
          {dirty && (
            <span className="ml-2 text-amber-600">（未保存の修正あり）</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {doc.hasPdf ? (
            <a
              href={`/api/documents/${doc.id}/download`}
              className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              PDFをダウンロード
            </a>
          ) : (
            <button
              onClick={() => void handleEnsurePdf()}
              disabled={busy}
              className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              {busy ? "PDFを作成中…" : "PDFを作成する"}
            </button>
          )}
          <button
            onClick={() => void handleRegenerate()}
            disabled={busy}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {busy ? "PDFを作成中…" : "保存して再PDF化"}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`mb-6 rounded-lg border p-4 text-sm ${
            message.kind === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <p className="mb-6 text-sm text-gray-600">
        内容は自由に書き換えられます。修正したら「保存して再PDF化」を押すと、新しい版としてPDFが作り直されます。
      </p>

      <div className="flex flex-col gap-6">
        {MAIN_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              {f.label}
            </label>
            <textarea
              value={content[f.key]}
              onChange={(e) => setMain(f.key, e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <h2 className="mt-10 border-b border-gray-200 pb-2 text-lg font-bold">
        ノンネームシート（匿名の1枚）
      </h2>
      <p className="mt-2 mb-6 text-sm text-gray-600">
        お相手に最初に見せる匿名の概要です。お店や会社が特定できる情報（名前・詳しい場所・固有の取引先名）が入っていないかご確認ください。
      </p>
      <div className="flex flex-col gap-6">
        {NONNAME_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              {f.label}
            </label>
            <textarea
              value={content.nonname_sheet[f.key]}
              onChange={(e) => setNonname(f.key, e.target.value)}
              rows={f.key === "industry_label" || f.key === "region" ? 1 : 4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
