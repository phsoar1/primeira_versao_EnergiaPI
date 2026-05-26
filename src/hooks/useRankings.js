import { useEffect, useState } from "react";
import { subscribeRankings } from "../services/firestoreService";

export const useRankings = () => {
  const [rankings, setRankings] = useState({
    escolas: [],
    comunidade: [],
    loading: true,
    error: null,
    fromCache: false,
    lastUpdated: null,
  });

  useEffect(
    () =>
      subscribeRankings((dados) =>
        setRankings((atual) => ({
          escolas: dados.escolas?.length ? dados.escolas : atual.escolas,
          comunidade: dados.comunidade?.length
            ? dados.comunidade
            : atual.comunidade,
          loading: false,
          error: dados.error || null,
          fromCache: Boolean(dados.fromCache),
          lastUpdated: dados.lastUpdated || atual.lastUpdated,
        })),
      ),
    [],
  );

  return rankings;
};
