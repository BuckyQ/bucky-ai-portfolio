import "server-only";

import { AI_CONFIG } from "@/config/ai";

import type { ExtractedDocument } from "./types";
import {
  DocumentInputError,
  validateDocumentFile,
} from "./validate-file";

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function validateExtractedText(text: string): string {
  const normalizedText = normalizeExtractedText(text);

  if (!normalizedText) {
    throw new DocumentInputError(
      "No readable text was found in this document.",
      "EMPTY_FILE",
      422,
    );
  }

  if (normalizedText.length > AI_CONFIG.maxExtractedCharacters) {
    throw new DocumentInputError(
      "The document contains too much text for this demo.",
      "EXTRACTED_TEXT_TOO_LARGE",
      413,
    );
  }

  return normalizedText;
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  if (new TextDecoder("ascii").decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new DocumentInputError(
      "This file is not a valid PDF.",
      "INVALID_DOCUMENT",
      422,
    );
  }

  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);

  try {
    const result = await extractText(pdf, { mergePages: true });
    return result.text;
  } finally {
    await pdf.destroy();
  }
}

export async function extractTextFromFile(
  file: File,
): Promise<ExtractedDocument> {
  const metadata = validateDocumentFile(file);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const rawText =
      metadata.mimeType === "application/pdf"
        ? await extractPdfText(bytes)
        : new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    return { ...metadata, text: validateExtractedText(rawText) };
  } catch (error) {
    if (error instanceof DocumentInputError) throw error;

    throw new DocumentInputError(
      "This document could not be read. Try another PDF or TXT file.",
      "EXTRACTION_FAILED",
      422,
    );
  }
}
