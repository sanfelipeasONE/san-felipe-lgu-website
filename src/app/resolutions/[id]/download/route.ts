import { NextResponse } from "next/server";
import { getEligiblePublicResolution } from "@/server/resolutions/service";
import { getDocumentDownloadUrl } from "@/server/media/cloudinary-documents";

export const instant = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resolution = await getEligiblePublicResolution(id);

  if (!resolution) {
    return new Response("Resolution not found or unavailable.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const downloadUrl = getDocumentDownloadUrl(
    resolution.storagePublicId,
    resolution.originalFilename
  );

  return NextResponse.redirect(downloadUrl, {
    status: 307,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
