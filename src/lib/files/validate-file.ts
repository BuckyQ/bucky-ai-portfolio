import { AI_CONFIG } from "@/config/ai";

import type { TemporaryDocument } from "./types";

export type DocumentErrorCode =
  | "EMPTY_FILE"
  | "EXTRACTED_TEXT_TOO_LARGE"
  | "EXTRACTION_FAILED"
  | "FILE_TOO_LARGE"
  | "INVALID_DOCUMENT"
  | "UNSUPPORTED_FILE";

export class DocumentInputError extends Error {
  constructor(
    message: string,
    readonly code: DocumentErrorCode,
    readonly status = 400,
  ) {
    super(message);
    this.name = "DocumentInputError";
  }
}

const supportedTypes = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
} as const;

function extensionOf(fileName: string): keyof typeof supportedTypes | null {
  const normalizedName = fileName.toLowerCase();
  if (normalizedName.endsWith(".pdf")) return ".pdf";
  if (normalizedName.endsWith(".txt")) return ".txt";
  return null;
}

export function sanitizeDocumentFileName(fileName: string): string {
  const leafName = fileName.split(/[\\/]/).at(-1) ?? "";
  return leafName
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function validateDocumentMetadata(input: {
  fileName: string;
  mimeType: string;
  size: number;
}): Pick<TemporaryDocument, "fileName" | "mimeType" | "size"> {
  const fileName = sanitizeDocumentFileName(input.fileName);
  const extension = extensionOf(fileName);

  if (!extension) {
    throw new DocumentInputError(
      "Please upload a PDF or TXT file.",
      "UNSUPPORTED_FILE",
      415,
    );
  }

  if (!Number.isFinite(input.size) || input.size <= 0) {
    throw new DocumentInputError("The selected file is empty.", "EMPTY_FILE");
  }

  if (input.size > AI_CONFIG.maxFileBytes) {
    throw new DocumentInputError(
      "Files must be 5 MB or smaller.",
      "FILE_TOO_LARGE",
      413,
    );
  }

  const expectedMimeType = supportedTypes[extension];
  const suppliedMimeType = input.mimeType.split(";")[0]?.trim().toLowerCase();
  const genericMimeType =
    !suppliedMimeType || suppliedMimeType === "application/octet-stream";

  if (!genericMimeType && suppliedMimeType !== expectedMimeType) {
    throw new DocumentInputError(
      "The file type does not match its extension.",
      "UNSUPPORTED_FILE",
      415,
    );
  }

  return { fileName, mimeType: expectedMimeType, size: input.size };
}

export function validateDocumentFile(
  file: File,
): Pick<TemporaryDocument, "fileName" | "mimeType" | "size"> {
  return validateDocumentMetadata({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });
}

export function validateTemporaryDocument(input: unknown): TemporaryDocument {
  if (typeof input !== "object" || input === null) {
    throw new DocumentInputError(
      "The temporary document is invalid.",
      "INVALID_DOCUMENT",
    );
  }

  const candidate = input as Record<string, unknown>;
  if (
    typeof candidate.fileName !== "string" ||
    typeof candidate.mimeType !== "string" ||
    typeof candidate.size !== "number" ||
    typeof candidate.text !== "string"
  ) {
    throw new DocumentInputError(
      "The temporary document is invalid.",
      "INVALID_DOCUMENT",
    );
  }

  const metadata = validateDocumentMetadata({
    fileName: candidate.fileName,
    mimeType: candidate.mimeType,
    size: candidate.size,
  });
  const text = candidate.text.trim();

  if (!text) {
    throw new DocumentInputError(
      "No readable text was found in this document.",
      "EMPTY_FILE",
      422,
    );
  }

  if (text.length > AI_CONFIG.maxExtractedCharacters) {
    throw new DocumentInputError(
      "The document contains too much text for this demo.",
      "EXTRACTED_TEXT_TOO_LARGE",
      413,
    );
  }

  return { ...metadata, text };
}
