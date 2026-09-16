import { getDashboard } from "@/stocks/dashboard";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const view = (url.searchParams.get("view") ?? "10") as "all" | "10" | "25" | "50";
  const data = await getDashboard(view);
  return Response.json(data);
}
