"use client";

import { useRef, useState } from "react";

type GenState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "polling"; id: string; status: string }
  | { phase: "done"; videoUrl: string }
  | { phase: "error"; message: string };

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<GenState>({ phase: "idle" });
  const pollTimer = useRef<number | null>(null);

  async function start() {
    if (!prompt.trim()) return;

    setState({ phase: "starting" });

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    if (!res.ok) {
      setState({ phase: "error", message: data?.error ?? "Failed to start." });
      return;
    }

    const id = data.id as string;
    setState({ phase: "polling", id, status: data.status });

    // poll every 2.5s
    pollTimer.current = window.setInterval(async () => {
      const sres = await fetch(`/api/status?id=${encodeURIComponent(id)}`);
      const sdata = await sres.json();

      if (!sres.ok) {
        cleanupPoll();
        setState({ phase: "error", message: sdata?.error ?? "Status check failed." });
        return;
      }

      if (sdata.status === "succeeded" && sdata.videoUrl) {
        cleanupPoll();
        setState({ phase: "done", videoUrl: sdata.videoUrl });
      } else if (sdata.status === "failed" || sdata.status === "canceled") {
        cleanupPoll();
        setState({ phase: "error", message: sdata.error ?? "Generation failed." });
      } else {
        setState({ phase: "polling", id, status: sdata.status });
      }
    }, 2500);
  }

  function cleanupPoll() {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  function reset() {
    cleanupPoll();
    setState({ phase: "idle" });
  }

  const busy = state.phase === "starting" || state.phase === "polling";

  return (
    <main className="container">
      <h1>Prompt → Video Generator</h1>
      <p className="small">
        This website sends your prompt to a GPU video model (via Replicate) and returns a video.
      </p>

      <div className="card">
        <label className="small">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: A cinematic shot of a tiger walking through snow, ultra realistic, 4k"
        />

        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={start} disabled={busy || !prompt.trim()}>
            {state.phase === "starting" ? "Starting..." : busy ? "Generating..." : "Generate Video"}
          </button>
          <button onClick={reset} disabled={state.phase === "idle"}>
            Reset
          </button>
          {state.phase === "polling" && (
            <span className="small">
              Job: {state.id} | Status: {state.status}
            </span>
          )}
        </div>

        <hr />

        {state.phase === "done" && (
          <div>
            <p className="small">Result</p>
            <video src={state.videoUrl} controls />
            <p className="small">
              Direct link:{" "}
              <a href={state.videoUrl} target="_blank" rel="noreferrer">
                {state.videoUrl}
              </a>
            </p>
          </div>
        )}

        {state.phase === "error" && (
          <p className="small" style={{ color: "#ffb4b4" }}>
            Error: {state.message}
          </p>
        )}

        {state.phase !== "done" && state.phase !== "error" && (
          <p className="small">
            Tip: “High quality” depends on the model and its settings (steps, frames, resolution).
          </p>
        )}
      </div>
    </main>
  );
}
