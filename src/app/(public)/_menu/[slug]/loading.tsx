export default function PublicMenuLoading() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-6">
      <div className="animate-pulse space-y-4.5">
        <div className="space-y-2">
          <div className="h-3 w-36 rounded-full bg-muted" />
          <div className="h-9 w-52 rounded-xl bg-muted" />
        </div>

        <div className="space-y-2.5">
          <div className="h-3 w-44 rounded-full bg-muted" />
          <div className="flex gap-2.5 overflow-hidden">
            <div className="w-[244px] shrink-0 rounded-3xl border border-border/50 bg-card/70 p-2.5">
              <div className="mb-2 aspect-[16/10] w-full rounded-2xl bg-muted" />
              <div className="h-5 w-2/3 rounded-md bg-muted" />
            </div>
            <div className="w-[244px] shrink-0 rounded-3xl border border-border/50 bg-card/70 p-2.5 opacity-70">
              <div className="mb-2 aspect-[16/10] w-full rounded-2xl bg-muted" />
              <div className="h-5 w-1/2 rounded-md bg-muted" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/70 p-2.5">
          <div className="mb-2.5 flex gap-2 overflow-hidden">
            <div className="h-8.5 w-20 rounded-full bg-muted" />
            <div className="h-8.5 w-28 rounded-full bg-muted" />
            <div className="h-8.5 w-20 rounded-full bg-muted" />
          </div>
          <div className="mb-2.5 flex gap-2 overflow-hidden">
            <div className="h-8.5 w-16 rounded-full bg-muted" />
            <div className="h-8.5 w-20 rounded-full bg-muted" />
            <div className="h-8.5 w-14 rounded-full bg-muted" />
          </div>
        </div>

        <div className="space-y-2.5">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="rounded-[22px] border border-border/50 bg-card/70 p-3.5">
              <div className="mb-3 aspect-video w-full rounded-2xl bg-muted" />
              <div className="mb-2 h-8 w-3/5 rounded-md bg-muted" />
              <div className="mb-2 h-4 w-full rounded-md bg-muted" />
              <div className="mb-3 h-4 w-4/5 rounded-md bg-muted" />
              <div className="mb-2.5 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-muted" />
                <div className="h-6 w-20 rounded-full bg-muted" />
              </div>
              <div className="h-6 w-20 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
