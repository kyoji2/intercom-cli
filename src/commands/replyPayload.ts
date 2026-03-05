import { CLIError } from "../utils/index.ts";

type ReplyPayloadInput = {
  adminId: string;
  body: string;
  messageType?: string;
  json?: string;
};

export type ReplyBodyPayload = {
  message_type: "comment" | "note";
  type: "admin";
  admin_id: string;
  body: string;
} & Record<string, unknown>;

function validateReplyType(value: unknown, source: "--type" | "--json"): "comment" | "note" {
  if (value !== "comment" && value !== "note") {
    throw new CLIError(`Invalid ${source} value for message type: ${String(value)}`, 400, "Use comment or note.");
  }
  return value;
}

export function buildAdminReplyPayload(input: ReplyPayloadInput): ReplyBodyPayload {
  const parsed = input.json ? JSON.parse(input.json) : {};

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new CLIError("Invalid --json value. Expected a JSON object.", 400);
  }

  const messageTypeFromJson =
    Object.hasOwn(parsed, "message_type") && (parsed as Record<string, unknown>).message_type !== undefined
      ? validateReplyType((parsed as Record<string, unknown>).message_type, "--json")
      : undefined;
  const messageType = input.messageType
    ? validateReplyType(input.messageType, "--type")
    : (messageTypeFromJson ?? "comment");

  return {
    ...(parsed as Record<string, unknown>),
    message_type: messageType,
    type: "admin",
    admin_id: input.adminId,
    body: input.body,
  };
}
