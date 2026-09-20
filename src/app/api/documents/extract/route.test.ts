import { beforeEach, describe, expect, it, vi } from "vitest";

import { AI_CONFIG } from "@/config/ai";
import { DocumentInputError } from "@/lib/files/validate-file";

const mocks = vi.hoisted(() => ({
  extractTextFromFile: vi.fn(),
  release: vi.fn(),
  reserveAiOperation: vi.fn(),
}));

vi.mock("@/lib/files/extract-text", () => ({
  extractTextFromFile: mocks.extractTextFromFile,
}));

vi.mock("@/lib/rate-limit", () => ({
  reserveAiOperation: mocks.reserveAiOperation,
}));

import { POST } from "./route";

function makeUpload(file?: File): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return new Request("http://localhost/api/documents/extract", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  mocks.release.mockResolvedValue(undefined);
  mocks.reserveAiOperation.mockResolvedValue({
    allowed: true,
    remaining: 0,
    retryAfterSeconds: 60,
    release: mocks.release,
  });
});

describe("POST /api/documents/extract", () => {
  it.each([
    ["role.txt", "text/plain", "Role requirements"],
    ["role.pdf", "application/pdf", "%PDF-1.7"],
  ])("extracts a valid %s upload", async (name, mimeType, contents) => {
    const file = new File([contents], name, { type: mimeType });
    mocks.extractTextFromFile.mockResolvedValue({
      fileName: name,
      mimeType,
      size: file.size,
      text: "Applied AI requirements",
    });

    const response = await POST(makeUpload(file));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.document).toMatchObject({
      fileName: name,
      text: "Applied AI requirements",
    });
    expect(mocks.extractTextFromFile).toHaveBeenCalledWith(file);
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("rejects a missing, empty, unsupported, or oversized file before extraction", async () => {
    const cases = [
      makeUpload(),
      makeUpload(new File([], "empty.txt", { type: "text/plain" })),
      makeUpload(new File(["doc"], "role.docx", { type: "application/zip" })),
      makeUpload(
        new File(
          [new Uint8Array(AI_CONFIG.maxFileBytes + 1)],
          "large.pdf",
          { type: "application/pdf" },
        ),
      ),
    ];

    for (const request of cases) {
      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    }

    expect(mocks.extractTextFromFile).not.toHaveBeenCalled();
    expect(mocks.reserveAiOperation).not.toHaveBeenCalled();
  });

  it("returns a friendly extraction error and releases the processing lock", async () => {
    mocks.extractTextFromFile.mockRejectedValue(
      new DocumentInputError(
        "This document could not be read. Try another PDF or TXT file.",
        "EXTRACTION_FAILED",
        422,
      ),
    );

    const response = await POST(
      makeUpload(new File(["role"], "role.txt", { type: "text/plain" })),
    );
    const payload = await response.json();

    expect(response.status).toBe(422);
    expect(payload.error).toContain("could not be read");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("rejects concurrent document processing server-side", async () => {
    mocks.reserveAiOperation.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 50,
      release: vi.fn(),
    });

    const response = await POST(
      makeUpload(new File(["role"], "role.txt", { type: "text/plain" })),
    );

    expect(response.status).toBe(429);
    expect(mocks.extractTextFromFile).not.toHaveBeenCalled();
  });
});
