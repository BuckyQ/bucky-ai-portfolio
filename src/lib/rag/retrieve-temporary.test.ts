import { describe, expect, it } from "vitest";

import profileIndexData from "@/data/profile/bucky-profile-index.json";
import type { TemporaryDocument } from "@/lib/files/types";

import { retrieveTemporaryDocumentChunks } from "./retrieve-temporary";

const document: TemporaryDocument = {
  fileName: "job-description.txt",
  mimeType: "text/plain",
  size: 180,
  text: `Applied AI Engineer role.
The candidate will build retrieval systems and evaluate RAG quality.
Kubernetes experience is required for production deployment.`,
};

describe("temporary document retrieval", () => {
  it("returns bounded lexical chunks with uploaded-document metadata", () => {
    const results = retrieveTemporaryDocumentChunks(
      "Which RAG requirements overlap with Bucky's experience?",
      document,
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results[0]).toMatchObject({
      metadata: {
        fileName: "job-description.txt",
        sourceType: "uploaded-document",
      },
    });
    expect(results[0]?.text).toContain("retrieval systems");
  });

  it("does not modify the checked-in Bucky profile index", () => {
    const before = JSON.stringify(profileIndexData);

    retrieveTemporaryDocumentChunks("Kubernetes requirements", document);

    expect(JSON.stringify(profileIndexData)).toBe(before);
  });
});
