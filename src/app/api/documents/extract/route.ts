import { AI_CONFIG } from "@/config/ai";
import { extractTextFromFile } from "@/lib/files/extract-text";
import {
  DocumentInputError,
  validateDocumentFile,
} from "@/lib/files/validate-file";
import { reserveAiOperation } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init?.headers },
  });
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > AI_CONFIG.maxFileBytes + 256 * 1024) {
    return json({ error: "Files must be 5 MB or smaller." }, { status: 413 });
  }

  let file: File;
  try {
    const formData = await request.formData();
    const candidate = formData.get("file");
    if (!(candidate instanceof File)) {
      return json({ error: "Please select a PDF or TXT file." }, { status: 400 });
    }
    validateDocumentFile(candidate);
    file = candidate;
  } catch (error) {
    if (error instanceof DocumentInputError) {
      return json({ error: error.message, code: error.code }, { status: error.status });
    }
    return json({ error: "The upload request could not be read." }, { status: 400 });
  }

  try {
    const inFlight = await reserveAiOperation(request, {
      namespace: "document-active",
      limit: 1,
      windowSeconds: AI_CONFIG.operationLockSeconds,
    });

    if (!inFlight.allowed) {
      return json(
        { error: "Another document is already being processed." },
        { status: 429, headers: { "Retry-After": "3" } },
      );
    }

    try {
      const document = await extractTextFromFile(file);
      return json({ document });
    } finally {
      await inFlight.release();
    }
  } catch (error) {
    if (error instanceof DocumentInputError) {
      return json({ error: error.message, code: error.code }, { status: error.status });
    }

    console.error("Ask Bucky document extraction failed.");
    return json(
      { error: "Document extraction is temporarily unavailable." },
      { status: 503 },
    );
  }
}
