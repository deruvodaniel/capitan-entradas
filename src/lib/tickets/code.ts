import { nanoid } from "nanoid";

export function generateTicketCode(): string {
  return `CPT-${nanoid(6).toUpperCase()}`;
}
