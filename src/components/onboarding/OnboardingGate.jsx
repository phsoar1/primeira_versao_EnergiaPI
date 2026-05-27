import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle, Home, Loader2, LogOut, MapPin } from "lucide-react";
import SchoolSearchPicker from "../schools/SchoolSearchPicker";

const VIDEO_SRC = "/videos/demo.mp4";

const apenasNumeros = (valor) => String(valor || "").replace(/\D/g, "");

const formatarCep = (valor) => {
  const digitos = apenasNumeros(valor).slice(0, 8);
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
};

const montarEndereco = ({ bairro, numero, cidade, estado, cep }) =>
  `${bairro}, No ${numero}, ${cidade} - ${estado} - CEP: ${formatarCep(cep)}`;

function InstitutionalVideo() {
  const [videoErro, setVideoErro] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      {!videoErro && (
        <video
          className="h-full w-full rounded-3xl object-cover"
          src={VIDEO_SRC}
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoErro(true)}
        />
      )}
      {videoErro && (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),rgba(11,20,38,0.92)_54%)]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#10B981]/25 bg-white/5 shadow-[0_18px_50px_rgba(16,185,129,0.18)]">
              <img
                src="/logo.png"
                alt="Logo EnergiaPI"
                className="h-11 w-11 object-contain"
              />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white">
              EnergiaPI
            </p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Demonstração em breve
            </p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1426]/55 via-transparent to-transparent" />
    </div>
  );
}

export default function OnboardingGate({ usuario, onSubmit, onLogout, isDark, tm }) {
  const [tipoUsuario, setTipoUsuario] = useState("estudante");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [estado, setEstado] = useState("");
  const [cepStatus, setCepStatus] = useState("idle");
  const [cepMensagem, setCepMensagem] = useState("");
  const [school, setSchool] = useState(null);
  const [saving, setSaving] = useState(false);

  const cepNumeros = apenasNumeros(cep);
  const estudante = tipoUsuario === "estudante";
  const formularioValido = useMemo(
    () =>
      cepNumeros.length === 8 &&
      cepStatus === "encontrado" &&
      numero &&
      cidade &&
      bairro &&
      estado &&
      (!estudante || school?.id),
    [bairro, cepNumeros.length, cepStatus, cidade, estado, estudante, numero, school?.id],
  );

  const handleCepChange = (valor) => {
    const cepFormatado = formatarCep(valor);
    setCep(cepFormatado);
    if (apenasNumeros(cepFormatado).length !== 8) {
      setCepStatus("idle");
      setCepMensagem("");
      setCidade("");
      setBairro("");
      setEstado("");
    }
  };

  useEffect(() => {
    if (cepNumeros.length !== 8) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCepStatus("buscando");
      setCepMensagem("Consultando CEP...");

      try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`, {
          signal: controller.signal,
        });
        if (!resposta.ok) throw new Error("Falha ao consultar CEP.");
        const dados = await resposta.json();
        if (dados.erro) {
          setCepStatus("erro");
          setCepMensagem("CEP nao encontrado.");
          return;
        }

        setCidade(dados.localidade || "");
        setBairro(dados.bairro || "");
        setEstado(dados.uf || "");
        setCepStatus("encontrado");
        setCepMensagem("Endereco localizado.");
      } catch (error) {
        if (error.name === "AbortError") return;
        setCepStatus("erro");
        setCepMensagem("Nao foi possivel consultar o CEP agora.");
      }
    }, 420);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cepNumeros]);

  const enviar = async (event) => {
    event?.preventDefault();
    if (!formularioValido || saving) return;

    setSaving(true);
    try {
      await onSubmit({
        tipoUsuario,
        escolaId: estudante ? school.id : "",
        escolaNome: estudante ? school.nome : "",
        GRE: estudante ? school.GRE || school.gre || "" : "",
        endereco: montarEndereco({ bairro, numero, cidade, estado, cep }),
        numero,
        cidade,
        bairro,
        estado,
        cep: formatarCep(cep),
        onboardingCompleto: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 mesh-gradient-auth relative overflow-y-auto ios-scroll scroll-custom px-4 py-5 md:px-8 md:py-8">
      <button
        type="button"
        onClick={onLogout}
        className="fixed right-4 top-4 z-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95 flex items-center gap-2"
      >
        <LogOut size={14} /> Sair
      </button>

      <form
        onSubmit={enviar}
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
      >
        <div className="space-y-5 animate-fade-in-scale">
          <InstitutionalVideo />
          <p className="text-sm leading-relaxed text-slate-300 md:text-base">
            Bem-vindo à Energia PI. Somos especialistas em soluções inteligentes de energia, comprometidos em entregar economia, sustentabilidade e eficiência para a sua casa ou empresa.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0B1426]/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:p-7 animate-fade-in-scale">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#10B981]">
              Perfil inicial
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
              Você é um estudante ou morador?
            </h1>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
              {usuario?.nome || "Auditor EnergiaPI"}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoUsuario("morador")}
              className={`rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.98] ${
                tipoUsuario === "morador"
                  ? "border-[#10B981]/50 bg-[#10B981]/15 text-white shadow-[0_12px_28px_rgba(16,185,129,0.16)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <Home className="mb-3 text-[#10B981]" size={22} />
              <span className="block text-sm font-extrabold">Morador</span>
            </button>
            <button
              type="button"
              onClick={() => setTipoUsuario("estudante")}
              className={`rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.98] ${
                tipoUsuario === "estudante"
                  ? "border-[#10B981]/50 bg-[#10B981]/15 text-white shadow-[0_12px_28px_rgba(16,185,129,0.16)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <BookOpen className="mb-3 text-[#10B981]" size={22} />
              <span className="block text-sm font-extrabold">Estudante</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <input
                required
                type="text"
                value={cep}
                onChange={(event) => handleCepChange(event.target.value)}
                inputMode="numeric"
                maxLength={9}
                placeholder="CEP"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
              />
              <input
                required
                type="text"
                value={numero}
                onChange={(event) => setNumero(apenasNumeros(event.target.value))}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Número"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
              />
            </div>

            {cepMensagem && (
              <p className={`ml-1 text-[10px] font-bold uppercase tracking-wider ${cepStatus === "erro" ? "text-[#FCA5A5]" : cepStatus === "encontrado" ? "text-[#10B981]" : "text-slate-400"}`}>
                {cepMensagem}
              </p>
            )}

            {cepStatus === "encontrado" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[bairro, cidade, estado].map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-slate-300"
                  >
                    <MapPin size={13} className="shrink-0 text-[#10B981]" />
                    <span className="truncate">{item || "Completar"}</span>
                  </div>
                ))}
              </div>
            )}

            {estudante && (
              <div className="animate-fade-in-scale">
                <SchoolSearchPicker
                  selectedSchool={school}
                  onSelect={setSchool}
                  isDark={isDark}
                  tm={tm}
                  label="CETI"
                  buttonText="Pesquisar"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!formularioValido || saving}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#06B6D4] px-6 py-4 text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(16,185,129,0.25)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            Enviar
          </button>

          <p className="mt-5 text-xs leading-relaxed text-slate-400">
            Com tecnologia de ponta e uma equipe altamente qualificada, transformamos o potencial energético do Piauí em resultados reais e seguros para você. Descubra como podemos otimizar o seu consumo com total transparência.
          </p>
        </div>
      </form>
    </div>
  );
}
