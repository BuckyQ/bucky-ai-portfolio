import "server-only";
import OpenAI from "openai";
import { AsyncLocalStorage } from "node:async_hooks";

export const researchContext = new AsyncLocalStorage<AbortSignal>();
export const researchModel = () => process.env.RESEARCH_MODEL?.trim() || "gpt-4.1-mini";
let instance: OpenAI | undefined;
export const client = new Proxy({} as OpenAI, {
  get(_target, property) {
    instance ??= new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
      timeout: 30_000,
      fetch: (url, options) => {
        const signal = researchContext.getStore();
        return fetch(url, { ...options, signal: signal && options?.signal
          ? AbortSignal.any([signal, options.signal]) : signal || options?.signal });
      },
    });
    return Reflect.get(instance, property);
  },
});
