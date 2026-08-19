import type { PresetName } from "../../session/session-types";
import type { SoundPreference } from "../../session/session-machine";

type SettingsScreenProps = {
  durationMs: number;
  onDeleteData: () => void;
  onDurationChange: (durationMs: number) => void;
  onExportData: () => void;
  onPresetChange: (preset: PresetName) => void;
  onReset: () => void;
  onSoundChange: (sound: SoundPreference) => void;
  preset: PresetName;
  reducedMotion: boolean;
  onReducedMotionChange: (reducedMotion: boolean) => void;
  sound: SoundPreference;
};

export function SettingsScreen({
  durationMs,
  onDeleteData,
  onDurationChange,
  onExportData,
  onPresetChange,
  onReset,
  onSoundChange,
  onReducedMotionChange,
  preset,
  reducedMotion,
  sound,
}: SettingsScreenProps) {
  return (
    <section className="settings-screen" aria-labelledby="settings-title">
      <div className="settings-heading">
        <p className="section-kicker">Personal defaults</p>
        <h2 id="settings-title">Settings</h2>
        <p>Keep the daily setup quiet. Change defaults here when your study context changes.</p>
      </div>
      <div className="settings-grid">
        <label className="field" htmlFor="settings-duration">
          <span>Default duration</span>
          <select
            id="settings-duration"
            value={durationMs}
            onChange={(event) => onDurationChange(Number(event.target.value))}
          >
            <option value={25 * 60_000}>25 minutes</option>
            <option value={50 * 60_000}>50 minutes</option>
          </select>
        </label>
        <label className="field" htmlFor="settings-preset">
          <span>Sensitivity preset</span>
          <select
            id="settings-preset"
            value={preset}
            onChange={(event) => onPresetChange(event.target.value as PresetName)}
          >
            <option value="gentle">Gentle</option>
            <option value="balanced">Balanced</option>
            <option value="strict">Strict</option>
          </select>
        </label>
        <label className="field" htmlFor="settings-sound">
          <span>Default sound</span>
          <select
            id="settings-sound"
            value={sound}
            onChange={(event) => onSoundChange(event.target.value as SoundPreference)}
          >
            <option value="silent">Off</option>
            <option value="soft">Soft</option>
            <option value="standard">Standard</option>
          </select>
        </label>
      </div>
      <label className="choice settings-check" htmlFor="settings-reduced-motion">
        <input
          id="settings-reduced-motion"
          type="checkbox"
          checked={reducedMotion}
          onChange={(event) => onReducedMotionChange(event.target.checked)}
        />
        <span>Prefer reduced motion</span>
      </label>
      <div className="settings-actions">
        <button className="secondary-button" type="button" onClick={onReset}>
          Reset defaults
        </button>
        <button className="secondary-button" type="button" onClick={onExportData}>
          Export all data
        </button>
        <button className="text-button" type="button" onClick={onDeleteData}>
          Delete my data
        </button>
      </div>
      <nav className="legal-links" aria-label="Legal">
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/terms">Terms of Use</a>
      </nav>
    </section>
  );
}
