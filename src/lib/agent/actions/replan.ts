import { formatEvidence, formatAnalyses } from "../utils/context";
import type { AgentState, PlanStep } from "../types/agent";
import { ReplanSchema } from "../schemas/agent";

import { client, researchModel } from "../runtime";




import { zodTextFormat } from "openai/helpers/zod";




export async function replan(
  state: AgentState
): Promise<PlanStep[]> {
    const evidenceContext = formatEvidence(state.evidence);

    const analysisContext = formatAnalyses(state.analyses);

    const oldPlanContext = JSON.stringify(state.plan, null, 2);


   const content =  `
        Original user goal:
        ${state.query}

        Old plan:
        ${oldPlanContext}

        Evidence:
        ${evidenceContext}

        Analysis:
        ${analysisContext}
        `

    const response = await client.responses.parse({
        model: researchModel(),
        max_output_tokens: 2000,
        store: false,

        input: [{
            role: "system",
            content: `
                You are the planning layer of a research agent.

                Review the user's goal, previous plan, collected evidence,
                and existing analysis.

                Create a new plan for what the agent should do NEXT.

                Only include steps that still need to be executed.
                Do not repeat completed work unless necessary.
                `
            },
            {
            role: "user",
            content: content,
            }
        ],

    text: {
        format: zodTextFormat(ReplanSchema, "replan")
    }
    });

    const parsed = response.output_parsed;
    if (!parsed) {
        throw new Error("Failed to generate a new plan.");
    }

    return parsed.plan;
    
}
