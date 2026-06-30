export default function BriefingLoading() {
  return (
    <div className="px-8 py-6 w-full h-full flex flex-col max-w-none relative overflow-y-auto select-none bg-transparent pb-24">
      <div className="relative z-10 flex flex-col w-full max-w-5xl mx-auto flex-1 gap-8">

        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 animate-pulse" />
              <div className="h-8 w-44 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl animate-pulse" />
            </div>
            <div className="h-4 w-72 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Audio panel skeleton */}
        <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse" />
              <div className="h-3 w-48 bg-slate-100/80 dark:bg-slate-700/50 rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Waveform bars skeleton */}
          <div className="flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-6 gap-1">
            {Array.from({ length: 22 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"
                style={{
                  height: `${8 + Math.sin(i * 0.8) * 12 + Math.cos(i * 0.5) * 8}px`,
                  animationDelay: `${i * 40}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Metrics widgets skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[1.5rem] p-5 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.03)] flex items-start gap-4"
            >
              <div className="p-3 rounded-2xl shrink-0 animate-pulse"
                style={{ background: i === 1 ? 'rgba(99,102,241,0.1)' : i === 2 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)' }}
              >
                <div className="w-5 h-5 rounded-md bg-slate-300/60 dark:bg-slate-700/60 animate-pulse" />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="h-2.5 w-20 bg-slate-200/70 dark:bg-slate-800/70 rounded-md animate-pulse" />
                <div className="h-5 w-32 bg-slate-200/80 dark:bg-slate-700/80 rounded-lg animate-pulse" />
                <div className="h-3 w-full bg-slate-100/70 dark:bg-slate-800/50 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* AI Summary panel skeleton */}
        <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.04)]">
          {/* Panel header */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200/50 dark:border-white/10 pb-4">
            <div className="w-5 h-5 rounded-full bg-orange-300/50 dark:bg-orange-800/50 animate-pulse" />
            <div className="h-4 w-48 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse" />
          </div>

          {/* Generating indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
              AI is generating your executive briefing…
            </span>
          </div>

          {/* Text lines skeleton */}
          <div className="space-y-3">
            <div className="h-3.5 w-32 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg animate-pulse" />
            {[100, 90, 85, 70, 95, 60, 80].map((pct, i) => (
              <div
                key={i}
                className="h-3 bg-slate-100/90 dark:bg-slate-800/60 rounded-md animate-pulse"
                style={{ width: `${pct}%`, animationDelay: `${i * 60}ms` }}
              />
            ))}
            <div className="pt-4">
              <div className="h-3.5 w-28 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg animate-pulse mb-3" />
              {[75, 88, 65].map((pct, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 animate-pulse shrink-0" />
                  <div
                    className="h-3 bg-slate-100/90 dark:bg-slate-800/60 rounded-md animate-pulse"
                    style={{ width: `${pct}%`, animationDelay: `${i * 80}ms` }}
                  />
                </div>
              ))}
            </div>
            <div className="pt-2">
              <div className="h-3.5 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg animate-pulse mb-3" />
              {[70, 82].map((pct, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/60 animate-pulse shrink-0" />
                  <div
                    className="h-3 bg-slate-100/90 dark:bg-slate-800/60 rounded-md animate-pulse"
                    style={{ width: `${pct}%`, animationDelay: `${i * 80}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
