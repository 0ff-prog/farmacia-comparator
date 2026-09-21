import { useState } from 'react';
import { ChevronUp, ChevronDown, Award, Sparkles, ArrowUpDown, ChevronLeft, ChevronRight, PackageX } from 'lucide-react';
import { DEFAULT_PROVIDERS, formatCurrency, formatPercent } from '../../utils/analyticsMath';

export default function ComparisonTable({
  products,
  preferredProviderId,
  adjustments
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  const prefProvider = DEFAULT_PROVIDERS.find((p) => p.id === preferredProviderId) || DEFAULT_PROVIDERS[0];

  // Ordenamiento interactivo
  const sortedProducts = [...products].sort((a, b) => {
    let valA, valB;
    if (sortField === 'name') {
      valA = a.display_name.toLowerCase();
      valB = b.display_name.toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortField === 'sku') {
      valA = a.sku;
      valB = b.sku;
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortField === 'minPrice') {
      valA = a.minPrice ?? 999999;
      valB = b.minPrice ?? 999999;
    } else if (sortField === 'deltaMin') {
      valA = a.preferredMetrics?.isAvailable ? a.preferredMetrics.deltaMin : 999999;
      valB = b.preferredMetrics?.isAvailable ? b.preferredMetrics.deltaMin : 999999;
    } else if (sortField === 'deltaComp') {
      valA = a.preferredMetrics?.isAvailable ? a.preferredMetrics.deltaCompetencia : 999999;
      valB = b.preferredMetrics?.isAvailable ? b.preferredMetrics.deltaCompetencia : 999999;
    } else {
      valA = a.sku;
      valB = b.sku;
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  // Paginación
  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 inline ml-1 opacity-60" />;
    }
    return sortAsc ? (
      <ChevronUp className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    );
  };

  if (products.length === 0) {
    return (
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-12 text-center space-y-3">
        <PackageX className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-base font-semibold text-white">No se encontraron productos coincidentes</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Intenta ajustar el texto de búsqueda, desactivar el filtro de categoría o desmarcar el segmento IMS para ver más artículos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl flex flex-col">
      {/* Barra de cabecera de la tabla */}
      <div className="px-5 py-3.5 bg-slate-800/95 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Matriz de 4 Farmacias</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">
            Proveedor Preferido activo: <strong className="text-blue-400 font-semibold">{prefProvider.name}</strong>
          </span>
        </div>

        {/* Selector de Tamaño de Página */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Contenedor con Scroll Horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-900/90 text-slate-300 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
              <th
                onClick={() => handleSort('sku')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors w-24"
              >
                SKU {getSortIcon('sku')}
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                Producto & Detalle {getSortIcon('name')}
              </th>

              {/* Columnas de los 4 Proveedores */}
              {DEFAULT_PROVIDERS.map((prov) => {
                const isPreferred = prov.id === preferredProviderId;
                const adj = adjustments[prov.id] ?? 0;
                return (
                  <th
                    key={prov.id}
                    className={`py-3 px-3 text-center border-l border-slate-700/60 ${
                      isPreferred ? 'bg-blue-950/40 text-blue-300 border-t-2 border-t-blue-500' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-bold">{prov.shortName}</span>
                      <span className="text-[9px] font-normal text-slate-400">
                        {adj !== 0 ? `(Ajuste: ${adj > 0 ? '+' : ''}${adj}%)` : '(Precio Base)'}
                      </span>
                    </div>
                  </th>
                );
              })}

              <th
                onClick={() => handleSort('minPrice')}
                className="py-3 px-3 text-center border-l border-slate-700/60 cursor-pointer hover:text-white"
              >
                Mínimo {getSortIcon('minPrice')}
              </th>

              {/* Métricas del Preferido */}
              <th
                onClick={() => handleSort('deltaMin')}
                className="py-3 px-3 text-center border-l border-slate-700/60 cursor-pointer hover:text-white"
                title="Desviación del proveedor preferido frente al precio mínimo del mercado"
              >
                Δ vs Mínimo {getSortIcon('deltaMin')}
              </th>
              <th
                onClick={() => handleSort('deltaComp')}
                className="py-3 px-3 text-center border-l border-slate-700/60 cursor-pointer hover:text-white"
                title="Desviación del proveedor preferido frente a la media de sus competidores"
              >
                Δ vs Media {getSortIcon('deltaComp')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50 text-xs">
            {paginatedProducts.map((prod) => {
              const prefMetrics = prod.preferredMetrics;

              return (
                <tr
                  key={prod.sku}
                  className="hover:bg-slate-700/30 transition-colors duration-150 group"
                >
                  {/* SKU */}
                  <td className="py-3 px-4 font-mono font-medium text-slate-400 whitespace-nowrap">
                    {prod.sku}
                  </td>

                  {/* Detalle Producto */}
                  <td className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {prod.display_name}
                      </span>
                      {prod.is_ims && (
                        <span
                          title="Segmento Top 800 IMS - Alta Rotación"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          IMS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{prod.category}</span>
                      <span>•</span>
                      <span className="italic text-slate-500">{prod.unit_of_measure}</span>
                    </div>
                  </td>

                  {/* 4 Columnas de Precios por Farmacia con Colorimetría */}
                  {DEFAULT_PROVIDERS.map((prov) => {
                    const ev = prod.evaluations?.[prov.id];
                    const isPreferred = prov.id === preferredProviderId;

                    if (!ev || !ev.hasOffer || !ev.inStock) {
                      return (
                        <td
                          key={prov.id}
                          className={`py-3 px-3 text-center border-l border-slate-700/50 ${
                            isPreferred ? 'bg-blue-950/20' : ''
                          }`}
                        >
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono text-slate-500 bg-slate-800/50 border border-slate-700/50">
                            {ev?.statusLabel || 'Sin Stock'}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={prov.id}
                        className={`py-3 px-3 text-center border-l border-slate-700/50 ${
                          isPreferred ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <div
                          className={`inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-lg border text-xs font-mono transition-transform duration-100 ${ev.colorClass}`}
                        >
                          <span className="font-bold">
                            {formatCurrency(ev.adjustedPrice)}
                          </span>
                          {ev.adjPercent !== 0 && (
                            <span className="text-[9px] opacity-75">
                              Base: {formatCurrency(ev.basePrice)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Precio Mínimo Absoluto */}
                  <td className="py-3 px-3 text-center border-l border-slate-700/50">
                    {prod.minPrice !== null ? (
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {formatCurrency(prod.minPrice)}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">—</span>
                    )}
                  </td>

                  {/* Desviación Preferido vs Mínimo */}
                  <td className="py-3 px-3 text-center border-l border-slate-700/50">
                    {!prefMetrics || !prefMetrics.isAvailable ? (
                      <span className="text-slate-500 font-mono text-[11px]">N/D</span>
                    ) : prefMetrics.isWinner ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Award className="w-3 h-3" />
                        0.0% (Líder)
                      </span>
                    ) : (
                      <span
                        className={`inline-block font-mono text-xs font-semibold ${
                          prefMetrics.deltaMin > 10
                            ? 'text-rose-400 font-bold'
                            : prefMetrics.deltaMin > 5
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        +{prefMetrics.deltaMin}%
                      </span>
                    )}
                  </td>

                  {/* Desviación Preferido vs Media de la Competencia */}
                  <td className="py-3 px-3 text-center border-l border-slate-700/50">
                    {!prefMetrics || !prefMetrics.isAvailable || prefMetrics.competitorAverage === null ? (
                      <span className="text-slate-500 font-mono text-[11px]">N/D</span>
                    ) : prefMetrics.deltaCompetencia <= 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {formatPercent(prefMetrics.deltaCompetencia)}
                      </span>
                    ) : (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          prefMetrics.deltaCompetencia > 8
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                        }`}
                      >
                        +{prefMetrics.deltaCompetencia}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación Inferior */}
      <div className="p-4 bg-slate-800/95 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Mostrando fila <strong className="text-white font-mono">{startIndex + 1}</strong> a{' '}
          <strong className="text-white font-mono">{Math.min(startIndex + pageSize, sortedProducts.length)}</strong> de{' '}
          <strong className="text-white font-mono">{sortedProducts.length}</strong> artículos
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
