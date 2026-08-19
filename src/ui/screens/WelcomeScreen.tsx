type WelcomeScreenProps = { onCamera: () => void; onTimerOnly: () => void };

export function WelcomeScreen({ onCamera, onTimerOnly }: WelcomeScreenProps) {
  return (
    <section className="welcome-screen" aria-labelledby="welcome-title">
      <p className="product-mark">Deep Work Companion</p>
      <h1 id="welcome-title">Make room for focused learning</h1>
      <p className="intro-copy">
        A quiet timer and an optional local awareness check for the study block ahead.
      </p>
      <div className="welcome-actions">
        <button className="primary-button" type="button" onClick={onCamera}>
          Use private camera awareness
        </button>
        <button className="secondary-button" type="button" onClick={onTimerOnly}>
          Continue without camera
        </button>
      </div>
      <nav className="legal-links" aria-label="Legal">
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/terms">Terms of Use</a>
      </nav>
    </section>
  );
}
