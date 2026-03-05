import { describe, expect, test } from "bun:test";
import { buildAdminReplyPayload } from "../src/commands/replyPayload.ts";
import { CLIError } from "../src/utils/output.ts";

describe("buildAdminReplyPayload", () => {
  test("defaults message_type to comment", () => {
    const payload = buildAdminReplyPayload({
      adminId: "1",
      body: "hello",
    });

    expect(payload.message_type).toBe("comment");
    expect(payload.type).toBe("admin");
    expect(payload.admin_id).toBe("1");
    expect(payload.body).toBe("hello");
  });

  test("uses --type note", () => {
    const payload = buildAdminReplyPayload({
      adminId: "1",
      body: "internal note",
      messageType: "note",
    });

    expect(payload.message_type).toBe("note");
  });

  test("uses message_type from --json when --type is absent", () => {
    const payload = buildAdminReplyPayload({
      adminId: "1",
      body: "internal note",
      json: '{"message_type":"note"}',
    });

    expect(payload.message_type).toBe("note");
  });

  test("prioritizes --type over json message_type", () => {
    const payload = buildAdminReplyPayload({
      adminId: "1",
      body: "public reply",
      messageType: "comment",
      json: '{"message_type":"note"}',
    });

    expect(payload.message_type).toBe("comment");
  });

  test("keeps additional fields from json", () => {
    const payload = buildAdminReplyPayload({
      adminId: "1",
      body: "reply",
      json: '{"attachment_urls":["https://example.com/a.png"],"created_at":1700000000}',
    });

    expect(payload.attachment_urls).toEqual(["https://example.com/a.png"]);
    expect(payload.created_at).toBe(1700000000);
  });

  test("does not allow json to override fixed fields", () => {
    const payload = buildAdminReplyPayload({
      adminId: "1",
      body: "final body",
      json: '{"type":"user","admin_id":"999","body":"wrong"}',
    });

    expect(payload.type).toBe("admin");
    expect(payload.admin_id).toBe("1");
    expect(payload.body).toBe("final body");
  });

  test("rejects invalid --type", () => {
    expect(() =>
      buildAdminReplyPayload({
        adminId: "1",
        body: "hello",
        messageType: "quick_reply",
      }),
    ).toThrow(CLIError);
  });

  test("rejects invalid json message_type", () => {
    expect(() =>
      buildAdminReplyPayload({
        adminId: "1",
        body: "hello",
        json: '{"message_type":"quick_reply"}',
      }),
    ).toThrow(CLIError);
  });

  test("rejects non-object json", () => {
    expect(() =>
      buildAdminReplyPayload({
        adminId: "1",
        body: "hello",
        json: '["not-an-object"]',
      }),
    ).toThrow(CLIError);
  });
});
