import { ChatStudio } from "@/components/chat/chat-studio";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {/* Premium subtle mesh grid in the background */}
      <div className="studio-grid pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.15]" />

      <div className="relative z-10 flex h-full w-full flex-col max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-full min-h-0 flex-col border-x border-border/80 bg-background/50 backdrop-blur-sm shadow-2xl">
          {/* Main App Bar Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 border border-primary/20 text-primary font-bold text-lg">
                🎙️
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
                  GenAI Broadcast Suite
                </p>
                <h1 className="font-display text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                  Mentor Studio
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status Badges */}
              <div className="hidden items-center gap-4 text-xs font-mono text-muted-foreground sm:flex">
                <span className="flex items-center gap-2 rounded-sm border border-border bg-card/40 px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
                  Hitesh Active
                </span>
                <span className="flex items-center gap-2 rounded-sm border border-border bg-card/40 px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]" />
                  Piyush Active
                </span>
              </div>

              {/* Theme Switcher */}
              <ThemeToggle />
            </div>
          </header>

          {/* Core Chat Container */}
          <ChatStudio />
        </div>
      </div>
    </div>
  );
}
