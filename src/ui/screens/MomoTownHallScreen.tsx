import type { CompanionState } from "../../plaza/plaza-types";
import type { SoundPreference } from "../../session/session-machine";
import type { PresetName } from "../../session/session-types";
import { FocusFriend } from "../components/FocusFriend";

export type MomoTownHallScreenProps = {
  companion: CompanionState;
  connection: "connected" | "disconnected";
  dataStatus: string | null;
  durationMs: number;
  onDeleteData: () => void;
  onDurationChange: (durationMs: number) => void;
  onExportData: () => void;
  onPresetChange: (preset: PresetName) => void;
  onReducedMotionChange: (reducedMotion: boolean) => void;
  onReset: () => void;
  onSoundChange: (sound: SoundPreference) => void;
  preset: PresetName;
  reducedMotion: boolean;
  sound: SoundPreference;
};

export function MomoTownHallScreen({
  companion,
  connection,
  dataStatus,
  durationMs,
  onDeleteData,
  onDurationChange,
  onExportData,
  onPresetChange,
  onReducedMotionChange,
  onReset,
  onSoundChange,
  preset,
  reducedMotion,
  sound,
}: MomoTownHallScreenProps) {
  return (
    <main className="momo-town-hall" aria-labelledby="momo-town-hall-title">
      <header className="momo-town-hall-header">
        <a href="#/plaza">← Back to Plaza</a>
        <p>Momo&apos;s Mayor&apos;s Desk</p>
        <span className={`momo-town-hall-connection momo-town-hall-connection-${connection}`}>
          {connection === "connected" ? "Extension connected" : "Extension disconnected"}
        </span>
      </header>

      <section className="momo-town-hall-hero" aria-labelledby="momo-town-hall-title">
        <FocusFriend
          equippedCosmeticIds={companion.equippedCosmeticIds}
          mood="encouraging"
          name={companion.name}
        />
        <div>
          <p>Town Hall</p>
          <h1 id="momo-town-hall-title">Momo&apos;s Town Hall</h1>
          <p>Choose the gentle defaults that help this little town feel like yours.</p>
        </div>
      </section>

      {dataStatus !== null && (
        <p className="momo-town-hall-status" role="status">
          {dataStatus}
        </p>
      )}

      <section
        className="momo-town-hall-card momo-town-hall-preferences"
        aria-labelledby="preferences-title"
      >
        <h2 id="preferences-title">Focus preferences</h2>
        <label htmlFor="momo-town-hall-duration">
          <span>Next session length</span>
          <select
            id="momo-town-hall-duration"
            value={durationMs}
            onChange={(event) => onDurationChange(Number(event.target.value))}
          >
            <option value={25 * 60_000}>25 minutes</option>
            <option value={50 * 60_000}>50 minutes</option>
          </select>
        </label>
        <label htmlFor="momo-town-hall-preset">
          <span>Momo&apos;s focus sensitivity</span>
          <select
            id="momo-town-hall-preset"
            value={preset}
            onChange={(event) => onPresetChange(event.target.value as PresetName)}
          >
            <option value="gentle">Gentle</option>
            <option value="balanced">Balanced</option>
            <option value="strict">Strict</option>
          </select>
        </label>
        <label htmlFor="momo-town-hall-sound">
          <span>Focus chime</span>
          <select
            id="momo-town-hall-sound"
            value={sound}
            onChange={(event) => onSoundChange(event.target.value as SoundPreference)}
          >
            <option value="silent">Off</option>
            <option value="soft">Soft</option>
            <option value="standard">Standard</option>
          </select>
        </label>
        <label className="momo-town-hall-motion" htmlFor="momo-town-hall-motion">
          <input
            id="momo-town-hall-motion"
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => onReducedMotionChange(event.target.checked)}
          />
          <span>Use gentler motion</span>
        </label>
        <button type="button" onClick={onReset}>
          Reset defaults
        </button>
      </section>

      <section className="momo-town-hall-card momo-town-hall-data" aria-labelledby="data-title">
        <h2 id="data-title">Your local keepsakes</h2>
        <p>
          Your Town Hall choices and focus history stay on this device until you choose otherwise.
        </p>
        <div>
          <button type="button" onClick={onExportData}>
            Export my data
          </button>
          <button type="button" onClick={onDeleteData}>
            Delete my data
          </button>
        </div>
      </section>

      <nav className="momo-town-hall-legal" aria-label="Legal">
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/terms">Terms of Use</a>
      </nav>
    </main>
  );
}
