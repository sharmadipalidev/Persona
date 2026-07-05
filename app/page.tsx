import { ChatStudio } from "@/components/chat/chat-studio";

export default function Home() {
  return (
    <div className="relative flex h-dvh w-full items-center justify-center bg-[#eaeaea] dark:bg-[#151515] p-0 sm:p-3 md:p-4 lg:p-5 transition-colors duration-300">
      {/* Mesh grid over the very background */}
      <div className="studio-grid pointer-events-none absolute inset-0 opacity-[0.1] dark:opacity-[0.2]" />

      {/* Main app panel — resembling the rounded device studio frame in the image */}
      <div className="relative z-10 flex h-full w-full max-w-[1360px] flex-col overflow-hidden rounded-none sm:rounded-2xl border border-border/80 bg-background shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] transition-all">
        <ChatStudio />
      </div>
    </div>
  );
}
