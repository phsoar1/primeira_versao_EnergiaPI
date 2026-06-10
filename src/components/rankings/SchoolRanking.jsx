import { Users } from "lucide-react";
import Emoji from "../ui/Emoji";
import {
  EMOJIS,
  nomePublicoEscola,
  obterGre,
} from "../../utils/formatters";

export default function SchoolRanking({
  escolas,
  loading,
  escolaUsuario,
  tm,
  isDark,
}) {
  return (
    <div className="space-y-6 animate-fade-in-scale reveal-on-scroll">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-extrabold tracking-tight ${tm.text}`}>
            CETIs em ação pelo Piauí
          </h3>
          <p className={`text-xs ${tm.textMuted}`}>
            Ranking das escolas estaduais por score acumulado dos auditores.
          </p>
        </div>
        <div
          className={`border min-h-[46px] px-4 py-3 rounded-2xl flex items-center justify-center gap-3 shadow-sm max-w-full text-center ${isDark ? "bg-[#111d35]/80 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <Users className="text-[#10B981]" size={18} />
          <span
            className={`text-xs font-bold leading-snug ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Escolas conectadas
          </span>
        </div>
      </div>

      <div className={`border rounded-[2rem] overflow-hidden shadow-2xl ${tm.card}`}>
        <div
          className={`hidden md:grid grid-cols-12 gap-4 px-6 py-5 border-b text-[10px] font-extrabold tracking-widest uppercase ${isDark ? "bg-[#0B1426]/80 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"}`}
        >
          <div className="col-span-1 text-center">Pos</div>
          <div className="col-span-6">Unidade Escolar / Regional</div>
          <div className="col-span-3 text-right">Auditores</div>
          <div className="col-span-2 text-right">Score</div>
        </div>

        <div className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
          {loading && escolas.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className={`text-sm font-bold ${tm.text}`}>
                Atualizando escolas...
              </p>
            </div>
          ) : escolas.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className={`text-sm font-bold ${tm.text}`}>
                Nenhum CETI disponível para ranking.
              </p>
              <p className={`text-xs mt-1 ${tm.textMuted}`}>
                Importe ou cadastre escolas para iniciar a comparação.
              </p>
            </div>
          ) : (
            escolas.map((escola, index) => {
              const nomeEscola = nomePublicoEscola(escola) || "CETI em validação";
              const detalheEscola = [obterGre(escola), escola.regiao || escola.cidade]
                .filter(Boolean)
                .join(" • ");
              const escolaAtual = nomeEscola === escolaUsuario;

              return (
                <div
                  key={escola.id || index}
                  className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-6 items-center transition-colors duration-200 reveal-on-scroll ${
                    escolaAtual
                      ? "bg-[#10B981]/5 border-y border-[#10B981]/20"
                      : isDark
                        ? "hover:bg-slate-800/30"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <div className="md:col-span-1 text-center font-black text-sm row-span-2 md:row-span-1 self-start md:self-center pt-1 md:pt-0">
                    {index === 0 ? (
                      <span className="text-2xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                        <Emoji>{EMOJIS.ouro}</Emoji>
                      </span>
                    ) : index === 1 ? (
                      <span className="text-xl">
                        <Emoji>{EMOJIS.prata}</Emoji>
                      </span>
                    ) : index === 2 ? (
                      <span className="text-lg">
                        <Emoji>{EMOJIS.bronze}</Emoji>
                      </span>
                    ) : (
                      <span className={`text-sm ${tm.textMuted}`}>{index + 1}</span>
                    )}
                  </div>
                  <div className="md:col-span-6 min-w-0">
                    <h4
                      className={`font-bold text-xs sm:text-sm flex flex-wrap items-center gap-2 leading-snug ${tm.text}`}
                    >
                      {nomeEscola}
                      {escolaAtual && (
                        <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                          Sua Escola
                        </span>
                      )}
                    </h4>
                    {detalheEscola && (
                      <p
                        className={`text-[10px] font-bold tracking-wider mt-1 uppercase ${tm.textMuted}`}
                      >
                        {detalheEscola}
                      </p>
                    )}
                  </div>
                  <div
                    className={`col-start-2 col-span-2 md:col-start-auto md:col-span-3 md:text-right font-extrabold text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {escola.auditores ?? 0}{" "}
                    <span className="text-[10px] text-slate-500 font-medium">
                      auditores
                    </span>
                  </div>
                  <div className="col-start-3 row-start-1 md:row-start-auto md:col-start-auto md:col-span-2 md:text-right font-black text-xs text-[#10B981] justify-self-end">
                    {escola.scoreTotal ?? 0}{" "}
                    <span className="text-[9px] font-bold">pts</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
