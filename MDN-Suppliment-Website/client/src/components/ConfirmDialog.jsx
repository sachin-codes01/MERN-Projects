import { useCallback, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import { setScrollLocked } from "../lib/useSmoothScroll";

// window.confirm / window.prompt ki jagah MUI Dialog — site ke theme me,
// keyboard (Esc / Tab / Enter) aur screen reader friendly.
//
//   const [confirm, confirmDialog] = useConfirm();
//   ...
//   if (!(await confirm({ title: "Delete address?", confirmLabel: "Delete", danger: true }))) return;
//   ...
//   return <>{...}{confirmDialog}</>;
//
// `requireText`: user ko yeh text type karna padta hai (permanent delete
// jaise irreversible kaam ke liye) — tab tak confirm button band.

const ConfirmDialog = ({ open, options, onClose }) => {
  const [typed, setTyped] = useState("");
  const { title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, requireText } = options;
  const textOk = !requireText || typed.trim() === requireText.trim();

  const close = (result) => {
    setTyped("");
    onClose(result);
  };

  return (
    <Dialog
      open={open}
      onClose={() => close(false)}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      // Lenis smooth scroll ko bhi rok do, warna peeche page scroll hota rehta
      slotProps={{
        transition: { onEnter: () => setScrollLocked(true), onExited: () => setScrollLocked(false) },
        paper: {
          className: "!m-4 !w-full !max-w-md !rounded-2xl !bg-mdn-charcoal !text-mdn-ink !shadow-xl",
          sx: { backgroundImage: "none" },
        },
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (textOk) close(true);
        }}
        className="p-6"
      >
        <h2 id="confirm-dialog-title" className="font-heading text-lg font-bold text-mdn-ink">
          {title}
        </h2>
        {message && (
          <p id="confirm-dialog-message" className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mdn-gray">
            {message}
          </p>
        )}

        {requireText && (
          <div className="mt-4">
            <label htmlFor="confirm-dialog-input" className="mb-1.5 block text-xs font-semibold text-mdn-gray">
              Type <span className="font-bold text-mdn-ink">{requireText}</span> to confirm
            </label>
            <input
              id="confirm-dialog-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
              className="input-field"
            />
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => close(false)} className="btn-secondary w-full sm:w-auto" autoFocus={!requireText}>
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={!textOk}
            className={`w-full sm:w-auto ${
              danger
                ? "inline-flex min-h-[48px] items-center justify-center rounded-lg bg-mdn-danger px-5 text-[15px] font-semibold text-white transition-colors hover:bg-mdn-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
                : "btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export const useConfirm = () => {
  const [state, setState] = useState({ open: false, options: {} });
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState({ open: true, options });
      }),
    []
  );

  const handleClose = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState((s) => ({ ...s, open: false }));
  };

  const dialog = <ConfirmDialog open={state.open} options={state.options} onClose={handleClose} />;
  return [confirm, dialog];
};

export default ConfirmDialog;
