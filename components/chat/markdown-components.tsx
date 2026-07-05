import type { ReactElement } from "react";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

function getLanguage(className?: string): string | null {
  const match = /language-([\w-]+)/.exec(className ?? "");
  return match?.[1] ?? null;
}

export const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="my-1.5 leading-relaxed last:mb-0">{children}</p>
  ),

  h1: ({ children }) => (
    <h1 className="mb-1.5 mt-2 text-sm font-semibold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-2 text-sm font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-1.5 text-[13px] font-semibold">{children}</h3>
  ),

  ul: ({ children }) => (
    <ul className="my-1.5 list-disc space-y-0.5 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1.5 list-decimal space-y-0.5 pl-4">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#06b6d4] underline underline-offset-2 hover:text-[#22d3ee]"
    >
      {children}
    </a>
  ),

  hr: () => <hr className="my-3 border-border" />,

  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),

  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-sm border border-border">
      <table className="w-full min-w-[16rem] border-collapse text-xs">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border bg-muted/50">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),
  tr: ({ children }) => <tr className="hover:bg-muted/20">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-muted-foreground">{children}</td>
  ),

  pre: ({ children }) => {
    const codeChild = children as ReactElement<{
      className?: string;
    }>;
    const lang = getLanguage(codeChild?.props?.className);

    return (
      <div className="group relative my-2">
        {lang ? (
          <div className="flex items-center justify-between rounded-t-sm border border-b-0 border-border bg-muted/40 px-2.5 py-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {lang}
            </span>
          </div>
        ) : null}
        <pre
          className={cn(
            "hljs overflow-x-auto border border-border bg-[#0d1117] p-3 font-mono text-[11px] leading-relaxed",
            lang ? "rounded-b-sm rounded-t-none" : "rounded-sm",
          )}
        >
          {children}
        </pre>
      </div>
    );
  },

  code: ({ className, children, ...props }) => {
    const lang = getLanguage(className);
    const text = String(children).replace(/\n$/, "");
    const isBlock = Boolean(lang) || text.includes("\n");

    if (isBlock) {
      return (
        <code className={cn("hljs font-mono", className)} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        className={cn(
          "rounded-sm bg-muted/70 px-1 py-px font-mono text-[11px] text-[#e8eaed]",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
};
