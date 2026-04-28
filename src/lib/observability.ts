type CounterKey = string;

const counters = new Map<CounterKey, number>();
const startsAt = Date.now();

export function metricIncr(key: string, by = 1) {
  counters.set(key, (counters.get(key) ?? 0) + by);
}

export function metricSnapshot() {
  return {
    uptimeMs: Date.now() - startsAt,
    counters: Object.fromEntries(counters.entries()),
  };
}

export function logEvent(
  level: "info" | "warn" | "error",
  event: string,
  payload: Record<string, unknown> = {}
) {
  const out = {
    ts: new Date().toISOString(),
    level,
    event,
    ...payload,
  };
  if (level === "error") {
    console.error(JSON.stringify(out));
  } else if (level === "warn") {
    console.warn(JSON.stringify(out));
  } else {
    console.log(JSON.stringify(out));
  }
}
