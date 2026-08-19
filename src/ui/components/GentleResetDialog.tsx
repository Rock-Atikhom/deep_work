import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";

type GentleResetDialogProps = {
  open: boolean;
  onContinue: () => void;
  onQuickReview: () => void;
  onNotes: () => void;
  focusTargetRef?: RefObject<HTMLElement | null>;
};

export function GentleResetDialog({
  open,
  onContinue,
  onQuickReview,
  onNotes,
  focusTargetRef,
}: GentleResetDialogProps) {
  const continueRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nativeSupported] = useState(
    () =>
      typeof HTMLDialogElement !== "undefined" &&
      typeof HTMLDialogElement.prototype.showModal === "function",
  );
  useEffect(() => {
    if (open) continueRef.current?.focus();
  }, [open]);
  useEffect(() => {
    const target = focusTargetRef?.current;
    if (!open) {
      target?.focus();
      return;
    }
    return () => target?.focus();
  }, [focusTargetRef, open]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!nativeSupported || !dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [nativeSupported, open]);
  if (!open) return null;

  const content = (
    <>
      <p className="section-kicker">Awareness check</p>
      <h2 id="gentle-reset-title">Your attention may have shifted</h2>
      <p role="status" aria-live="polite">
        Take one breath, then choose what helps next.
      </p>
      <div className="dialog-actions">
        <button ref={continueRef} className="primary-button" type="button" onClick={onContinue}>
          Continue studying
        </button>
        <button className="secondary-button" type="button" onClick={onQuickReview}>
          Try a quick review
        </button>
        <button className="secondary-button" type="button" onClick={onNotes}>
          I&apos;m taking notes
        </button>
      </div>
    </>
  );
  const onEscape = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onContinue();
    }
  };

  if (nativeSupported) {
    return (
      <dialog
        ref={dialogRef}
        className="gentle-reset-dialog"
        aria-labelledby="gentle-reset-title"
        onCancel={(event) => {
          event.preventDefault();
          onContinue();
        }}
        onKeyDown={onEscape}
      >
        {content}
      </dialog>
    );
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="gentle-reset-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gentle-reset-title"
        onKeyDown={onEscape}
      >
        {content}
      </div>
    </div>
  );
}
