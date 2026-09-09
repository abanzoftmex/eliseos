import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export class ModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error(
      `🛡️ [Fault Containment] Error aislado en módulo [${this.props.moduleName || 'Sistema'}]:`,
      error,
      errorInfo
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const moduleName = this.props.moduleName || 'Módulo';

      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm rounded-3xl border border-amber-500/20 m-4">
          <div className="max-w-xl w-full text-center p-8 bg-[#161616] border border-stone-800 rounded-2xl shadow-2xl space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Aislamiento de Fallos Activo
              </span>
              <h2 className="text-2xl font-bold text-stone-100">
                Incidencia en {moduleName}
              </h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                Este error ha sido contenido exitosamente dentro del módulo de{' '}
                <strong className="text-stone-200">{moduleName}</strong>. El resto de las
                operaciones de ELISEOS (Portal del Cliente y Módulos Operativos) siguen
                funcionando sin interrupciones.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-stone-950 p-4 rounded-xl border border-stone-850 overflow-x-auto text-xs font-mono text-red-400/90 max-h-36">
                <p className="font-semibold text-stone-300 mb-1">Detalle del error:</p>
                <code>{this.state.error?.toString()}</code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar {moduleName}
              </button>

              <a
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-all duration-200 border border-stone-700 active:scale-95"
              >
                <Home className="w-4 h-4" />
                Ir al Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModuleErrorBoundary;
