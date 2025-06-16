import { useMemo, useEffect, useRef } from "react";
import Dither from "../utils/Dither";

/**
 * Music‑reactive <Dither /> wrapper.
 * Beats drive burst amplitude and per‑beat colour shifts derived from the MFCC
 * mean vector.  We first interpolate the MFCC array so it has the **same
 * length** as the beats array, then use the i‑th MFCC value each time we hit
 * beat i.  Colour hue eases toward the next MFCC‑hue to avoid hard jumps.
 */

/* ------------------------------------------------ helpers */

function interpolateMFCCs(mfcc: number[], beats: number[]) {
  if (!mfcc.length || !beats.length) return [];
  const M = beats.length;
  const N = mfcc.length;
  const res: number[] = new Array(M);
  for (let i = 0; i < M; i++) {
    const t = (i * (N - 1)) / (M - 1);
    const idx = Math.floor(t);
    const frac = t - idx;
    res[i] = idx + 1 < N ? mfcc[idx] * (1 - frac) + mfcc[idx + 1] * frac : mfcc[N - 1];
  }
  return res;
}

/* ------------------------------------------------ props */
interface MusicDitherFieldProps {
  energy: number;
  valence: number;
  tempo: number;
  danceability: number;
  beats: number[];
  mfccs: number[]; // mean vector
  onBack?: () => void;
  style?: React.CSSProperties;
}

export default function MusicDitherField({
  energy,
  valence,
  tempo,
  danceability,
  beats = [],
  mfccs = [],
  onBack,
  style,
}: MusicDitherFieldProps) {
  /* ---------- derived waveform params ---------- */
  const waveSpeed      = useMemo(() => 0.02 + Math.min(Math.max((tempo - 60) / 140, 0), 1) * 0.13, [tempo]);
  const waveFrequency  = useMemo(() => 2 + danceability * 4, [danceability]);
  const baseAmplitude  = useMemo(() => 0.15 + energy * 0.45, [energy]);

  /* ---------- interpolate MFCCs to beat count ---------- */
  const mfccPerBeat = useMemo(() => interpolateMFCCs(mfccs, beats), [mfccs, beats]);

  /* ---------- refs & state ---------- */
  const burstRef   = useRef(0);
  const hueTargetRef = useRef(valence * 120);      // degrees
  const hueCurrentRef = useRef(hueTargetRef.current);
  const beatIdxRef   = useRef(0);
  const startRef     = useRef(performance.now());
  const rafRef       = useRef<number>(0);

  /* ---------- animation loop ---------- */
  useEffect(() => {
    if (!beats.length) {
      return () => {};
    }
    const loop = () => {
      const t = (performance.now() - startRef.current) / 1000;
      // beat trigger --------------------------------------------------
      if (t >= beats[beatIdxRef.current % beats.length]) {
        burstRef.current = 1;
        const mfccVal = mfccPerBeat[beatIdxRef.current % mfccPerBeat.length] ?? 0;
        // map mfcc 0‑100 to ±20° hue shift
        hueTargetRef.current = valence * 120 + Math.max(Math.min(mfccVal / 50, 1), -1) * 20;
        beatIdxRef.current++;
      }

      // decay burst & ease hue ---------------------------------------
      burstRef.current = Math.max(0, burstRef.current - 0.02);
      hueCurrentRef.current += (hueTargetRef.current - hueCurrentRef.current) * 0.05; // lerp 5%

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [beats, mfccPerBeat, valence]);

  /* ---------- colour helper ---------- */
  const waveColor = useMemo<[number, number, number]>(() => {
    const h = hueCurrentRef.current;  // dynamic hue
    const s = 0.7;
    const l = 0.55;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(c * 255);
    };
    return [f(0) / 255, f(8) / 255, f(4) / 255];
  }, []); // depends on ref, not props

  /* ---------- combine amplitude with burst ---------- */
  const amplitude = baseAmplitude * (1 + burstRef.current * 0.6);

  /* ---------- other constants ---------- */
  const mouseRadius = 0.1 + danceability * 0.5;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      <Dither
        waveSpeed={waveSpeed}
        waveFrequency={waveFrequency}
        waveAmplitude={amplitude}
        waveColor={waveColor}
        colorNum={4}
        pixelSize={2}
        disableAnimation={false}
        enableMouseInteraction={true}
        mouseRadius={mouseRadius}
      />

      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            zIndex: 10,
            padding: "0.5rem 1rem",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            opacity: 0.85,
          }}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
