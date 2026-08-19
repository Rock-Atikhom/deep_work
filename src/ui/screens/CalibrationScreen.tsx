type CalibrationScreenProps = {
  progress: number;
  onStart: () => void;
  onContinueWithoutCamera: () => void;
  preparing?: boolean;
};

export function CalibrationScreen({
  progress,
  onStart,
  onContinueWithoutCamera,
  preparing = false,
}: CalibrationScreenProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <section className="calibration-screen" aria-labelledby="calibration-title">
      <p className="section-kicker">Private camera awareness</p>
      <h2 id="calibration-title">Set a quiet baseline</h2>
      <p>
        For three seconds, sit as you normally study. Camera frames stay on this device and are not
        saved.
      </p>
      {preparing ? (
        <p role="status">Preparing private camera analysis</p>
      ) : (
        <p role="status">Calibration {percent}%</p>
      )}
      <progress max={100} value={percent} aria-label="Calibration progress" />
      {progress <= 0 && !preparing && (
        <button className="primary-button" type="button" onClick={onStart}>
          Start calibration
        </button>
      )}
      {progress > 0 && progress < 1 && (
        <p className="calibration-note">Keep the window visible while calibration runs.</p>
      )}
      <button className="text-button" type="button" onClick={onContinueWithoutCamera}>
        Continue without camera
      </button>
    </section>
  );
}
