const COLLECTION_KEYS = ["data", "threads", "items"];

export function scopeThreadList(result, { excludedThreadIds = new Set(), limit = 20 } = {}) {
  if (!result || typeof result !== "object") return result;
  const collectionKey = COLLECTION_KEYS.find((key) => Array.isArray(result[key]));
  if (!collectionKey) return result;
  const excluded = excludedThreadIds instanceof Set
    ? excludedThreadIds
    : new Set(excludedThreadIds);
  return {
    ...result,
    [collectionKey]: result[collectionKey]
      .filter((thread) => !excluded.has(thread.id))
      .slice(0, limit),
  };
}
