import { Sparkles, AlertTriangle, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/analyticsMath';

export default function IMSCriticalAnalysis({
  imsMetrics,
  preferredProviderId
}) {
  const { benchmark, avgPriceIMS, crossAnalysisInsights, imsProductsCount } = imsMetrics;
  const providers = Object.values(benchmark.providers || {});
  const prefProvider = benchmark.providers?.[preferredProviderId] || null;

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl backdrop-blur-sm space-y-5">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Módulo de Análisis por Segmento IMS (Top 800 Artículos)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Alta Rotación
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Control estratégico de precios sobre los medicamentos de mayor volumen, auditoría de márgenes y competitividad crítica
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
          Artículos Top 800 en Muestra: <strong className="text-amber-300 font-mono">{imsProductsCount}</strong>
        </div>
      </div>

      {/* Tarjetas KPI de Subtotales IMS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/70">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Costo Óptimo Canasta IMS
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatCurrency(benchmark.optimalBasketTotal)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Adquiriendo cada artículo al precio mínimo de mercado
          </span>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/70">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Canasta IMS ({prefProvider?.shortName || 'Preferido'})
          </span>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">
            {formatCurrency(benchmark.preferredBasketTotal)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Ahorro potencial en Top 800: <strong className="text-emerald-400 font-semibold">{benchmark.potentialGlobalSavings}%</strong>
          </span>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/70">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Precio Promedio Unitario IMS
          </span>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">
            {formatCurrency(avgPriceIMS)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Promedio ponderado de los artículos de alta rotación
          </span>
        </div>
      </div>

      {/* Tabla del Índice de Competitividad Crítica (ICC) */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-700/80 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Índice de Competitividad Crítica (ICC) por Proveedor
          </h3>
          <span className="text-[11px] text-slate-400">
            Fórmula: <code className="text-amber-300 font-mono">WinRate(IMS) / WinRate(Global)</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-[11px] border-b border-slate-800">
                <th className="py-2.5 px-4 font-semibold">Proveedor</th>
                <th className="py-2.5 px-3 text-center font-semibold">Costo Canasta IMS</th>
                <th className="py-2.5 px-3 text-center font-semibold">Win Rate IMS</th>
                <th className="py-2.5 px-3 text-center font-semibold">Win Rate Global</th>
                <th className="py-2.5 px-3 text-center font-semibold">Índice ICC</th>
                <th className="py-2.5 px-4 font-semibold">Diagnóstico Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {providers.map((prov) => {
                const isAggressive = prov.icc >= 1.15;
                const isInflating = prov.icc <= 0.85;

                return (
                  <tr key={prov.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white">{prov.name}</span>
                      <span className="text-[11px] text-slate-400 block">{prov.shortName}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      {formatCurrency(prov.imsBasketTotal)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">
                      {prov.imsWinRate}%
                      <span className="text-[10px] text-slate-500 block">({prov.imsWinCount} ganados)</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {prov.winRate}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                          isAggressive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isInflating
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {prov.icc}x
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isAggressive ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          Agresivo en alta rotación (Estrategia volumen)
                        </span>
                      ) : isInflating ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Márgenes inflados en productos clave
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          Comportamiento homogéneo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis Cruzado Inteligente */}
      {crossAnalysisInsights.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Alertas de Análisis Cruzado (Patrones de Mercado Detectados):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {crossAnalysisInsights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/80 flex items-start gap-3"
              >
                <div className="mt-0.5">
                  {insight.type === 'aggressive' ? (
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Zap className="w-4 h-4" />
                    </div>
                  ) : insight.type === 'cross' ? (
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{insight.badge}</span>
                    <span className="text-[10px] text-slate-400">({insight.providerName})</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
