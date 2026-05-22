interface inputProps {
  type: "text" | "password" | "email";
  name: string;
  placeholder?: string;
}

export default function Input({ type, name, placeholder }: inputProps) {
  return (
    <input
      className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      type={type}
      name={name}
      minLength={6}
      placeholder={placeholder}
    />
  );
}
