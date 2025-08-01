// ~/appwrite/cache.ts
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds

export const cachedQuery = async (key: string, queryFn: () => Promise<any>) => {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key)!;
    if (Date.now() - timestamp < CACHE_TTL) return data;
  }

  const data = await queryFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
