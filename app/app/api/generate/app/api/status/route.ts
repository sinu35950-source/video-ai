import Replicate from "replicate";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return Response.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }

    const replicate = new Replicate({ auth: token });
    const prediction = await replicate.predictions.get(id);

    // Replicate output can be: string URL, array of URLs, etc.
    let videoUrl: string | null = null;
    const out: any = prediction.output;

    if (typeof out === "string") videoUrl = out;
    else if (Array.isArray(out) && typeof out[0] === "string") videoUrl = out[0];

    return Response.json({
      id: prediction.id,
      status: prediction.status,
      videoUrl,
      error: prediction.error ?? null
    });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
