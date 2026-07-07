export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-8 w-64 animate-pulse rounded bg-gray-100" />
      <div className="mt-8 h-32 animate-pulse rounded-xl bg-gray-100" />
      <div className="mt-4 h-32 animate-pulse rounded-xl bg-gray-100" />
    </main>
  );
}
