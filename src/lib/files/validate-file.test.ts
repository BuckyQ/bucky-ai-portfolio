import { describe, expect, it } from "vitest";

import { AI_CONFIG } from "@/config/ai";

import {
  DocumentInputError,
  validateDocumentFile,
  validateTemporaryDocument,
} from "./validate-file";

describe("document input validation", () => {
  it.each([
    ["role.txt", "text/plain", "Role requirements"],
    ["role.pdf", "application/pdf", "%PDF-1.7"],
  ])("accepts a valid %s upload", (name, type, contents) => {
    const file = new File([contents], name, { type });

    expect(validateDocumentFile(file)).toEqual({
      fileName: name,
      mimeType: type,
      size: file.size,
    });
  });

  it("rejects unsupported extensions", () => {
    const file = new File(["role"], "role.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    expect(() => validateDocumentFile(file)).toThrowError(
      new DocumentInputError(
        "Please upload a PDF or TXT file.",
        "UNSUPPORTED_FILE",
        415,
      ),
    );
  });

  it("rejects empty and oversized files", () => {
    expect(() =>
      validateDocumentFile(new File([], "empty.txt", { type: "text/plain" })),
    ).toThrow("The selected file is empty.");

    const oversized = new File(
      [new Uint8Array(AI_CONFIG.maxFileBytes + 1)],
      "large.pdf",
      { type: "application/pdf" },
    );
    expect(() => validateDocumentFile(oversized)).toThrow(
      "Files must be 5 MB or smaller.",
    );
  });

  it("revalidates temporary document text received by the answer route", () => {
    expect(() =>
      validateTemporaryDocument({
        fileName: "role.txt",
        mimeType: "text/plain",
        size: 20,
        text: "x".repeat(AI_CONFIG.maxExtractedCharacters + 1),
      }),
    ).toThrow("The document contains too much text for this demo.");
  });
});
