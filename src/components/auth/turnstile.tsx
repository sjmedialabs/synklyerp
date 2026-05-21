"use client";

import { useEffect, useRef } from "react";
export function captchaEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

type TurnstileProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
};

export function TurnstileWidget({ onToken, onExpire }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!captchaEnabled() || !siteKey || !ref.current) return;

    const render = () => {
      if (!window.turnstile || !ref.current) return;
      if (widgetId.current) window.turnstile.remove(widgetId.current);
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": onExpire,
        theme: "auto",
      });
    };

    if (window.turnstile) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = render;
    document.body.appendChild(script);

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [onToken, onExpire, siteKey]);

  if (!captchaEnabled() || !siteKey) return null;

  return <div ref={ref} className="flex justify-center py-2" />;
}
