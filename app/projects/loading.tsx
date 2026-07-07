export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
      <div className="mt-8 space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </main>
  );
}
