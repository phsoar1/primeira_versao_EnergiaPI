import { useCallback, useEffect, useRef, useState } from "react";
import {
  addUserDevice,
  removeUserDevice,
  subscribeUserDevices,
  updateUserDevice,
} from "../services/deviceService";

export const useUserDevices = (uid) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const updateTimersRef = useRef(new Map());

  useEffect(() => {
    let ativo = true;
    queueMicrotask(() => {
      if (ativo) setLoading(Boolean(uid));
    });
    const unsubscribe = subscribeUserDevices(uid, (lista) => {
      if (!ativo) return;
      setDevices(lista);
      setLoading(false);
    });

    return () => {
      ativo = false;
      unsubscribe();
    };
  }, [uid]);

  useEffect(
    () => () => {
      updateTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      updateTimersRef.current.clear();
    },
    [],
  );

  const addDevice = useCallback(
    (device) => addUserDevice(uid, device),
    [uid],
  );

  const updateDevice = useCallback(
    (id, patch) => {
      setDevices((atuais) =>
        atuais.map((device) =>
          device.id === id ? { ...device, ...patch } : device,
        ),
      );
      const chave = `${uid}:${id}`;
      const timerAnterior = updateTimersRef.current.get(chave);
      if (timerAnterior) window.clearTimeout(timerAnterior);

      const timer = window.setTimeout(() => {
        updateTimersRef.current.delete(chave);
        updateUserDevice(uid, id, patch).catch((error) => {
          console.error("[Firestore update device debounce]", error);
        });
      }, 260);

      updateTimersRef.current.set(chave, timer);
      return Promise.resolve();
    },
    [uid],
  );

  const deleteDevice = useCallback(
    (id) => {
      setDevices((atuais) => atuais.filter((device) => device.id !== id));
      return removeUserDevice(uid, id);
    },
    [uid],
  );

  return {
    devices,
    loading,
    addDevice,
    updateDevice,
    deleteDevice,
  };
};
