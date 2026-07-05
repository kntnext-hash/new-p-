import type { Industry } from "@/lib/types";
import type { InterviewTree } from "../types";
import { restaurantTree } from "./restaurant";
import { retailTree } from "./retail";
import { manufacturingTree } from "./manufacturing";

const TREES: Record<Industry, InterviewTree> = {
  restaurant: restaurantTree,
  retail: retailTree,
  manufacturing: manufacturingTree,
};

export function getTree(industry: Industry): InterviewTree {
  return TREES[industry];
}
