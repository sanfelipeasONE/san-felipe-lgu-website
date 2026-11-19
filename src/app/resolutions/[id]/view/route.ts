import { NextResponse } from "next/server";
import { getEligiblePublicResolution } from "@/server/resolutions/service";

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

  return NextResponse.redirect(resolution.storageUrl, {
    status: 307,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
