import { describe, expect, it } from "vitest";
import { getTree } from "../trees";
import type { Industry } from "@/lib/types";

const INDUSTRIES: Industry[] = ["restaurant", "retail", "manufacturing"];

describe("質問ツリーの構造", () => {
  for (const industry of INDUSTRIES) {
    describe(industry, () => {
      const tree = getTree(industry);

      it("7セクションある", () => {
        expect(tree.sections).toHaveLength(7);
      });

      it("セクションIDが仕様の順序どおり", () => {
        expect(tree.sections.map((s) => s.id)).toEqual([
          "basic",
          "products",
          "customers",
          "suppliers",
          "operations",
          "assets",
          "risks",
        ]);
      });

      it("合計25〜35問である", () => {
        const total = tree.sections.reduce(
          (n, s) => n + s.questions.length,
          0
        );
        expect(total).toBeGreaterThanOrEqual(25);
        expect(total).toBeLessThanOrEqual(35);
      });

      it("質問キーが一意で、セクションIDを接頭辞に持つ", () => {
        const keys = tree.sections.flatMap((s) =>
          s.questions.map((q) => q.key)
        );
        expect(new Set(keys).size).toBe(keys.length);
        for (const section of tree.sections) {
          for (const q of section.questions) {
            expect(q.key.startsWith(`${section.id}.`)).toBe(true);
          }
        }
      });

      it("セクション1・2・7に必須質問がある（M3品質ガード用）", () => {
        for (const id of ["basic", "products", "risks"]) {
          const section = tree.sections.find((s) => s.id === id)!;
          expect(
            section.questions.some((q) => q.required),
            `${id} に required がない`
          ).toBe(true);
        }
      });

      it("全質問に質問文がある", () => {
        for (const section of tree.sections) {
          for (const q of section.questions) {
            expect(q.text.length).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});
