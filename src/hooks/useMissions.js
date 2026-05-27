import { useEffect, useMemo, useState } from "react";
import {
  setUserMissionProgress,
  subscribeMissions,
  subscribeUserMissionProgress,
} from "../services/missionService";

const trilhaPorThreshold = (threshold) => {
  if (threshold >= 900) return "Elite";
  if (threshold >= 700) return "Especialistas";
  if (threshold >= 300) return "Avançadas";
  if (threshold >= 100) return "Intermediárias";
  return "Básicas";
};

export const useMissions = (score, uid) => {
  const [missions, setMissions] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => subscribeMissions(setMissions), []);

  useEffect(() => subscribeUserMissionProgress(uid, setProgress), [uid]);

  const missionsWithProgress = useMemo(
    () =>
      missions.map((mission) => {
        const state = progress[mission.id] || {};
        const threshold = Number(mission.scoreNecessario || 0);
        const desbloqueada =
          state.concluida || state.ativa || Number(score || 0) >= threshold;

        return {
          ...mission,
          ativa: Boolean(state.ativa),
          concluida: Boolean(state.concluida),
          desbloqueada,
          threshold,
          trilha: trilhaPorThreshold(threshold),
        };
      }),
    [missions, progress, score],
  );

  const activateMission = async (id) => {
    setProgress((atual) => ({
      ...atual,
      [id]: { ...(atual[id] || {}), ativa: true },
    }));
    await setUserMissionProgress(uid, id, { ativa: true, concluida: false });
  };

  const completeMission = async (id) => {
    setProgress((atual) => ({
      ...atual,
      [id]: { ...(atual[id] || {}), ativa: false, concluida: true },
    }));
    await setUserMissionProgress(uid, id, { ativa: false, concluida: true });
  };

  return {
    missions: missionsWithProgress,
    activateMission,
    completeMission,
  };
};
