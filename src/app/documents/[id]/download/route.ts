import { NextResponse } from "next/server";
import { getEligiblePublicDocument } from "@/server/documents/service";
import { getDocumentDownloadUrl } from "@/server/media/cloudinary-documents";

export const instant = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await getEligiblePublicDocument(id);

  if (!doc) {
    return new Response("Document not found or unavailable.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const downloadUrl = getDocumentDownloadUrl(
    doc.storagePublicId,
    doc.originalFilename
  );

  return NextResponse.redirect(downloadUrl, {
    status: 307,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
