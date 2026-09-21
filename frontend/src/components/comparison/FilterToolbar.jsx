import { Search, Filter, Sparkles, X, Layers } from 'lucide-react';
import { DEFAULT_PROVIDERS } from '../../utils/analyticsMath';

export default function FilterToolbar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  imsOnly,
  onToggleIms,
  deviationFilter,
  onDeviationFilterChange,
  preferredProviderId,
  totalCount,
  filteredCount,
  onClearFilters
}) {
  const prefProvider = DEFAULT_PROVIDERS.find((p) => p.id === preferredProviderId) || DEFAULT_PROVIDERS[0];
  const hasActiveFilters = Boolean(searchTerm || selectedCategory !== 'all' || imsOnly || deviationFilter !== 'all');

  return (
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 shadow-md backdrop-blur-sm space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Buscador Predictivo */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por producto, principio activo o SKU (ej: Losartán, SKU-1002)..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle Rápido IMS Top 800 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleIms(!imsOnly)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-sm ${
              imsOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-2 ring-amber-500/20'
                : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${imsOnly ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span>Top 800 IMS</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${imsOnly ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              Alta Rotación
            </span>
          </button>
        </div>
      </div>

      {/* Fila de Filtros Secundarios */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/50 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Categoría */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Layers className="w-3.5 h-3.5" />
              Categoría:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Rendimiento del Proveedor Preferido */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Rendimiento {prefProvider.shortName}:
            </span>
            <select
              value={deviationFilter}
              onChange={(e) => onDeviationFilterChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los rangos</option>
              <option value="winner">🏆 Mejor Precio del Mercado (0% desv.)</option>
              <option value="competitive">✓ Competitivo vs Media (Δ &le; 0%)</option>
              <option value="overpriced_slight">⚠️ Sobreprecio Leve (0% &lt; Δ &le; 5%)</option>
              <option value="overpriced_high">🚨 Sobreprecio Crítico (Δ &gt; 5%)</option>
              <option value="unavailable">✕ Sin Stock / No Cotizado</option>
            </select>
          </div>
        </div>

        {/* Resumen de Conteo y Limpieza */}
        <div className="flex items-center gap-3">
          <div className="text-slate-400 text-xs">
            Mostrando <strong className="text-white font-mono">{filteredCount}</strong> de{' '}
            <span className="font-mono">{totalCount}</span> SKUs
          </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
