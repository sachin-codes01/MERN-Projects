import { useState } from "react";

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery is taking too long",
  "Changed my mind",
  "Item no longer needed",
  "Other",
];

export default function CancelOrderModal({ order, onClose, onConfirm, cancelling }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const isOther = selectedReason === "Other";
  const finalReason = isOther ? otherReason.trim() : selectedReason;
  const canSubmit = selectedReason && (!isOther || otherReason.trim().length > 0);

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm(finalReason);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md animate-fade-up rounded-b-none p-6 sm:rounded-b-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-mdn-white">Cancel Order</h3>
        <p className="mt-1 text-sm text-mdn-gray">
          Order <span className="font-semibold text-mdn-white">{order.orderNumber}</span> — please tell us why
          you're cancelling.
        </p>

        <div className="mt-5 space-y-2.5">
          {CANCEL_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                selectedReason === reason
                  ? "border-mdn-green/50 bg-mdn-green/10 text-mdn-white"
                  : "border-white/10 text-mdn-gray hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="cancelReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="h-4 w-4 accent-mdn-green"
              />
              {reason}
            </label>
          ))}
        </div>

        {isOther && (
          <textarea
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="Please tell us more..."
            rows={3}
            className="input-field mt-3 w-full resize-none"
            autoFocus
          />
        )}

        <p className="mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
          This action cannot be undone. Any applicable refund will be processed within 5–7 business days.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            onClick={handleConfirm}
            disabled={!canSubmit || cancelling}
            className="w-full rounded-lg bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
          <button onClick={onClose} disabled={cancelling} className="btn-secondary w-full sm:w-auto">
            Keep Order
          </button>
        </div>
      </div>
    </div>
  );
}