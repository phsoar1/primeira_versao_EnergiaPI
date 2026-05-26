import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Search, School, X } from "lucide-react";
import { useSchoolSearch } from "../../hooks/useCatalogSearch";

const getGRE = (school) => school?.GRE || school?.gre || "";
const fallbackTheme = {
  modal:
    "bg-[#111d35]/95 backdrop-blur-2xl border-slate-700/50 shadow-2xl",
  input:
    "bg-[#0e1930]/50 border-slate-700 text-white focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]",
  text: "text-white",
  textMuted: "text-slate-400",
};

export default function SchoolSearchPicker({
  selectedSchool,
  onSelect,
  isDark,
  tm,
  label = "CETI",
  buttonText = "Pesquisar",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const theme = tm || fallbackTheme;
  const darkMode = isDark ?? true;
  const { items, loading } = useSchoolSearch({
    termo: query,
    max: query ? 10 : 8,
  });

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, open]);

  const selecionarEscola = (school) => {
    onSelect?.({
      ...school,
      GRE: getGRE(school),
      gre: getGRE(school),
    });
    closeModal();
  };

  const modal = open ? (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/65 p-3 backdrop-blur-xl sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="school-search-title"
        className={`${theme.modal} relative my-auto flex w-full max-w-2xl animate-fade-in-scale flex-col overflow-hidden rounded-[2rem] border p-4 shadow-2xl sm:p-5 md:p-7`}
        style={{ maxHeight: "min(88dvh, 720px)" }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#10B981]">
              Escola vinculada
            </p>
            <h3
              id="school-search-title"
              className={`text-xl md:text-2xl font-extrabold tracking-tight ${theme.text}`}
            >
              Encontre seu CETI
            </h3>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className={`p-2 rounded-full hover:bg-slate-500/10 ${theme.textMuted} hover:text-[#EF4444] transition-colors`}
            aria-label="Fechar pesquisa de CETI"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite o nome do CETI"
            autoComplete="off"
            className={`w-full ${theme.input} pl-12 pr-5 py-4 rounded-2xl text-sm outline-none transition-all duration-300`}
          />
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 scroll-custom ios-scroll">
          {loading ? (
            <div
              className={`border rounded-2xl p-5 text-center ${darkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}
            >
              <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className={`text-xs font-bold ${theme.textMuted}`}>
                Buscando CETIs...
              </p>
            </div>
          ) : items.length > 0 ? (
            items.map((school) => {
              const active = selectedSchool?.id === school.id;
              return (
                <button
                  type="button"
                  key={school.id}
                  onClick={() => selecionarEscola(school)}
                  className={`w-full text-left px-4 py-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                    active
                      ? "bg-[#10B981]/15 border-[#10B981]/40"
                      : darkMode
                        ? "bg-slate-900/35 border-slate-800 hover:bg-slate-800/60 hover:border-[#10B981]/40"
                        : "bg-slate-50 border-slate-200 hover:bg-white hover:border-[#10B981]/40"
                  }`}
                >
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-extrabold truncate ${theme.text}`}
                    >
                      {school.nome}
                    </span>
                    <span
                      className={`block text-[10px] font-bold uppercase tracking-wider mt-1 ${theme.textMuted}`}
                    >
                      {getGRE(school)} Â· {school.regiao || school.cidade}
                    </span>
                  </span>
                  {active && (
                    <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div
              className={`border rounded-2xl p-5 text-center ${darkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}
            >
              <p className={`text-sm font-bold ${theme.text}`}>
                Nenhum CETI encontrado.
              </p>
              <p className={`text-xs mt-1 ${theme.textMuted}`}>
                Tente outro termo de busca.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-2">
      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300 flex items-center justify-between gap-3 text-left active:scale-[0.99]"
      >
        <span className="flex items-center gap-3 min-w-0">
          <Search className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs font-extrabold truncate">
              {selectedSchool?.nome || buttonText}
            </span>
            {selectedSchool?.nome && (
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {getGRE(selectedSchool)} Â· {selectedSchool.cidade}
              </span>
            )}
          </span>
        </span>
        {selectedSchool?.nome ? (
          <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" />
        ) : (
          <School className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {modal && createPortal(modal, document.body)}
    </div>
  );
}
