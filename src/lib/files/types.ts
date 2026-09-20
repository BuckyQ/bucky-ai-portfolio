export interface ExtractedDocument {
  fileName: string;
  mimeType: "application/pdf" | "text/plain";
  size: number;
  text: string;
}

export type TemporaryDocument = ExtractedDocument;

export const DOCUMENT_ACCEPT = ".pdf,.txt,application/pdf,text/plain";
