// "Fresh finds": the searches a user saves in Vinted so that Vinted notifies them
// about new matching items. The app only manages this list; Vinted sends the items.

export interface AlertSearch {
  id: string;
  title: string;
  query: string;
  group: "clothing" | "trousers" | "shoes" | "none";
  maxPrice?: number | null;
  why: string;
  savedInVinted: boolean;
}

/** Stable identity for an alert: same words and group mean the same Vinted search. */
export function alertKey(a: Pick<AlertSearch, "query" | "group">): string {
  return `${a.group}:${a.query.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export interface AlertDiff<T extends Pick<AlertSearch, "query" | "group">> {
  add: T[];
  remove: AlertSearch[];
  keep: AlertSearch[];
}

/** Compares the user's current alerts with a freshly proposed set. */
export function diffAlerts<T extends Pick<AlertSearch, "query" | "group">>(current: AlertSearch[], proposed: T[]): AlertDiff<T> {
  const proposedKeys = new Set(proposed.map(alertKey));
  const currentKeys = new Set(current.map(alertKey));
  return {
    add: proposed.filter((p) => !currentKeys.has(alertKey(p))),
    remove: current.filter((c) => !proposedKeys.has(alertKey(c))),
    keep: current.filter((c) => proposedKeys.has(alertKey(c))),
  };
}

/** Applies a diff, keeping the "saved in Vinted" ticks of the alerts that stay. */
export function applyDiff(
  current: AlertSearch[],
  diff: AlertDiff<Omit<AlertSearch, "id" | "savedInVinted">>,
  makeId: () => string,
): AlertSearch[] {
  const removed = new Set(diff.remove.map(alertKey));
  const kept = current.filter((c) => !removed.has(alertKey(c)));
  const added = diff.add.map((a) => ({ ...a, id: makeId(), savedInVinted: false }));
  return [...kept, ...added];
}

/** Meteorological season, used for the gentle "refresh your alerts" reminder. */
export function seasonOf(date: Date): "winter" | "spring" | "summer" | "autumn" {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

export function needsSeasonalRefresh(lastRefreshIso: string | null | undefined, now: Date): boolean {
  if (!lastRefreshIso) return false;
  const last = new Date(lastRefreshIso);
  if (Number.isNaN(last.getTime())) return false;
  return seasonOf(last) !== seasonOf(now) || now.getTime() - last.getTime() > 1000 * 60 * 60 * 24 * 100;
}
