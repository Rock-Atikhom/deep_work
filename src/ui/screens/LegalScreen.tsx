export type LegalDocument = "privacy" | "terms";

type LegalSection = { heading: string; paragraphs: readonly string[] };

const EFFECTIVE_DATE = "August 19, 2026";

const privacySections: readonly LegalSection[] = [
  {
    heading: "What this policy covers",
    paragraphs: [
      "Deep Work Companion is a voluntary, local study-focus tool. This policy describes what the app processes in your browser and what it saves on your device.",
    ],
  },
  {
    heading: "Camera processing",
    paragraphs: [
      "Camera frames are processed locally in your browser only when you choose Private Camera Awareness for a study session. Frames are passed to the local vision runtime to produce a coarse, short-lived awareness signal and are disposed promptly.",
      "We do not store camera frames, images, raw landmarks, face templates, embeddings, biometric identifiers, iris data, gaze histories, or calibration imagery.",
    ],
  },
  {
    heading: "Data saved on this device",
    paragraphs: [
      "The app stores session summaries, reflections, Momo Memory Garden records, Question Deck content, and preferences on this device. These records support your local history, defaults, and exports. The app does not create an account or send these records to a server.",
    ],
  },
  {
    heading: "Permissions and visible-window behavior",
    paragraphs: [
      "Browser camera permission is requested only after you choose camera awareness. You can decline, stop, or revoke it and continue with a timer-only session. Camera awareness pauses when the visible browser window is hidden or minimized because the app cannot responsibly observe an unseen study context.",
    ],
  },
  {
    heading: "Offline cache",
    paragraphs: [
      "After a successful first load, the app may keep its application shell and verified local vision runtime in an offline cache. The cache contains build assets and pinned vision files, not camera frames or IndexedDB exports.",
    ],
  },
  {
    heading: "Export and deletion",
    paragraphs: [
      "You can export your saved local data as a file and use Delete my data to remove the durable records listed above from this browser. Clearing browser storage can also remove local records and offline caches.",
    ],
  },
  {
    heading: "No analytics or remote intelligence",
    paragraphs: [
      "Deep Work Companion has no analytics, advertising, remote AI, remote vision service, image storage endpoint, or account system. The app is designed to make its privacy boundary observable in the browser.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "Material changes will be published here with a new effective date before they apply.",
    ],
  },
];

const termsSections: readonly LegalSection[] = [
  {
    heading: "Voluntary educational use",
    paragraphs: [
      "Use of Deep Work Companion is voluntary and intended for personal educational self-awareness. You decide whether to use the timer-only or camera-aware option and may stop at any time.",
    ],
  },
  {
    heading: "Not medical, disciplinary, or proctoring software",
    paragraphs: [
      "This app is not medical advice, diagnosis, treatment, or a mental-health service. It is not a disciplinary or proctoring tool and must not be used to make high-stakes decisions about a student or worker.",
    ],
  },
  {
    heading: "Accuracy limits",
    paragraphs: [
      "Camera awareness can be unavailable or mistaken. It may produce false positives or fail to detect a shift in attention because of lighting, posture, camera quality, accessibility needs, or other ordinary conditions. Treat prompts as optional invitations to reset, not conclusions about you.",
    ],
  },
  {
    heading: "No covert or group surveillance",
    paragraphs: [
      "Do not use this app for covert surveillance, group surveillance, classroom monitoring, or recording another person. Camera awareness is for the consenting person using the visible browser window during their own study session.",
    ],
  },
  {
    heading: "Minors and school deployments",
    paragraphs: [
      "A parent, guardian, school, or other deploying organization is responsible for obtaining any additional consent and providing any required notices before minors use the app. The app should remain optional and must not be used to discipline minors.",
    ],
  },
  {
    heading: "Third-party notices",
    paragraphs: [
      "The bundled vision runtime includes third-party software and notices. The repository retains the applicable license and notice files for those assets.",
    ],
  },
  {
    heading: "Warranty limits",
    paragraphs: [
      "Deep Work Companion is provided as is and without warranties, whether express or implied. To the extent permitted by law, use it at your own discretion and do not rely on it where an error could cause harm or a disciplinary outcome.",
    ],
  },
];

const documents: Record<LegalDocument, { title: string; sections: readonly LegalSection[] }> = {
  privacy: { sections: privacySections, title: "Privacy Policy" },
  terms: { sections: termsSections, title: "Terms of Use" },
};

export function LegalFooter() {
  return (
    <footer aria-label="Momo Town footer" className="momo-town-footer" role="contentinfo">
      <div className="momo-town-footer-brand">
        <span aria-hidden="true" className="momo-town-footer-mark">
          <span />
        </span>
        <p>
          <strong>Momo&apos;s Learning Plaza</strong>
          <span>Small steps stay on this device.</span>
        </p>
      </div>
      <nav aria-label="Momo Town">
        <a href="#/plaza">Plaza</a>
        <a href="#/town-hall">Town Hall</a>
      </nav>
      <nav aria-label="Legal">
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/terms">Terms of Use</a>
      </nav>
    </footer>
  );
}

export function LegalScreen({ document }: { document: LegalDocument }) {
  const legal = documents[document];
  return (
    <section className="legal-screen" aria-labelledby="legal-title">
      <p className="product-mark">Deep Work Companion</p>
      <h1 id="legal-title">{legal.title}</h1>
      <p className="legal-effective-date">Effective date: {EFFECTIVE_DATE}</p>
      {legal.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
      <p>
        <a href="#/setup">Return to setup</a>
      </p>
    </section>
  );
}
