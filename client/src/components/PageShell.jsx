export default function PageShell({ eyebrow, title, action, children }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b border-black/5 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-saffron">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
