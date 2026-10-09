import type { z } from "zod";
import type {
  DecisionSchema,
  NextActionSchema,
  PlanStepSchema,
  SearchQuerySchema,
  StepTypeSchema,
} from "../schemas/agent";

export type NextAction = z.infer<typeof NextActionSchema>;
export type StepType = z.infer<typeof StepTypeSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type PlanStep = z.infer<typeof PlanStepSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export type Evidence = {
  content: string;
  source: string;
};

export type Analysis = {
  content: string;
  basedOn: number[];
};

export type AgentState = {
  query: string;
  plan: PlanStep[];
  evidence: Evidence[];
  analyses: Analysis[];
  attempts: number;
  currentStep: number;
  answer?: string;
};
