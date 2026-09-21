import { BarChart3, Award } from 'lucide-react';
import { formatCurrency } from '../../utils/analyticsMath';

export default function ProviderBenchmark({
  benchmark,
  preferredProviderId,
  adjustments
}) {
  const providers = benchmark.rankedList || [];

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl backdrop-blur-sm space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Módulo de Análisis por Proveedor</h2>
            <p className="text-xs text-slate-400">
              Evaluación del comportamiento comercial, ranking de canasta, tasa de ganancia (Win Rate) y completitud de catálogo
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
          Canasta Comparable Analizada: <strong className="text-white font-mono">{benchmark.comparableCount}</strong> SKUs
        </div>
      </div>

      {/* Grid de Tarjetas de los 4 Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((prov) => {
          const isPreferred = prov.id === preferredProviderId;
          const currentAdj = adjustments[prov.id] ?? 0;

          return (
            <div
              key={prov.id}
              className={`rounded-xl p-4 border flex flex-col justify-between transition-all duration-200 ${
                isPreferred
                  ? 'bg-slate-800/95 border-blue-500/80 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/5'
                  : 'bg-slate-900/60 border-slate-700/80'
              }`}
            >
              {/* Badge de Ranking y Nombre */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                      prov.rank === 1
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : prov.rank === 2
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : prov.rank === 3
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {prov.rank === 1 && <Award className="w-3.5 h-3.5 mr-0.5" />}
                    Posición #{prov.rank}
                  </span>

                  {isPreferred && (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                      PREFERIDO
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white truncate">{prov.name}</h3>
                <span className="text-xs text-slate-400">{prov.shortName}</span>
              </div>

              {/* Métricas Clave */}
              <div className="space-y-3 my-4 py-3 border-y border-slate-700/50 text-xs">
                {/* Costo Canasta Homogénea */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Costo Canasta:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatCurrency(prov.comparableBasketTotal > 0 ? prov.comparableBasketTotal : prov.basketTotal)}
                  </span>
                </div>

                {/* Win Rate */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tasa Ganadora (Win Rate):</span>
                    <span className="font-mono font-bold text-emerald-400">{prov.winRate}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, prov.winRate)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 text-right">
                    {prov.winCount} de {prov.quotedCount} artículos con mejor precio
                  </div>
                </div>

                {/* Surtido / Completitud */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Surtido Cotizado:</span>
                    <span className="font-mono font-medium text-slate-200">{prov.completenessRate}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, prov.completenessRate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{prov.quotedCount} cotizados</span>
                    <span className={prov.missingCount > 0 ? 'text-amber-400/80' : 'text-slate-500'}>
                      {prov.missingCount} faltantes
                    </span>
                  </div>
                </div>
              </div>

              {/* Ajuste Aplicado e Impacto */}
              <div className="bg-slate-950/40 rounded-lg p-2.5 border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">Ajuste Negociado:</span>
                <span
                  className={`font-mono font-bold ${
                    currentAdj < 0
                      ? 'text-emerald-400'
                      : currentAdj > 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {currentAdj > 0 ? `+${currentAdj}%` : `${currentAdj}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
