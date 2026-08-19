import type { PresetName } from "../session/session-types";

export type AwarenessPreset = {
  awayMs: number;
  absentMs: number;
  recoveryMs: number;
  cooldownMs: number;
  notesPauseMs: number;
};

export const PRESETS: Readonly<Record<PresetName, AwarenessPreset>> = Object.freeze({
  gentle: Object.freeze({
    awayMs: 10_000,
    absentMs: 20_000,
    recoveryMs: 2_000,
    cooldownMs: 60_000,
    notesPauseMs: 300_000,
  }),
  balanced: Object.freeze({
    awayMs: 5_000,
    absentMs: 10_000,
    recoveryMs: 2_000,
    cooldownMs: 30_000,
    notesPauseMs: 300_000,
  }),
  strict: Object.freeze({
    awayMs: 3_000,
    absentMs: 5_000,
    recoveryMs: 2_000,
    cooldownMs: 15_000,
    notesPauseMs: 180_000,
  }),
});

export const AWARENESS_ENTRY_SCORE = 0.7;
export const AWARENESS_RECOVERY_SCORE = 0.45;
