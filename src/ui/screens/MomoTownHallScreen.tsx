import type { CompanionColorStyle, CompanionState } from "../../plaza/plaza-types";
import type { SoundPreference } from "../../session/session-machine";
import type { PresetName } from "../../session/session-types";
import { FocusFriend } from "../components/FocusFriend";
import { MomoBackLink } from "../components/MomoBackLink";

export type MomoTownHallScreenProps = {
  companion: CompanionState;
  connection: "connected" | "disconnected";
  dataStatus: string | null;
  durationMs: number;
  onDeleteData: () => void;
  onDurationChange: (durationMs: number) => void;
  onExportData: () => void;
  onNameChange: (name: string) => void;
  onColorStyleChange: (colorStyle: CompanionColorStyle) => void;
  onReconnectCheck: () => void;
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
  onNameChange,
  onColorStyleChange,
  onReconnectCheck,
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
        <MomoBackLink />
        <p>Momo&apos;s Mayor&apos;s Desk</p>
        <span className={`momo-town-hall-connection momo-town-hall-connection-${connection}`}>
          {connection === "connected" ? "Extension connected" : "Extension disconnected"}
        </span>
      </header>

      <section className="momo-town-hall-hero" aria-labelledby="momo-town-hall-title">
        <FocusFriend
          colorStyle={companion.colorStyle}
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
        className="momo-town-hall-card momo-town-hall-connection-help"
        aria-labelledby="connection-help-title"
      >
        <h2 id="connection-help-title">Extension connection</h2>
        {connection === "connected" ? (
          <p>
            The Deep Work Course Guard extension is connected. Course Guard commands will reach it.
          </p>
        ) : (
          <div className="momo-town-hall-recovery">
            <p role="status">The Course Guard extension isn&apos;t reachable right now.</p>
            <ol className="momo-town-hall-recovery-steps">
              <li>
                Make sure the Deep Work Course Guard extension is installed and enabled in Chrome.
              </li>
              <li>Choose Check again below to re-attempt the secure handshake.</li>
              <li>
                If it still can&apos;t connect, reload this page from the production site or an
                approved local development origin.
              </li>
            </ol>
          </div>
        )}
        <button type="button" onClick={onReconnectCheck}>
          Check again
        </button>
      </section>

      <section
        className="momo-town-hall-card momo-town-hall-personalization"
        aria-labelledby="personalization-title"
      >
        <h2 id="personalization-title">Focus Friend personalization</h2>
        <label htmlFor="momo-town-hall-name">
          <span>Companion name</span>
          <input
            id="momo-town-hall-name"
            type="text"
            value={companion.name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <fieldset className="momo-town-hall-colors">
          <legend>Friend color</legend>
          <label>
            <input
              type="radio"
              name="companion-color-style"
              value="sky"
              checked={companion.colorStyle === "sky"}
              onChange={() => onColorStyleChange("sky")}
            />
            <span>Sky blue</span>
          </label>
          <label>
            <input
              type="radio"
              name="companion-color-style"
              value="blossom"
              checked={companion.colorStyle === "blossom"}
              onChange={() => onColorStyleChange("blossom")}
            />
            <span>Blossom pink</span>
          </label>
          <label>
            <input
              type="radio"
              name="companion-color-style"
              value="meadow"
              checked={companion.colorStyle === "meadow"}
              onChange={() => onColorStyleChange("meadow")}
            />
            <span>Meadow green</span>
          </label>
        </fieldset>
        <p>Colors are local decoration only — Momo never scores or judges your focus.</p>
      </section>

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
    </main>
  );
}
