import { useEffect, useRef } from "react";

export default function AnimatedSlider({
  value,
  min,
  max,
  step,
  onChange,
  colorClass,
  isDark,
}) {
  const sliderRef = useRef(null);
  const frameRef = useRef(null);
  const nextValueRef = useRef(value);
  const trackInset = 12;
  const range = Math.max(Number(max) - Number(min), Number(step) || 1);
  const parsedValue = Number(value);
  const valueNumber = Number.isFinite(parsedValue) ? parsedValue : Number(min);
  const percentage = Math.min(
    Math.max(((valueNumber - Number(min)) / range) * 100, 0),
    100,
  );

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const emitirMudanca = (nextValue) => {
    nextValueRef.current = nextValue;
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      onChange({ target: { value: String(nextValueRef.current) } });
    });
  };

  const ajustarPorPonteiro = (event) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const usableWidth = Math.max(rect.width - trackInset * 2, 1);
    const ratio = Math.min(
      Math.max((event.clientX - rect.left - trackInset) / usableWidth, 0),
      1,
    );
    const raw = ratio * (max - min) + min;
    const stepped = Math.round((raw - min) / step) * step + min;
    const nextValue = Math.min(Math.max(Number(stepped.toFixed(3)), min), max);
    emitirMudanca(nextValue);
  };

  const bloquearGestoGlobal = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <div
      ref={sliderRef}
      data-no-swipe="true"
      data-slider-control="true"
      className="relative h-10 w-full overflow-visible rounded-full select-none touch-none group slider-ios"
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        bloquearGestoGlobal(event);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        ajustarPorPonteiro(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons !== 1) return;
        bloquearGestoGlobal(event);
        ajustarPorPonteiro(event);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }}
      onPointerCancel={(event) => {
        event.stopPropagation();
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }}
    >
      <div className="absolute inset-x-3 top-1/2 h-7 -translate-y-1/2">
        <div
          className={`absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full ${isDark ? "bg-slate-900/80" : "bg-slate-200/90"} shadow-inner border ${isDark ? "border-white/5" : "border-white/70"}`}
        />
        <div
          className={`absolute left-0 top-1/2 h-3 -translate-y-1/2 ${colorClass} rounded-full transition-[width] duration-75 ease-out shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] slider-fill`}
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_6px_16px_rgba(0,0,0,0.24)] ring-2 ring-white/70 transition-[left,transform] duration-75 ease-out pointer-events-none group-active:scale-95 slider-thumb"
          style={{ left: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        data-no-swipe="true"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 touch-none"
      />
    </div>
  );
}
