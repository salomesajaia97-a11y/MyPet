/**
 * Paging rules for a conversation's messages, kept out of the route handler so
 * they can be tested without a database.
 *
 * The chat page re-fetches the thread every five seconds, so it asks for a
 * bounded window (the newest MAX_MESSAGES) rather than the whole history. To
 * read further back it passes the oldest id it already holds as a cursor.
 */

/** Messages returned per request. Older ones stay in the database. */
export const MAX_MESSAGES = 200;

/**
 * Query for one page of a thread's messages, newest first.
 *
 * The cursor is the message `_id` rather than `createdAt`: ids are unique and
 * ordered by insertion, so paging cannot skip or repeat a message that shares
 * a timestamp with its neighbour. Callers must validate `before` as an
 * ObjectId — Mongoose casts the string, and an unparseable one throws.
 */
export function messagePageFilter(threadId: unknown, before?: string | null) {
  return before ? { threadId, _id: { $lt: before } } : { threadId };
}

/**
 * Split a `limit + 1` read into the page itself and whether anything was left
 * behind it. Input is newest-first (as the query returns it); output is in
 * reading order.
 */
export function messagePage<T>(rows: T[], max: number = MAX_MESSAGES): { page: T[]; hasMore: boolean } {
  return { page: rows.slice(0, max).reverse(), hasMore: rows.length > max };
}

/**
 * Merge two lists of messages into one ordered history, dropping duplicates.
 *
 * Needed because the live window is only the newest MAX_MESSAGES: on a long
 * thread, a new arrival pushes the oldest message out of that window, and a
 * view that had loaded earlier pages would otherwise see it disappear. Sorting
 * by `_id` restores insertion order — hex ObjectIds compare lexicographically
 * in the same order they were generated.
 */
export function mergeMessages<T extends { _id: string }>(a: T[], b: T[]): T[] {
  const byId = new Map<string, T>();
  for (const m of a) byId.set(m._id, m);
  for (const m of b) byId.set(m._id, m);
  return [...byId.values()].sort((x, y) => (x._id < y._id ? -1 : x._id > y._id ? 1 : 0));
}
