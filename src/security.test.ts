import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

const srcDirectory = dirname(fileURLToPath(import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

it("keeps OpenAI and Supabase server secrets out of client modules", () => {
  const violations: string[] = [];

  for (const file of sourceFiles(srcDirectory)) {
    const contents = readFileSync(file, "utf8");
    const isClientModule = /^\s*["']use client["'];?/u.test(contents);

    if (!isClientModule) continue;

    if (
      contents.includes("OPENAI_API_KEY") ||
      contents.includes("SUPABASE_SECRET_KEY") ||
      contents.includes("@/lib/supabase/server")
    ) {
      violations.push(relative(srcDirectory, file));
    }
  }

  expect(violations).toEqual([]);
});
