"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MissingItem {
  key: string;
  text: string;
  section: string;
}

export default function GenerateButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<MissingItem[]>([]);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    setMissing([]);
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        router.push(`/projects/${projectId}/document`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.error === "insufficient_answers") {
        setMissing(data.missing ?? []);
        setError(
          "大事な質問にいくつか未回答があるため、まだ概要書を作れません。以下の質問にお答えください。"
        );
      } else if (res.status === 402) {
        setError("お支払いの確認ができませんでした。");
      } else {
        setError(
          "概要書の作成に失敗しました。少し時間をおいて、もう一度お試しください。"
        );
      }
    } catch {
      setError(
        "通信に失敗しました。接続をご確認のうえ、もう一度お試しください。"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => void handleGenerate()}
        disabled={busy}
        className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {busy ? "作成中…（1分ほどかかります）" : "概要書を作成する"}
      </button>
      {error && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </p>
      )}
      {missing.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 p-4 text-sm">
          <ul className="flex flex-col gap-1 text-gray-700">
            {missing.map((m) => (
              <li key={m.key}>
                ・（{m.section}）{m.text}
              </li>
            ))}
          </ul>
          <Link
            href={`/projects/${projectId}/interview`}
            className="mt-3 inline-block font-semibold text-blue-700 hover:underline"
          >
            回答画面へ →
          </Link>
        </div>
      )}
    </div>
  );
}
