import { LIMITS } from "../utils/validators";

// Checkout aur Profile dono ka address form — ek hi jagah labels,
// autocomplete, mobile keyboard (inputMode) aur maxLength. Validation ka
// state parent ke paas rehta hai; yeh sirf fields dikhata hai.

const FIELDS = [
  { name: "fullName", label: "Full name", autoComplete: "name", maxLength: LIMITS.nameMax, span: "half" },
  {
    name: "phone",
    label: "Mobile number",
    autoComplete: "tel-national",
    type: "tel",
    inputMode: "numeric",
    maxLength: 14, // "+91 98765 43210" bhi paste ho sake
    placeholder: "10-digit mobile",
    span: "half",
  },
  { name: "line1", label: "Address", autoComplete: "address-line1", maxLength: LIMITS.addressMax, placeholder: "House no., street, area", span: "full" },
  { name: "line2", label: "Address line 2", optional: true, autoComplete: "address-line2", maxLength: LIMITS.addressMax, placeholder: "Landmark, apartment (optional)", span: "full" },
  // Pincode pehle — daalte hi city/district/state apne aap bhar jaate hain
  { name: "pincode", label: "Pincode", autoComplete: "postal-code", inputMode: "numeric", maxLength: 6, span: "place" },
  { name: "city", label: "City", autoComplete: "address-level2", maxLength: LIMITS.placeMax, span: "place" },
  { name: "district", label: "District", optional: true, autoComplete: "address-level3", maxLength: LIMITS.placeMax, span: "place" },
  { name: "state", label: "State", autoComplete: "address-level1", maxLength: LIMITS.placeMax, span: "place" },
];

export const Field = ({ id, label, optional, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
      {label}
      {optional ? <span className="ml-1 font-normal normal-case tracking-normal">(optional)</span> : <span className="ml-0.5 text-mdn-danger">*</span>}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-mdn-danger">
        {error}
      </p>
    )}
  </div>
);

export const inputClass = (error) =>
  `input-field ${error ? "!border-mdn-danger/60 focus:!border-mdn-danger focus:!ring-mdn-danger/25" : ""}`;

// `pincodeStatus` (optional): pincode ke neeche delivery ka message —
// Checkout isse "delivery available / not available" dikhata hai.
const AddressFields = ({ idPrefix, values, errors, onChange, onBlur, pincodeStatus = null }) => {
  const render = (f) => {
    const id = `${idPrefix}-${f.name}`;
    const error = errors[f.name];
    return (
      <Field key={f.name} id={id} label={f.label} optional={f.optional} error={error}>
        <input
          id={id}
          name={f.name}
          type={f.type || "text"}
          value={values[f.name]}
          onChange={(e) => {
            // Phone/pincode me sirf digits (aur phone me + ya space paste ke liye)
            let v = e.target.value;
            if (f.name === "pincode") v = v.replace(/\D/g, "");
            if (f.name === "phone") v = v.replace(/[^\d+\s-]/g, "");
            onChange(f.name, v);
          }}
          onBlur={() => onBlur(f.name)}
          autoComplete={f.autoComplete}
          inputMode={f.inputMode}
          maxLength={f.maxLength}
          placeholder={f.placeholder}
          required={!f.optional}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClass(error)}
        />
        {f.name === "pincode" && !error && pincodeStatus}
      </Field>
    );
  };

  const by = (span) => FIELDS.filter((f) => f.span === span).map(render);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">{by("half")}</div>
      {by("full")}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{by("place")}</div>
    </>
  );
};

export default AddressFields;
