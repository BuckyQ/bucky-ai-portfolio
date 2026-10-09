import { formatEvidence, formatAnalyses } from "../utils/context";
import { client, researchModel } from "../runtime";

import type { AgentState } from "../types/agent";



export async function generateAnswer(
  state: AgentState
): Promise<string> {

  // 1. 把 evidence 整理成 context
    const context = formatEvidence(state.evidence, 1);
    const analysisContext = formatAnalyses(state.analyses);

  // 2. client.responses.create(...)
    const responses = await client.responses.create({
        model: researchModel(),
        input: `
        User query: ${state.query}

        Research evidence: ${context}

        Analysis: ${analysisContext}

        Answer the user's query using the research evidence and analysis. Include the supporting source URLs from the evidence. Do not invent claims or citations. State evidence gaps clearly.
        `,
    })

    return responses.output_text
}
