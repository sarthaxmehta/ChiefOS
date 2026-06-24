"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export function CurrentTime() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <span className="opacity-0">00:00 am</span>;

  return <span>{format(time, "h:mm a").toLowerCase()}</span>;
}
