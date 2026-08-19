export type SoundOptions = { enabled: boolean; volume: number };
export type SoundResult = { played: true } | { played: false; reason: "disabled" | "blocked" };

let context: AudioContext | null = null;

function boundedVolume(volume: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0));
}

function audioContextConstructor(): typeof AudioContext | undefined {
  const scope = globalThis as typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

export async function playAwarenessChime(options: SoundOptions): Promise<SoundResult> {
  if (!options.enabled) return { played: false, reason: "disabled" };
  const Constructor = audioContextConstructor();
  if (!Constructor) return { played: false, reason: "blocked" };

  try {
    context ??= new Constructor();
    if (context.state === "suspended") await context.resume();
    const startAt = context.currentTime;
    const volume = boundedVolume(options.volume);
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume * 0.18, startAt);
    gain.connect(context.destination);
    const first = context.createOscillator();
    first.type = "sine";
    first.frequency.setValueAtTime(660, startAt);
    first.connect(gain);
    first.start(startAt);
    first.stop(startAt + 0.08);
    const second = context.createOscillator();
    second.type = "sine";
    second.frequency.setValueAtTime(880, startAt + 0.09);
    second.connect(gain);
    second.start(startAt + 0.09);
    second.stop(startAt + 0.17);
    return { played: true };
  } catch {
    context = null;
    return { played: false, reason: "blocked" };
  }
}
