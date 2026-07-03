export default function PageShell({ eyebrow, title, action, children }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-saffron">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
