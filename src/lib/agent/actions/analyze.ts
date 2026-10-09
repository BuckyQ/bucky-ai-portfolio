import { formatEvidence } from "../utils/context";
import { type AgentState, type Analysis } from "../types/agent";

import { client, researchModel } from "../runtime";






export async function analyze(
  state: AgentState,
  instruction: string,
): Promise<Analysis> {
    const context = formatEvidence(state.evidence);

  // 2. responses.create()
  // query + instruction + evidence
    const response = await client.responses.create({
        model: researchModel(),
        input: `
        query: ${state.query}

        instruction; ${instruction}

        evidence: ${context}
        `,
    })

    return {
        content: response.output_text,
        basedOn: state.evidence.map((_, index) => index),
    }
}
