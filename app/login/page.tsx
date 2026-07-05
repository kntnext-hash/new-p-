import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata = {
  title: "ログイン | ツグモノ",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">ログイン / 新規登録</h1>
      <p className="mb-8 text-sm text-gray-600">
        メールアドレスを入力すると、ログイン用のリンクをお送りします。
        パスワードは不要です。
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
