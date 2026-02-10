import Replicate from "replicate";

export const runtime = "nodejs"; // important: Replicate uses node runtime

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    const version = process.env.REPLICATE_VERSION;

    if (!token || !version) {
      return Response.json(
        { error: "Server not configured. Missing REPLICATE_API_TOKEN or REPLICATE_VERSION." },
        { status: 500 }
      );
    }

    const replicate = new Replicate({ auth: token });

    // NOTE: Each model has different input parameters.
    // Start with prompt-only, then add settings based on the model's docs.
    const prediction = await replicate.predictions.create({
      version,
      input: {
        prompt
      }
    });

    return Response.json({
      id: prediction.id,
      status: prediction.status
    });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
