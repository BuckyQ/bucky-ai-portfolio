import type { AgentState } from "../types/agent";
import { createSearchQuery } from "./createSearchQuery";
import { webSearch } from "../tools/webSearch";

export async function searchMore(state: AgentState) {
  const request = await createSearchQuery(state);

  
  

  const evidence = await webSearch(request.query);

  state.evidence.push(evidence);

  return state;
}
