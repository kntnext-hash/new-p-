"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const next = searchParams.get("next") ?? "/projects";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        "メールの送信に失敗しました。アドレスをご確認のうえ、もう一度お試しください。"
      );
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-900">
        <p className="font-semibold">メールをお送りしました</p>
        <p className="mt-2 text-sm">
          {email} 宛にログイン用のリンクをお送りしました。
          メールを開いて、リンクを押してください。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">メールアドレス</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="例：yamada@example.com"
          className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
        />
      </label>
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-blue-700 px-4 py-3 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {status === "sending" ? "送信中…" : "ログインリンクを送る"}
      </button>
    </form>
  );
}
