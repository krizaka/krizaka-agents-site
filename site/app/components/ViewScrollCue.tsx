"use client";
import { useEffect, useRef, useState } from "react";

/* The kit keeps a drawing legible (a minimum scale) and scrolls it in its frame when its column is narrower: this line says so, only
   while the frame really scrolls, so a reader knows there is more to the right. The words under the drawing stay the plain reading. */
export default function ViewScrollCue({ text }: Readonly<{ text: string }>) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const frame = ref.current?.parentElement?.querySelector(".kz-arch-frame");
    if (!frame) return;
    const update = () => setScrolls(frame.scrollWidth > frame.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  return (
    <p ref={ref} className="kz-view-cue" hidden={!scrolls}>
      <span aria-hidden="true">⇢ </span>
      {text}
    </p>
  );
}
