import { describe, expect, it } from "vitest";
import { MAX_MESSAGES, mergeMessages, messagePage, messagePageFilter } from "./paging";

/** Ids that sort the way real ObjectIds do: monotonic hex. */
const id = (n: number) => `65a0000000000000000000${n.toString(16).padStart(2, "0")}`;
const msg = (n: number) => ({ _id: id(n), body: `m${n}` });

describe("messagePageFilter", () => {
  it("asks for the whole thread when there is no cursor", () => {
    expect(messagePageFilter("t1")).toEqual({ threadId: "t1" });
    expect(messagePageFilter("t1", null)).toEqual({ threadId: "t1" });
  });

  it("pages strictly before the cursor, so the cursor is not re-sent", () => {
    expect(messagePageFilter("t1", id(50))).toEqual({
      threadId: "t1",
      _id: { $lt: id(50) },
    });
  });
});

describe("messagePage", () => {
  it("returns the page in reading order", () => {
    // The query sorts newest first; the UI reads oldest first.
    const rows = [msg(3), msg(2), msg(1)];
    expect(messagePage(rows, 10).page.map((m) => m.body)).toEqual(["m1", "m2", "m3"]);
  });

  it("reports no more when the read came back short", () => {
    expect(messagePage([msg(2), msg(1)], 2).hasMore).toBe(false);
  });

  it("uses the extra row only as a has-more signal, never as content", () => {
    // Callers read max + 1 rows; the extra one must not reach the client.
    const rows = [msg(3), msg(2), msg(1)];
    const { page, hasMore } = messagePage(rows, 2);
    expect(hasMore).toBe(true);
    expect(page.map((m) => m.body)).toEqual(["m2", "m3"]);
  });

  it("defaults to the shared window size", () => {
    const rows = Array.from({ length: MAX_MESSAGES + 1 }, (_, i) => msg(i));
    expect(messagePage(rows).page).toHaveLength(MAX_MESSAGES);
  });
});

describe("mergeMessages", () => {
  it("orders a loaded-earlier page ahead of the live window", () => {
    const older = [msg(1), msg(2)];
    const live = [msg(3), msg(4)];
    expect(mergeMessages(older, live).map((m) => m.body)).toEqual(["m1", "m2", "m3", "m4"]);
  });

  it("keeps an overlapping message once", () => {
    expect(mergeMessages([msg(1), msg(2)], [msg(2), msg(3)])).toHaveLength(3);
  });

  it("keeps a message the live window has pushed out of range", () => {
    // Long thread: the client holds m1..m3, then a poll returns only the
    // newest two. Without the merge m1 would vanish mid-read.
    const held = [msg(1), msg(2), msg(3)];
    const poll = [msg(2), msg(3), msg(4)];
    expect(mergeMessages(held, poll).map((m) => m.body)).toEqual(["m1", "m2", "m3", "m4"]);
  });

  it("prefers the newer copy of a message it already had", () => {
    const merged = mergeMessages([{ _id: id(1), body: "stale" }], [{ _id: id(1), body: "fresh" }]);
    expect(merged).toEqual([{ _id: id(1), body: "fresh" }]);
  });
});
