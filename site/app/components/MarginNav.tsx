"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Section } from "@/lib/pages";

export type MarginNavPage = { href: string; label: string; current: boolean };

/* The margin of a docs page: the six pages as a list, the § sections of the current one under it, the one being read marked.
   From 1024 px it is the left column; under that it sits behind one « Contents » control under the bar. */
export default function MarginNav({
  pages,
  sections,
  label,
  contents,
}: Readonly<{ pages: MarginNavPage[]; sections: { id: string; n: number | null; title: string }[]; label: string; contents: string }>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const heads = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => e !== null);
    const update = () => {
      const passed = heads.filter((h) => h.getBoundingClientRect().top <= 140);
      setActive((passed.at(-1) ?? heads[0])?.id ?? null);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [sections]);

  return (
    <nav aria-label={label} className="kz-margin-nav" data-open={open}>
      <button type="button" className="kz-margin-toggle" aria-expanded={open} aria-controls="kz-margin-list" onClick={() => setOpen(!open)}>
        {contents}
      </button>
      <ol id="kz-margin-list" className="kz-margin-list">
        {pages.map((p) => (
          <li key={p.href}>
            <Link href={p.href} aria-current={p.current ? "page" : undefined}>
              {p.label}
            </Link>
            {p.current && sections.length > 0 && (
              <ol className="kz-margin-sections">
                {sections.map((s: Section) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined} onClick={() => setOpen(false)}>
                      {s.n !== null && <span className="kz-margin-n">{`§ ${s.n}`}</span>}
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
