export type VisionObservation = {
  capturedAtMs: number;
  evidenceQuality: "reliable" | "unreliable";
  faceCount: 0 | 1 | 2;
  gazeDownScore: number;
  headAwayScore: number;
};
