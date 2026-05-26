import { useEffect, useState } from "react";
import { subscribeRankings } from "../services/firestoreService";

export const useRankings = () => {
  const [rankings, setRankings] = useState({
    escolas: [],
    comunidade: [],
    loading: true,
    lastUpdated: null,
  });

  useEffect(
    () =>
      subscribeRankings((dados) =>
        setRankings({
          ...dados,
          loading: false,
        }),
      ),
    [],
  );

  return rankings;
};
