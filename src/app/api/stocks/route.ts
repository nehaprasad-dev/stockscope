import { getDashboard } from "@/stocks/dashboard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const view = (url.searchParams.get("view") ?? "10") as "all" | "10" | "25" | "50";
    const data = await getDashboard(view);
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load stocks" },
      { status: 500 },
    );
  }
}
