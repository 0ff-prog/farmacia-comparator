import { Layers, Award, TrendingDown, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/analyticsMath';

export default function AnalyticsCards({
  benchmark,
  imsMetrics,
  preferredProviderId
}) {
  const topProvider = benchmark.rankedList?.[0] || null;
  const prefProvider = benchmark.providers?.[preferredProviderId] || null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tarjeta 1: Total SKUs y Cobertura */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-lg backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Catálogo Analizado
          </span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-white font-mono">{benchmark.totalProducts}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              4 Farmacias Conectadas
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Proveedor Más Competitivo */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-lg backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Líder de Competitividad
          </span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-emerald-400 truncate">
            {topProvider ? topProvider.shortName : 'N/A'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Canasta Homogénea: <strong className="text-white font-mono">{formatCurrency(topProvider?.comparableBasketTotal || topProvider?.basketTotal)}</strong>
          </div>
        </div>
      </div>

      {/* Tarjeta 3: Simulación de Ahorro Global */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-lg backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Ahorro Potencial Global
          </span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-purple-300 font-mono">
            {benchmark.potentialGlobalSavings}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Comprando el mejor precio vs {prefProvider?.shortName || 'Preferido'}
          </div>
        </div>
      </div>

      {/* Tarjeta 4: Segmento IMS Top 800 */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-lg backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Segmento IMS (Top 800)
          </span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-amber-300 font-mono">
            {imsMetrics.imsProductsCount} <span className="text-xs font-normal text-slate-400">SKUs clave</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Precio prom. canasta óptima: <strong className="text-white font-mono">{formatCurrency(imsMetrics.avgPriceIMS)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
