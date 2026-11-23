"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrosshairSimple, TreeStructure, PresentationChart } from "@phosphor-icons/react";

const LINKS = [
  { href: "/", label: "Desk", icon: CrosshairSimple },
  { href: "/architecture", label: "How it works", icon: TreeStructure },
  { href: "/deck", label: "Deck", icon: PresentationChart },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
        {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => (r + c) % 2 === 0 && <rect key={`${r}${c}`} x={c * 5} y={r * 5} width="4" height="4" rx="1" fill="currentColor" opacity={1 - (r + c) * 0.11} />))}
      </svg>
      <span className="font-serif text-lg">Signal Desk</span>
    </Link>
  );
}

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-2 hidden h-[calc(100vh-1rem)] w-56 shrink-0 flex-col py-3 lg:flex">
      <Logo />
      <nav className="mt-6 grid gap-0.5">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-fg2 hover:bg-component-hover hover:text-fg aria-[current=page]:bg-component aria-[current=page]:text-fg">
            <Icon size={16} weight={path === href ? "fill" : "regular"} />{label}
          </Link>
        ))}
      </nav>
      <p className="mt-auto px-2 text-xs leading-relaxed text-fg3">Prototype for Lifesight. Demo data only, nothing is ever sent.</p>
    </aside>
  );
}

export function TopBar() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1 px-1 pb-2 lg:hidden">
      <Logo />
      <div className="ml-auto flex">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-label={label} aria-current={path === href ? "page" : undefined}
            className="grid size-9 place-items-center rounded-lg text-fg2 aria-[current=page]:bg-component aria-[current=page]:text-fg">
            <Icon size={18} weight={path === href ? "fill" : "regular"} />
          </Link>
        ))}
      </div>
    </nav>
  );
}
