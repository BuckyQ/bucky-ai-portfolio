import { type Evidence } from "../types/agent";

import { client, researchModel } from "../runtime";




export async function webSearch(
  query: string
): Promise<Evidence> {
  try {
   const response = await client.responses.create({
        model: researchModel(),
        tools: [{type: 'web_search'}],

        input: `search the web for information relevant to this research query :
            ${query}

            Prefer primary and official sources
        `,
   })
   
   const content = response.output_text?.trim();

    if (!content) {
      throw new Error("Web search returned an empty response");
    }

    return {
      content: content + "\nSources:\n" + response.output.flatMap(item => item.type === "message" ? item.content.flatMap(part => part.type === "output_text" ? part.annotations.flatMap(annotation => annotation.type === "url_citation" ? [`${annotation.title}: ${annotation.url}`] : []) : []) : []).join("\n"),
      source: "web-search",
    };

  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;

    return {
      content: `Web search unavailable.`,
      source: "web-search-error",
    };
  }
}
