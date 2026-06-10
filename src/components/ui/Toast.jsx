import { Sparkles, X } from "lucide-react";

export default function Toast({ mensagem, isDark, tm, onClose }) {
  if (!mensagem) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 w-[90%] md:w-auto max-w-md ${isDark ? "bg-[#111d35]/90 backdrop-blur-xl border border-slate-700/50" : "bg-white/90 backdrop-blur-xl border border-slate-200"} ${tm.text} p-4 rounded-2xl shadow-2xl z-[100] flex items-center justify-between gap-4 toast-enter`}
    >
      <div className="flex items-center gap-3">
        <Sparkles className="text-[#10B981] flex-shrink-0" size={20} />
        <p className="text-xs font-semibold tracking-wide">{mensagem}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`p-1 rounded-full hover:bg-slate-500/20 ${tm.textMuted} hover:${tm.text} transition-colors`}
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>
    </div>
  );
}
