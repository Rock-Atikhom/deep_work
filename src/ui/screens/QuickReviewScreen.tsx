type QuickReviewScreenProps = { prompt: string; explanation?: string; onComplete: () => void };

export function QuickReviewScreen({ prompt, explanation, onComplete }: QuickReviewScreenProps) {
  return (
    <section className="quick-review-screen" aria-labelledby="quick-review-title">
      <p className="section-kicker">Quick review</p>
      <h2 id="quick-review-title">Return to one useful question</h2>
      <p className="review-prompt">{prompt}</p>
      {explanation && <p className="review-explanation">{explanation}</p>}
      <button className="primary-button" type="button" onClick={onComplete}>
        Finish quick review
      </button>
    </section>
  );
}
