import { formatEvidence, formatAnalyses } from "../utils/context";
import { SearchQuerySchema } from "../schemas/agent";

import type { AgentState, SearchQuery } from "../types/agent";

import { client, researchModel } from "../runtime";

import { zodTextFormat } from "openai/helpers/zod";




export async function createSearchQuery(
  state: AgentState
): Promise<SearchQuery> {

    const evidenceContext = formatEvidence(state.evidence);

    const analysisContext = formatAnalyses(state.analyses);



    const response = await client.responses.parse({
        model: researchModel(),
        input: [{role: "system", content: `
        You generate targeted search queries for a research agent.

        Use the user's original goal, existing evidence, and analysis
        to identify what information is still missing.

        Generate one targeted search query.
        `}, {
            role: 'user',
            content: `
            Original goal:
            ${state.query}

            Evidence:
            ${evidenceContext}

            Analysis:
            ${analysisContext}
            `
        }],

        text: {
            format: zodTextFormat(SearchQuerySchema, "search_more")
        }
    })

    const parsed = response.output_parsed;
    if (!parsed) {
        throw new Error('Failed to generate a search query.');
    }

    return parsed;
}
