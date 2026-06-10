import { CheckCircle, Eye, Lock } from "lucide-react";

const dificuldadeClasse = (dificuldade = "") => {
  if (dificuldade.startsWith("F")) return "text-emerald-600 bg-emerald-500/10";
  if (dificuldade.startsWith("M")) return "text-cyan-600 bg-cyan-500/10";
  return "text-red-500 bg-red-500/10";
};

function MissionMetrics({ missao, tm, isDark }) {
  return (
    <div
      className={`grid grid-cols-3 gap-3 p-4 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
    >
      <div className="text-center">
        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}>
          Economia
        </p>
        <p className={`text-sm font-black ${tm.text}`}>
          {missao.impactoKwh} <span className="text-[9px] text-slate-500">kWh</span>
        </p>
      </div>
      <div className="text-center">
        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}>
          Financeiro
        </p>
        <p className="text-sm font-black text-[#10B981]">
          R$ {Number(missao.impactoReais || 0).toFixed(2)}
        </p>
      </div>
      <div className="text-center">
        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}>
          Score
        </p>
        <p className="text-sm font-black text-[#06B6D4]">
          +{missao.pontos} <span className="text-[9px] text-cyan-700/50">pts</span>
        </p>
      </div>
    </div>
  );
}

function MissionCard({ missao, isDark, tm, onAccept, onComplete }) {
  return (
    <div
      className={`border rounded-[2rem] p-6 flex flex-col justify-between space-y-5 relative overflow-hidden transition-all duration-500 animate-fade-in-scale ${
        missao.concluida
          ? isDark
            ? "border-[#10B981]/30 bg-gradient-to-br from-[#10B981]/5 to-[#111d35]"
            : "border-[#10B981]/50 bg-gradient-to-br from-emerald-50 to-white"
          : tm.card
      }`}
    >
      <div className="space-y-3 relative">
        <div className="flex items-center justify-between">
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${isDark ? "text-slate-400 bg-slate-900" : "text-slate-600 bg-slate-100"}`}
          >
            {missao.categoria}
          </span>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${dificuldadeClasse(missao.dificuldade)}`}
          >
            {missao.dificuldade}
          </span>
        </div>
        <h4 className={`text-lg font-extrabold flex items-center gap-2 ${tm.text}`}>
          {missao.concluida && <CheckCircle size={20} className="text-[#10B981]" />}
          {missao.titulo}
        </h4>
        <p className={`text-xs leading-relaxed font-medium ${tm.textMuted}`}>
          {missao.descricao}
        </p>
      </div>

      <MissionMetrics missao={missao} tm={tm} isDark={isDark} />

      <div className="relative z-20">
        {missao.concluida ? (
          <div className="text-center bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider">
            Concluída e Auditada
          </div>
        ) : missao.ativa ? (
          <button
            type="button"
            onClick={() => onComplete(missao.id)}
            className="w-full bg-gradient-to-r from-[#06B6D4] to-[#10B981] text-white font-extrabold text-xs py-4 rounded-2xl transition-all duration-300 uppercase tracking-wider active:scale-[0.98] shadow-[0_8px_20px_rgba(16,185,129,0.2)]"
          >
            Registrar Conclusão
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAccept(missao.id)}
            className={`w-full font-extrabold text-xs py-4 rounded-2xl transition-all duration-300 uppercase tracking-wider active:scale-95 border ${isDark ? "bg-slate-800 text-white hover:bg-slate-700 border-slate-700" : "bg-white text-slate-800 hover:bg-slate-50 border-slate-300 shadow-sm"}`}
          >
            Aceitar Missão
          </button>
        )}
      </div>
    </div>
  );
}

function LockedMissionCard({ missao, isDark, tm }) {
  return (
    <div
      className={`border rounded-[2rem] p-6 flex flex-col justify-between space-y-5 relative overflow-hidden transition-all duration-500 opacity-70 ${isDark ? "bg-slate-900/30 border-slate-800/80" : "bg-white/60 border-slate-200"}`}
    >
      <div className="absolute inset-0 bg-[#0B1426]/10 backdrop-blur-[1.5px] z-10 pointer-events-none" />
      <div className="absolute top-5 right-5 z-20 bg-black/40 p-2.5 rounded-full border border-white/10 shadow-lg">
        <Lock className="text-slate-300 w-4 h-4 animate-pulse" />
      </div>

      <div className="space-y-3 relative z-20 blur-[0.2px]">
        <div className="flex items-center justify-between pr-12">
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${isDark ? "text-slate-400 bg-slate-900" : "text-slate-600 bg-slate-100"}`}
          >
            {missao.categoria}
          </span>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${dificuldadeClasse(missao.dificuldade)}`}
          >
            {missao.dificuldade}
          </span>
        </div>
        <h4 className={`text-lg font-extrabold flex items-center gap-2 ${tm.text}`}>
          {missao.titulo}
        </h4>
        <p className={`text-xs leading-relaxed font-medium ${tm.textMuted}`}>
          {missao.descricao}
        </p>
      </div>

      <div className="relative z-20">
        <MissionMetrics missao={missao} tm={tm} isDark={isDark} />
      </div>

      <div className="relative z-20 text-center bg-white/5 border border-white/10 text-slate-300 py-3.5 rounded-2xl text-[10px] font-extrabold uppercase tracking-wider">
        Libera com {missao.threshold} pts • Trilha {missao.trilha}
      </div>
    </div>
  );
}

export default function MissionsView({
  disponiveis,
  futuras,
  verMais,
  onToggleMore,
  onAccept,
  onComplete,
  tm,
  isDark,
}) {
  return (
    <div className="space-y-6 animate-fade-in-scale reveal-on-scroll">
      <div>
        <h3 className={`text-2xl font-extrabold tracking-tight ${tm.text}`}>
          Pratique economizar energia
        </h3>
        <p className={`text-xs ${tm.textMuted}`}>
          Missões curtas para transformar hábitos em economia real.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {disponiveis.map((missao) => (
          <MissionCard
            key={missao.id}
            missao={missao}
            isDark={isDark}
            tm={tm}
            onAccept={onAccept}
            onComplete={onComplete}
          />
        ))}
      </div>

      {futuras.length > 0 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onToggleMore}
            className={`font-extrabold text-xs py-3.5 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 uppercase tracking-widest border ${isDark ? "bg-white text-slate-900 border-white/10" : "bg-slate-900 text-white border-slate-900"}`}
          >
            <Eye className="w-4 h-4" />{" "}
            {verMais ? "Ocultar Missões Futuras" : "Mostrar Mais Missões"}
          </button>
        </div>
      )}

      {verMais && futuras.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-scale">
          {futuras.map((missao) => (
            <LockedMissionCard
              key={missao.id}
              missao={missao}
              isDark={isDark}
              tm={tm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
