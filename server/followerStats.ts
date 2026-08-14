export function resolveDisplayedFollowerCount(
  baseline: number | null | undefined,
  distinctRealFollowers: number,
): number {
  const safeBaseline = Math.max(0, Math.trunc(baseline ?? 0));
  const safeRealFollowers = Math.max(0, Math.trunc(distinctRealFollowers));
  return safeBaseline + safeRealFollowers;
}
