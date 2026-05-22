interface buttonProps {
  type: "button" | "submit" | "reset";
  onClick?: () => void;
  text?: string;
}

export default function Button({ type, onClick, text }: buttonProps) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      type={type}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
