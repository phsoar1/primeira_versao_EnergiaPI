import { useEffect, useMemo, useState } from "react";
import { searchDevices } from "../services/deviceService";
import { searchSchools } from "../services/schoolService";
import { useDebouncedValue } from "./useDebouncedValue";

const useAsyncSearch = (params, searcher) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { termo, categoria, gre, max, debounceMs = 220 } = params;
  const debouncedTerm = useDebouncedValue(termo, debounceMs);

  const stableParams = useMemo(
    () => ({ termo: debouncedTerm, categoria, gre, max }),
    [categoria, debouncedTerm, gre, max],
  );

  useEffect(() => {
    let ativo = true;

    queueMicrotask(() => {
      if (ativo) setLoading(true);
    });
    searcher(stableParams)
      .then((resultado) => {
        if (ativo) setItems(resultado);
      })
      .catch((error) => {
        console.warn("[Catalog search]", error?.message);
        if (ativo) setItems([]);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [searcher, stableParams]);

  return { items, loading, debouncedTerm };
};

export const useSchoolSearch = ({ termo, max = 8 }) =>
  useAsyncSearch({ termo, max, debounceMs: 160 }, searchSchools);

export const useDeviceCatalogSearch = ({ termo, categoria, max = 12 }) =>
  useAsyncSearch({ termo, categoria, max }, searchDevices);
