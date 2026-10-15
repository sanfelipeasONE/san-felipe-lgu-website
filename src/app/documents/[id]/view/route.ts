import { NextResponse } from "next/server";
import { getEligiblePublicCharterDocument } from "@/server/documents/service";

export const instant = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await getEligiblePublicCharterDocument(id);

  if (!doc) {
    return new Response("Document not found or unavailable.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.redirect(doc.storageUrl, {
    status: 307,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
