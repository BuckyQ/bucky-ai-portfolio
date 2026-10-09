import type {
  AgentState,
  NextAction,
  PlanStep,
} from "../types/agent";

import { analyze } from "../actions/analyze";
import { webSearch } from "../tools/webSearch";
import { generateAnswer } from "../actions/generate";
import { replan } from "../actions/replan";
import { searchMore } from "../actions/searchMore";

export async function continuePlan(
  state: AgentState
): Promise<AgentState> {
  if (state.currentStep >= state.plan.length) {
    return state;
  }

  const currentStep = state.plan[state.currentStep];

  if (!currentStep) {
    return state;
  }

  try {
    await executeStep(currentStep, state);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    state.evidence.push({
      content: `ERROR: Failed to execute "${currentStep.description}": Step unavailable.`,
      source: "step-error",
    });
  }

  state.currentStep += 1;

  return state;
}

const executeStep = async (
  step: PlanStep,
  state: AgentState
): Promise<void> => {
  switch (step.type) {
    case "WEB_SEARCH": {
      const searchQuery = `
        Original research goal:
        ${state.query}

        Current research step:
        ${step.description}
      `;

      const evidence = await webSearch(searchQuery);

      state.evidence.push(evidence);

      return;
    }

    case "ANALYZE": {
      const analysis = await analyze(
        state,
        step.description
      );

      state.analyses.push(analysis);

      return;
    }

    case "CALCULATE": {
      
      return;
    }

    default:
      throw new Error(
        `Unknown step type: ${step.type}`
      );
  }
};

export async function executeAction(
  action: NextAction,
  state: AgentState
): Promise<AgentState> {
  switch (action) {
    case "CONTINUE":
      return continuePlan(state);

    case "SEARCH_MORE":
      await searchMore(state);
      return state;

    case "REPLAN": {
      const newPlan = await replan(state);

      

      state.plan = newPlan;
      state.currentStep = 0;

      return state;
    }

    case "GENERATE": {
      const answer = await generateAnswer(state);

      state.answer = answer;

      return state;
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}