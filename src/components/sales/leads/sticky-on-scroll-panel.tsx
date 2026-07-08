"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TOP_OFFSET = 16;

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function StickyOnScrollPanel({ children, className }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const [coords, setCoords] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const slot = slotRef.current;
    const panel = panelRef.current;
    if (!slot || !panel) return;

    const scrollParent = slot.closest("main") ?? window;

    const measure = () => {
      const slotRect = slot.getBoundingClientRect();
      const height = panel.offsetHeight;
      setPanelHeight(height);
      setCoords({ left: slotRect.left, width: slotRect.width });

      const pin = slotRect.top <= TOP_OFFSET && slotRect.bottom > TOP_OFFSET + height;
      setPinned(pin);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    ro.observe(slot);

    scrollParent.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();

    return () => {
      ro.disconnect();
      scrollParent.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={slotRef} className={cn("relative", className)}>
      {pinned && <div aria-hidden style={{ height: panelHeight }} />}
      <div
        ref={panelRef}
        className={cn(pinned && "z-10")}
        style={
          pinned
            ? {
                position: "fixed",
                top: TOP_OFFSET,
                left: coords.left,
                width: coords.width,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
