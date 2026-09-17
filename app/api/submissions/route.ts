import { getSubmissions } from "@/lib/upstream";

// This endpoint performs the authenticated upstream fetch server-side and
// returns clean JSON to the browser. Credentials never leave the server.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSubmissions();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/submissions]", err);
    return Response.json(
      { error: "Failed to fetch submissions from upstream" },
      { status: 502 }
    );
  }
}
