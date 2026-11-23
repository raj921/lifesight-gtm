"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Desk" },
  { href: "/architecture", label: "Architecture" },
  { href: "/deck", label: "Deck" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 md:gap-6 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <circle cx="11" cy="11" r="3" fill="var(--heat)" />
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="var(--heat)" strokeOpacity=".55" strokeWidth="1.4" />
            <circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="1.2" />
          </svg>
          <span className="font-display text-lg leading-none whitespace-nowrap">Signal Desk</span>
          <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">for Lifesight · prototype</span>
        </Link>
        <div className="ml-auto flex gap-0.5 md:gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path === l.href ? "page" : undefined}
              className="whitespace-nowrap rounded px-2 py-1.5 text-[13px] md:px-3 md:text-sm text-muted-foreground hover:text-foreground aria-[current=page]:bg-secondary aria-[current=page]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
