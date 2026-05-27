import { useMemo } from "react";
import { nomePublicoEscola } from "../utils/formatters";
import { useRankings } from "./useRankings";

export const useCommunityRanking = () => {
  const rankings = useRankings();

  const comunidadeOrdenada = useMemo(
    () =>
      [...rankings.comunidade].sort((a, b) => {
        const scoreDelta =
          Number(b.score || b.pontuacao || 0) -
          Number(a.score || a.pontuacao || 0);
        if (scoreDelta) return scoreDelta;
        return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
      }),
    [rankings.comunidade],
  );

  const escolasOrdenadas = useMemo(
    () =>
      [...rankings.escolas].sort((a, b) => {
        const scoreDelta =
          Number(b.scoreTotal || 0) - Number(a.scoreTotal || 0);
        if (scoreDelta) return scoreDelta;
        const auditoresDelta =
          Number(b.auditores || 0) - Number(a.auditores || 0);
        if (auditoresDelta) return auditoresDelta;
        return nomePublicoEscola(a).localeCompare(nomePublicoEscola(b), "pt-BR");
      }),
    [rankings.escolas],
  );

  return {
    ...rankings,
    comunidadeOrdenada,
    escolasOrdenadas,
  };
};
