// Decorative card thumbnails for the left panel
const PREVIEW_CARDS = [
  { bg: 'from-blue-100 to-blue-50', accent: 'bg-blue-300' },
  { bg: 'from-slate-200 to-slate-100', accent: 'bg-slate-400' },
  { bg: 'from-emerald-100 to-emerald-50', accent: 'bg-emerald-300' },
  { bg: 'from-violet-100 to-violet-50', accent: 'bg-violet-300' },
  { bg: 'from-amber-100 to-amber-50', accent: 'bg-amber-300' },
  { bg: 'from-rose-100 to-rose-50', accent: 'bg-rose-300' },
  { bg: 'from-cyan-100 to-cyan-50', accent: 'bg-cyan-300' },
  { bg: 'from-indigo-100 to-indigo-50', accent: 'bg-indigo-300' },
]

function PreviewCard({ bg, accent }: { bg: string; accent: string }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br ${bg} p-3 flex flex-col gap-2`}>
      <div className={`w-6 h-6 rounded-md ${accent} opacity-70`} />
      <div className="h-1.5 w-3/4 rounded-full bg-black/10" />
      <div className="h-1.5 w-1/2 rounded-full bg-black/10" />
    </div>
  )
}

export function AuthBrandingPanel() {
  return (
    <div className="md:w-1/2 bg-[#f6f3f4] flex flex-col p-10 md:p-14">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#005ac2] to-[#004fab] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.5" />
            <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
        <span className="font-display font-semibold text-[#323235] text-lg tracking-tight">
          JobTrackr
        </span>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Hero copy */}
        <div>
          <h1 className="font-display font-bold text-[#323235] text-4xl md:text-5xl leading-tight tracking-tight">
            Track every application.
            <br />
            <span className="text-[#005ac2]">Land your next role.</span>
          </h1>
          <p className="mt-4 font-body text-[#5f5f61] text-base leading-relaxed max-w-sm">
            Paste a job URL and our AI extracts everything — company, role, salary, tech stack.
            Your personal dashboard, always up to date.
          </p>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['#005ac2', '#7c3aed', '#059669', '#d97706'].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#f6f3f4] flex items-center justify-center text-white text-xs font-body font-semibold"
                  style={{ backgroundColor: color }}
                >
                  {['A', 'M', 'S', 'R'][i]}
                </div>
              ))}
            </div>
            <p className="font-body text-sm text-[#5f5f61]">
              Join thousands tracking their job search
            </p>
          </div>
        </div>

        {/* Decorative preview grid */}
        <div className="mt-12 grid grid-cols-4 gap-3">
          {PREVIEW_CARDS.map((card, i) => (
            <PreviewCard key={i} bg={card.bg} accent={card.accent} />
          ))}
        </div>
      </div>
    </div>
  )
}
