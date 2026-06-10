import { X } from "lucide-react";

export default function QuickEditPopover({
  quickEdit,
  isDark,
  tm,
  onApply,
  onClose,
}) {
  if (!quickEdit) return null;

  return (
    <div
      data-quick-editor="true"
      className={`${tm.modal} fixed z-[120] w-[238px] rounded-[1.5rem] border p-3 shadow-2xl animate-fade-in-scale gpu-smooth`}
      style={{
        top: quickEdit.anchor.top,
        left: quickEdit.anchor.left,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className={`text-[10px] font-black uppercase tracking-widest ${tm.textMuted}`}>
          {quickEdit.label}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-full hover:bg-slate-500/10 ${tm.textMuted} hover:text-[#EF4444] transition-colors`}
          aria-label="Fechar ajuste rápido"
        >
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-[42px_1fr_42px] items-center gap-2">
        <button
          type="button"
          onClick={() => onApply(quickEdit.value - quickEdit.step)}
          className={`${isDark ? "bg-slate-900/70 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} h-10 rounded-2xl border text-lg font-black active:scale-95 transition-all`}
        >
          -
        </button>
        <input
          type="number"
          min={quickEdit.min}
          max={quickEdit.max}
          step={quickEdit.step}
          value={quickEdit.value}
          onChange={(event) => onApply(event.target.value)}
          className={`h-10 text-center rounded-2xl border text-sm font-black outline-none ${tm.input}`}
        />
        <button
          type="button"
          onClick={() => onApply(quickEdit.value + quickEdit.step)}
          className={`${isDark ? "bg-slate-900/70 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} h-10 rounded-2xl border text-lg font-black active:scale-95 transition-all`}
        >
          +
        </button>
      </div>
      <input
        type="range"
        min={quickEdit.min}
        max={quickEdit.max}
        step={quickEdit.step}
        value={quickEdit.value}
        onChange={(event) => onApply(event.target.value)}
        className="mt-3 w-full accent-[#10B981]"
      />
      <p className="mt-2 text-center text-[10px] font-black uppercase tracking-widest text-[#10B981]">
        {quickEdit.value}
        {quickEdit.suffix}
      </p>
    </div>
  );
}
