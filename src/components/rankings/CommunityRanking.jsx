import { Trophy } from "lucide-react";
import Emoji from "../ui/Emoji";
import { EMOJIS } from "../../utils/formatters";

export default function CommunityRanking({
  items,
  loading,
  error,
  usuario,
  tm,
  isDark,
}) {
  return (
    <div className="space-y-6 animate-fade-in-scale reveal-on-scroll">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-extrabold tracking-tight ${tm.text}`}>
            Comunidade EnergiaPI
          </h3>
          <p className={`text-xs ${tm.textMuted}`}>
            Pontuação de estudantes e moradores que concluíram ações de economia.
          </p>
        </div>
        <div
          className={`border min-h-[46px] px-4 py-3 rounded-2xl flex items-center justify-center gap-3 shadow-sm max-w-full text-center ${isDark ? "bg-[#111d35]/80 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <Trophy className="text-[#10B981]" size={18} />
          <span className="text-xs font-bold text-neon-green leading-snug">
            Liderança por participação
          </span>
        </div>
      </div>

      <div className={`border rounded-[2rem] overflow-hidden shadow-2xl ${tm.card}`}>
        <div
          className={`hidden md:grid grid-cols-12 gap-4 px-6 py-5 border-b text-[10px] font-extrabold tracking-widest uppercase ${isDark ? "bg-[#0B1426]/80 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"}`}
        >
          <div className="col-span-1 text-center">Pos</div>
          <div className="col-span-5">Auditor / Perfil</div>
          <div className="col-span-3 text-left">CETI / Comunidade</div>
          <div className="col-span-2 text-right">Badges</div>
          <div className="col-span-1 text-right">Pontos</div>
        </div>

        <div className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
          {loading && items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className={`text-sm font-bold ${tm.text}`}>
                Atualizando comunidade...
              </p>
              <p className={`text-xs mt-1 ${tm.textMuted}`}>
                Estamos preparando os dados da comunidade.
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className={`text-sm font-bold ${tm.text}`}>
                A comunidade ainda não tem pontuação registrada.
              </p>
              <p className={`text-xs mt-1 ${tm.textMuted}`}>
                O ranking aparece quando usuários reais concluem o perfil e missões.
              </p>
              {error && (
                <p className="text-[10px] mt-3 font-bold uppercase tracking-wider text-[#F59E0B]">
                  Não foi possível atualizar neste momento.
                </p>
              )}
            </div>
          ) : (
            items.map((item, index) => {
              const isCurrentUser =
                item.uid === usuario.uid ||
                item.id === usuario.uid ||
                (item.email &&
                  usuario.email &&
                  item.email === usuario.email.toLowerCase());
              return (
                <div
                  key={item.uid || item.id || `${item.nome}-${index}`}
                  className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-5 items-center transition-all reveal-on-scroll ${
                    isCurrentUser
                      ? "bg-[#10B981]/5 border-y border-[#10B981]/15"
                      : isDark
                        ? "hover:bg-slate-800/30"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <div className="md:col-span-1 text-center font-black text-sm row-span-2 md:row-span-1 self-start md:self-center pt-1 md:pt-0">
                    {index === 0 ? (
                      <span className="text-xl">
                        <Emoji>{EMOJIS.ouro}</Emoji>
                      </span>
                    ) : index === 1 ? (
                      <span className="text-lg">
                        <Emoji>{EMOJIS.prata}</Emoji>
                      </span>
                    ) : index === 2 ? (
                      <span className="text-base">
                        <Emoji>{EMOJIS.bronze}</Emoji>
                      </span>
                    ) : (
                      <span className={`text-xs ${tm.textMuted}`}>{index + 1}</span>
                    )}
                  </div>
                  <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#10B981]/10 flex shrink-0 items-center justify-center border border-[#10B981]/25 text-sm font-bold">
                      {(item.nome || "P").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`font-extrabold text-xs sm:text-sm flex flex-wrap items-center gap-2 leading-snug ${tm.text}`}
                      >
                        {item.nome}
                        {isCurrentUser && (
                          <span className="bg-[#10B981]/10 text-[#10B981] text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                            Você
                          </span>
                        )}
                      </h4>
                      <p className={`text-[10px] font-semibold mt-0.5 ${tm.textMuted}`}>
                        {item.perfil}
                      </p>
                    </div>
                  </div>
                  <div className="col-start-2 col-span-2 md:col-start-auto md:col-span-3 min-w-0">
                    <p className={`text-xs font-bold truncate md:whitespace-normal ${tm.text}`}>
                      {item.escola}
                    </p>
                    <p className="text-[10px] text-[#10B981] font-bold mt-0.5">
                      {Number(item.kwhSalvo || 0).toFixed(1)} kWh salvos
                    </p>
                  </div>
                  <div className="col-start-2 md:col-start-auto md:col-span-2 md:text-right text-lg select-none flex md:block gap-1 min-w-0">
                    {(item.badges || []).map((badge, badgeIndex) => (
                      <Emoji key={`${item.uid || item.id}-${badgeIndex}`}>{badge}</Emoji>
                    ))}
                  </div>
                  <div className="col-start-3 row-start-1 md:row-start-auto md:col-start-auto md:col-span-1 md:text-right font-black text-xs text-neon-green justify-self-end">
                    {item.pontuacao || item.score || 0}
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
