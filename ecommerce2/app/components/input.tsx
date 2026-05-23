interface inputProps {
  type: "text" | "password" | "email" | "number";
  name: string;
  placeholder?: string;
  minLength?: number;
  step?: string;
  required?: boolean;
}

export default function Input({
  type,
  name,
  placeholder,
  minLength,
  step,
  required = true,
}: inputProps) {
  return (
    <input
      className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      type={type}
      name={name}
      minLength={type === "number" ? undefined : (minLength ?? 6)}
      step={step}
      required={required}
      placeholder={placeholder}
    />
  );
}
