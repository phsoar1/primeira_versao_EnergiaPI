import { Component } from 'react';

const LOGO_URL = '/logo.png';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[React ErrorBoundary] render crash', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#0B1426] text-white flex items-center justify-center px-6 antialiased">
        <div className="w-full max-w-md border border-slate-800/80 bg-[#111d35]/85 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl text-center">
          <img
            src={LOGO_URL}
            alt="Logo EnergiaPI"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-5"
          />
          <p className="text-[10px] font-extrabold tracking-[0.28em] uppercase text-[#10B981] mb-3">
            EnergiaPI
          </p>
          <h1 className="text-2xl font-black tracking-tight mb-3">
            Ajustamos uma falha na tela.
          </h1>
          <p className="text-sm leading-relaxed text-slate-400 mb-6">
            A sessão foi preservada, mas um componente encontrou dados incompletos. Recarregue para continuar com segurança.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="w-full bg-[#10B981] hover:bg-[#34D399] text-[#031c0e] font-black py-3 rounded-2xl transition-all active:scale-95 uppercase tracking-wider text-xs shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
          >
            Recarregar aplicativo
          </button>
        </div>
      </div>
    );
  }
}
