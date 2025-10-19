"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Sample = {
  id: string;
  title: string;
  meta: string;
  lyrics: string;
};

function useTypedText(text: string, speed = 18) {
  const [display, setDisplay] = useState("");
  const intervalRef = useRef<number | null>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    // Reset state for new text
    setDisplay("");
    idxRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const chars = [...text];
    const interval = window.setInterval(() => {
      const next = idxRef.current + 1;
      if (next >= chars.length) {
        // Finish typing and clear interval
        setDisplay(text);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        setDisplay(chars.slice(0, next).join(""));
        idxRef.current = next;
      }
    }, speed);
    intervalRef.current = interval as unknown as number;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [text, speed]);

  return { display };
}

export default function LyricShowcase() {
  const samples: Sample[] = useMemo(
    () => [
      {
        id: "pop",
        title: "Pop • Love & Romance",
        meta: "English • Verse–Chorus • Poetic",
        lyrics:
          `[Verse]\nCaught in the glow of the city lights\nYour hand in mine, and the timing's right\nEvery heartbeat finds a melody\nSaying stay here, stay here next to me\n\n[Chorus]\nI don't need the stars if I've got you\nTurn the night to gold in every room\nIf this is love, then let it bloom\nHold me close, and make this moment true`,
      },
      {
        id: "rap",
        title: "Hip-Hop/Rap • Perseverance",
        meta: "English • Verse–Hook • Direct",
        lyrics:
          `[Verse]\nClock ticks, I'm in the lab like overtime\nBrick by brick, I built the chorus line\nDoubt in the rearview, fade like a skyline\nHunger in the hook, watch me redefine\n\n[Hook]\nCame from the sideline, now I'm in the limelight\nTurning every setback to a highlight\nWrite it in the booth, proof in the daylight\nI'm the echo of belief when the time's right`,
      },
      {
        id: "rnb",
        title: "R&B/Soul • Empowerment",
        meta: "English • Verse–Chorus • Confessional",
        lyrics:
          `[Verse]\nI found my name in the quiet and the thunder\nTraced it in the scars I used to hide under\nNow every breath is a bridge back to me\nAnd every note sets another truth free\n\n[Chorus]\nI rise, like the sun after midnight\nI shine, even softer in low light\nIf doubt is a storm, I’m the shoreline\nI’m done staying small just to be fine`,
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = samples[index % samples.length];
  const typingSpeed = 14; // ms per char
  const holdMs = 2200; // additional hold after finish
  const { display } = useTypedText(active.lyrics, typingSpeed);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (paused) return;
    // Rotate only after typing completes + hold duration
    const duration = Math.max(1500, active.lyrics.length * typingSpeed + holdMs);
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % samples.length), duration);
    return () => clearTimeout(t);
  }, [active.lyrics, samples.length, paused]);

  useEffect(() => {
    // Reset scroll to top on sample change
    preRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [active]);

  return (
    <section className="relative pt-6 pb-16 md:pt-8 md:pb-20 overflow-hidden">
      {/* Background: soft, premium gradient with subtle spotlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-200/40 to-purple-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-tr from-pink-200/40 to-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_40%_at_50%_0%,rgba(99,102,241,0.12),transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            AI Lyric Examples
          </h2>
          <p className="mt-3 text-gray-600 text-base md:text-lg">
            High-end, minimal, and dynamic lyric previews.
          </p>
        </div>

        {/* Glass card */}
        <div
          className="relative mx-auto max-w-3xl group"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-blue-300/30 via-purple-300/30 to-pink-300/30 blur-xl opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative rounded-3xl bg-white/65 backdrop-blur-xl ring-1 ring-black/5 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:ring-black/10 group-hover:-translate-y-0.5 group-hover:scale-[1.01]">
            <div className="p-6 md:p-10">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="text-sm font-medium text-gray-900 truncate">{active.title}</div>
                <div className="text-xs text-gray-500 shrink-0">{active.meta}</div>
              </div>

              <pre ref={preRef} className="min-h-[220px] md:min-h-[260px] max-h-[340px] overflow-y-auto whitespace-pre-wrap font-mono text-sm md:text-base leading-relaxed text-slate-800">
                {display}
                <span className="inline-block w-2 h-5 align-middle ml-1 bg-slate-800/80 animate-pulse" />
              </pre>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Curated styles • {paused ? "paused on hover" : "auto-rotating"}
                </div>
                <div className="flex items-center gap-2">
                  {samples.map((s, i) => (
                    <button
                      key={s.id}
                      aria-label={`Show ${s.title}`}
                      onClick={() => setIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        i === index ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
