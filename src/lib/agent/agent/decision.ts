import { client, researchModel } from "../runtime";

import { DecisionSchema } from "../schemas/agent";

import { zodTextFormat } from "openai/helpers/zod";

import type { AgentState, Decision } from "../types/agent";




export async function getDecision(
  state: AgentState
): Promise<Decision | null> {
    const response = await client.responses.parse({
  model: researchModel(),
  input: [
    {
      role: "system",
content: `
You are the decision layer of a research agent.

Choose exactly ONE next action.

CONTINUE:
Choose CONTINUE only when:
- state.currentStep < state.plan.length
- there is a useful unexecuted step remaining
- the current plan is still appropriate

Never choose CONTINUE when:
- state.currentStep >= state.plan.length

SEARCH_MORE:
Choose SEARCH_MORE when:
- the current plan is complete or insufficient
- important parts of the user's original goal are still unsupported
- additional external evidence is needed

REPLAN:
Choose REPLAN when:
- the current plan is no longer appropriate
- the plan contains incorrect assumptions
- the plan needs substantial structural changes before continuing

GENERATE:
Choose GENERATE when:
- the current plan is complete
- enough evidence and analysis exist to answer all important parts
  of the user's original query

Decision procedure:

1. First check whether there are remaining plan steps.

   If state.currentStep < state.plan.length:
   - normally choose CONTINUE
   - unless the plan has become invalid, then choose REPLAN

2. If state.currentStep >= state.plan.length:
   - NEVER choose CONTINUE
   - check whether all major parts of the original query are supported

3. If the plan is complete and important information is missing:
   choose SEARCH_MORE.

4. If the plan is complete and evidence is sufficient:
   choose GENERATE.

5. Choose REPLAN only when the plan itself needs to change,
   not merely because more evidence is needed.

Return a confidence score between 0 and 1.
`,
    },
    {
      role: "user",
      content: JSON.stringify(state),
    },
  ],

  text: {
    format: zodTextFormat(DecisionSchema, "decision"),
  },
});

    return response.output_parsed;
}
