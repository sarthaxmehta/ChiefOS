export default function Loading() {
  return (
    <div className="px-8 py-6 w-full h-full flex flex-col max-w-none relative overflow-hidden select-none bg-transparent animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-4 w-72 bg-neutral-100 dark:bg-neutral-900 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-neutral-100 dark:bg-neutral-900 rounded-full" />
          <div className="h-10 w-28 bg-neutral-100 dark:bg-neutral-900 rounded-full" />
        </div>
      </div>

      {/* Grid Columns Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow min-h-0 pb-4">
        {Array.from({ length: 4 }).map((_, colIdx) => (
          <div 
            key={colIdx} 
            className="bg-neutral-100/40 dark:bg-neutral-950/20 border border-neutral-200/50 dark:border-white/5 rounded-[2.5rem] p-5 flex flex-col h-full space-y-5"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/10 shrink-0">
              <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-5 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            </div>

            {/* Lane Items */}
            <div className="flex-grow space-y-4 overflow-hidden">
              {Array.from({ length: 3 }).map((_, itemIdx) => (
                <div 
                  key={itemIdx} 
                  className="bg-white/60 dark:bg-slate-900/60 border border-neutral-200/40 dark:border-slate-800/80 p-5 rounded-[1.25rem] space-y-3.5 flex flex-col"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                    <div className="flex-grow space-y-2 min-w-0">
                      <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                      <div className="h-3 w-5/6 bg-neutral-100 dark:bg-neutral-900 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-150/10">
                    <div className="h-4 w-12 bg-neutral-100 dark:bg-neutral-900 rounded-full" />
                    <div className="h-4 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
