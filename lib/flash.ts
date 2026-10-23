import "server-only";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export type FlashTone = "success" | "error";

export interface Flash {
  id: number;
  message: string;
  tone: FlashTone;
}

const COOKIE = "hq_flash";

/** Queues a one-time confirmation shown after the action's re-render. */
export function setFlash(message: string, tone: FlashTone = "success"): void {
  const value: Flash = { id: Date.now(), message, tone };
  cookies().set(COOKIE, JSON.stringify(value), { path: "/", maxAge: 30, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export function readFlash(): Flash | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Flash;
    return typeof parsed.message === "string" ? parsed : null;
  } catch {
    return null;
  }
}
