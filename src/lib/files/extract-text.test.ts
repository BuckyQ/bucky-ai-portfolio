import { beforeEach, describe, expect, it, vi } from "vitest";

const pdfMocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  extractText: vi.fn(),
  getDocumentProxy: vi.fn(),
}));

vi.mock("unpdf", () => ({
  extractText: pdfMocks.extractText,
  getDocumentProxy: pdfMocks.getDocumentProxy,
}));

import { extractTextFromFile } from "./extract-text";

beforeEach(() => {
  pdfMocks.destroy.mockResolvedValue(undefined);
  pdfMocks.getDocumentProxy.mockResolvedValue({ destroy: pdfMocks.destroy });
  pdfMocks.extractText.mockResolvedValue({
    totalPages: 1,
    text: "Applied AI role requirements",
  });
});

describe("extractTextFromFile", () => {
  it("extracts and normalizes TXT content", async () => {
    const result = await extractTextFromFile(
      new File(["Role requirements\r\n\r\n\r\n\r\nTypeScript"], "role.txt", {
        type: "text/plain",
      }),
    );

    expect(result).toMatchObject({
      fileName: "role.txt",
      mimeType: "text/plain",
      text: "Role requirements\n\n\nTypeScript",
    });
  });

  it("extracts a valid PDF behind the file-processing interface", async () => {
    const result = await extractTextFromFile(
      new File(["%PDF-1.7\nmock body"], "role.pdf", {
        type: "application/pdf",
      }),
    );

    expect(pdfMocks.getDocumentProxy).toHaveBeenCalledOnce();
    expect(pdfMocks.extractText).toHaveBeenCalledWith(
      { destroy: pdfMocks.destroy },
      { mergePages: true },
    );
    expect(pdfMocks.destroy).toHaveBeenCalledOnce();
    expect(result.text).toBe("Applied AI role requirements");
  });

  it("rejects a fake PDF before invoking the parser", async () => {
    await expect(
      extractTextFromFile(
        new File(["not a pdf"], "role.pdf", { type: "application/pdf" }),
      ),
    ).rejects.toThrow("This file is not a valid PDF.");
    expect(pdfMocks.getDocumentProxy).not.toHaveBeenCalled();
  });

  it("returns a safe error when extraction fails", async () => {
    pdfMocks.getDocumentProxy.mockRejectedValue(new Error("parser internals"));

    await expect(
      extractTextFromFile(
        new File(["%PDF-1.7\nmock body"], "role.pdf", {
          type: "application/pdf",
        }),
      ),
    ).rejects.toThrow(
      "This document could not be read. Try another PDF or TXT file.",
    );
  });
});
