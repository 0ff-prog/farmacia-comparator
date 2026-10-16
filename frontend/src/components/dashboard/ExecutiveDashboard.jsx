import {
  Award,
  TrendingDown,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Radio,
  Table
} from 'lucide-react';
import { DEFAULT_PROVIDERS, formatCurrency } from '../../utils/analyticsMath';

export default function ExecutiveDashboard({
  benchmark,
  imsMetrics,
  preferredProviderId,
  onNavigate,
  onExportCSV,
  onExportReport,
  providers: providersProp,
  connectionsStatus
}) {
  const PROVIDERS = providersProp || DEFAULT_PROVIDERS;
  const topProvider = benchmark.rankedList?.[0] || null;
  const prefProvider = benchmark.providers?.[preferredProviderId] || null;
  const providers = benchmark.rankedList || [];

  // Calcular droguerías activamente conectadas o con cotizaciones reales en el catálogo
  const activeProvidersList = PROVIDERS.filter((prov) => {
    const conn = connectionsStatus?.[prov.id];
    const isConn = conn ? conn.status === 'connected' : (prov.id === 'prov_1');
    const hasQuotes = (benchmark.providers?.[prov.id]?.quotedCount || 0) > 0;
    return isConn || hasQuotes;
  });
  const activeCount = Math.max(activeProvidersList.length, 1);

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida y Resumen Ejecutivo */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-800/80 to-slate-900 border border-blue-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Panel Inteligente B2B
            </span>
            <span className="text-xs text-slate-400">Actualización en tiempo real</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Consolidado Estratégico de Precios Farmacéuticos
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Comparación continua de {activeCount} {activeCount === 1 ? 'droguería activa' : 'droguerías activas'} en Venezuela con simulación instantánea de descuentos comerciales,
            evaluación de márgenes en el segmento Top 800 IMS y auditoría de competitividad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('matrix')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            <Table className="w-4 h-4" />
            <span>Ver Matriz de Precios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Exportar a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={onExportReport}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Reporte Gerencial</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Catálogo Monitoreado
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Table className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">{benchmark.totalProducts}</div>
            <div className="text-xs text-slate-400 mt-1">
              <strong className="text-emerald-400">{benchmark.comparableCount} SKUs</strong> cotizados por las {activeCount} {activeCount === 1 ? 'farmacia' : 'farmacias activas'}
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Líder de Canasta General
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 truncate">
              {topProvider ? topProvider.shortName : 'N/A'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Canasta: <strong className="text-white font-mono">{formatCurrency(topProvider?.comparableBasketTotal || topProvider?.basketTotal)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Ahorro Potencial Global
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-300 font-mono">
              {benchmark.potentialGlobalSavings}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Comprando al mínimo vs {prefProvider?.shortName || 'Preferido'}
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Canasta Óptima IMS (Top 800)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-mono">
              {formatCurrency(imsMetrics.benchmark.optimalBasketTotal)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <strong className="text-amber-400">{imsMetrics.imsProductsCount} medicamentos</strong> de alta demanda
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de Cuota de Precios Mínimos (Win Rate Bar) */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Distribución de Liderazgo en Precios (Cuota Ganadora)</h3>
            <p className="text-xs text-slate-400">Porcentaje de artículos donde cada farmacia ofrece la opción más económica</p>
          </div>
          <button
            onClick={() => onNavigate('providers')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
          >
            Ver análisis completo por proveedor
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Barra Visual Proporcional */}
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
          {(() => {
            const totalWins = providers.reduce((acc, p) => acc + (p.winCount || 0), 0);
            return providers.map((prov) => {
              const share = totalWins > 0 ? (prov.winCount / totalWins) * 100 : 0;
              const colorClass =
                prov.id === 'prov_1'
                  ? 'bg-blue-500'
                  : prov.id === 'prov_2'
                  ? 'bg-emerald-500'
                  : prov.id === 'prov_3'
                  ? 'bg-purple-500'
                  : 'bg-amber-500';

              return (
                <div
                  key={prov.id}
                  style={{ width: `${share}%` }}
                  className={`${colorClass} h-full transition-all duration-300 relative group`}
                  title={`${prov.shortName}: Win Rate ${prov.winRate}% (${prov.winCount} ganados de ${prov.quotedCount}) | Cuota ganadora: ${share.toFixed(1)}%`}
                />
              );
            });
          })()}
        </div>

        {/* Leyenda de la Barra */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          {providers.map((prov) => {
            const dotClass =
              prov.id === 'prov_1'
                ? 'bg-blue-500'
                : prov.id === 'prov_2'
                ? 'bg-emerald-500'
                : prov.id === 'prov_3'
                ? 'bg-purple-500'
                : 'bg-amber-500';

            return (
              <div key={prov.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                  <div>
                    <span className="font-semibold text-white block truncate max-w-[90px]">{prov.shortName}</span>
                    <span className="text-[10px] text-slate-400">Posición #{prov.rank || '-'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white text-xs">{prov.winRate}%</span>
                  <span className="text-[10px] text-slate-400 block">({prov.winCount} de {prov.quotedCount})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Inferior: Canastas Comparadas y Estado de Red */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparativa Rápida de Canastas */}
        <div className="lg:col-span-2 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Ranking de Costo de Canasta Comparable</h3>
              <p className="text-xs text-slate-400">Total a pagar adquiriendo los productos comunes cotizados por las {activeCount} {activeCount === 1 ? 'farmacia' : 'farmacias activas'}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 font-mono text-xs border border-slate-700">
              {benchmark.comparableCount} Artículos
            </span>
          </div>

          <div className="space-y-3">
            {providers.map((prov) => (
              <div
                key={prov.id}
                className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-700/70 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      prov.rank === 1
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : prov.rank === 2
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        : prov.rank === 3
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    #{prov.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{prov.name}</span>
                      {prov.id === preferredProviderId && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          PREFERIDO
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">Surtido cotizado: {prov.completenessRate}%</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black font-mono text-white">
                    {formatCurrency(prov.comparableBasketTotal > 0 ? prov.comparableBasketTotal : prov.basketTotal)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Ajuste: {prov.adjustmentPercent > 0 ? `+${prov.adjustmentPercent}%` : `${prov.adjustmentPercent}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de Conexión de las Droguerías */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Estado de Conexiones
              </h3>
              <button
                onClick={() => onNavigate('connections')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Configurar
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {activeCount} de {PROVIDERS.length} droguerías con conexión o archivo activo
            </p>

            <div className="space-y-2.5">
              {PROVIDERS.map((prov) => {
                const isApi = prov.id === 'prov_1';
                const conn = connectionsStatus?.[prov.id];
                const quotedCount = benchmark.providers?.[prov.id]?.quotedCount || 0;
                const isConnected = isApi
                  ? (conn?.status === 'connected' || Boolean(quotedCount))
                  : (conn?.status === 'connected' || quotedCount > 0);

                let statusLabel = 'Sin Archivo';
                let tagClass = 'bg-slate-800 text-slate-400 border-slate-700';
                let dotClass = 'bg-slate-500';

                if (isConnected) {
                  statusLabel = quotedCount > 0 ? `Activo (${quotedCount.toLocaleString()} SKUs)` : 'Activo';
                  tagClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                  dotClass = 'bg-emerald-400 animate-pulse';
                }

                const detailText = isApi
                  ? (conn?.label || 'API REST Cobeca en vivo')
                  : isConnected
                  ? (conn?.label?.replace('Archivo cargado: ', '') || `${quotedCount.toLocaleString()} productos cotizados`)
                  : 'Ningún archivo cargado aún';

                return (
                  <div
                    key={prov.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isConnected
                        ? 'bg-slate-900/80 border-slate-700/80'
                        : 'bg-slate-900/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-white block truncate">{prov.shortName}</span>
                      <span className="text-[10px] text-slate-400 block truncate" title={detailText}>
                        {detailText}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${tagClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/60">
            <button
              onClick={() => onNavigate('connections')}
              className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Administrar Conexiones y Archivos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
