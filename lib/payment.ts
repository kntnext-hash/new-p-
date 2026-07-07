import type { ProjectStatus } from "./types";

/** 支払い済み（＝PDF全文の生成・DLが解禁されている）か */
export function isPaid(status: ProjectStatus): boolean {
  return status === "paid" || status === "generated";
}
