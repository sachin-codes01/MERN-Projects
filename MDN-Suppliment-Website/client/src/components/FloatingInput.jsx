import { useId, useState } from "react";

/**
 * Material-style floating-label input. Drop-in replacement for a plain
 * <input> on required fields — label floats up on focus/filled, with an
 * animated green underline and error state.
 *
 * <FloatingInput label="Full name" name="fullName" value={form.fullName}
 *   onChange={handleChange} required error={fieldErrors.fullName} />
 */
export default function FloatingInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  error = "",
  className = "",
  ...rest
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || String(value ?? "").length > 0;

  return (
    <div className={`relative pt-1 ${className}`}>
      <div
        className={`relative rounded-lg border bg-mdn-charcoal transition-colors duration-200 ${
          error ? "border-red-500/60" : focused ? "border-mdn-green" : "border-white/10"
        }`}
      >
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder=" "
          className="peer w-full bg-transparent px-4 pb-2.5 pt-5 text-sm text-mdn-white outline-none"
          {...rest}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 origin-left transition-all duration-200 ease-out ${
            floated
              ? "top-1.5 scale-[0.72] text-mdn-green"
              : "top-1/2 -translate-y-1/2 scale-100 text-mdn-gray"
          }`}
        >
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
        {/* Animated focus underline */}
        <span
          className={`pointer-events-none absolute bottom-0 left-0 h-[2px] bg-mdn-green transition-all duration-300 ease-out ${
            focused ? "w-full" : "w-0"
          }`}
        />
      </div>
      {error && <p className="mt-1 animate-fade-up text-xs text-red-400">{error}</p>}
    </div>
  );
}
