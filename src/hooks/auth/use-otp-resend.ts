"use client";

import { useCallback, useEffect, useState } from "react";

export function useOtpResend(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const startCooldown = useCallback((value: number) => {
    setSeconds(value);
  }, []);

  return { seconds, canResend: seconds <= 0, startCooldown };
}
