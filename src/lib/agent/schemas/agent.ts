import { z } from "zod";

// Runtime schemas are the single source of truth for their TypeScript types.
export const NextActionSchema = z.enum([
  "CONTINUE",
  "SEARCH_MORE",
  "REPLAN",
  "GENERATE",
]);

export const StepTypeSchema = z.enum([
  "WEB_SEARCH",
  "ANALYZE",
  "CALCULATE",
]);

export const DecisionSchema = z.object({
  action: NextActionSchema,
  confidence: z.number().min(0).max(1),
});

export const PlanStepSchema = z.object({
  description: z.string(),
  type: StepTypeSchema,
});

export const ReplanSchema = z.object({
  plan: z.array(PlanStepSchema),
});

export const SearchQuerySchema = z.object({
  query: z.string(),
  reason: z.string(),
});
