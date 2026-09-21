/**
 * Utilidades de Exportación a CSV / Excel y Reportes para Gerencia
 */
import { DEFAULT_PROVIDERS } from './analyticsMath';

/**
 * Descarga una cadena como archivo de texto/CSV con soporte UTF-8 BOM para Excel.
 */
function downloadFile(content, fileName, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta la matriz comparativa evaluada actual a CSV compatible con Microsoft Excel.
 */
export function exportComparisonToCSV(evaluatedProducts, preferredProviderId = 'prov_1', adjustments = {}) {
  const prefProvider = DEFAULT_PROVIDERS.find((p) => p.id === preferredProviderId) || DEFAULT_PROVIDERS[0];
  
  const headers = [
    'SKU',
    'Producto',
    'Principio Activo',
    'Categoría',
    'Unidad',
    'Top 800 IMS',
    ...DEFAULT_PROVIDERS.map((p) => `${p.name} (Base)`),
    ...DEFAULT_PROVIDERS.map((p) => `${p.name} (Ajustado ${adjustments[p.id] ? adjustments[p.id] + '%' : '0%'})`),
    'Precio Mínimo',
    'Proveedor Ganador',
    `Desv. ${prefProvider.shortName} vs Mínimo (%)`,
    `Desv. ${prefProvider.shortName} vs Media Comp. (%)`
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = evaluatedProducts.map((p) => {
    const basePrices = DEFAULT_PROVIDERS.map((prov) => p.evaluations?.[prov.id]?.basePrice ?? 'N/C');
    const adjPrices = DEFAULT_PROVIDERS.map((prov) => p.evaluations?.[prov.id]?.adjustedPrice ?? 'N/C');
    const winnerProv = DEFAULT_PROVIDERS.find((prov) => prov.id === p.winnerProviderId)?.shortName || 'N/A';
    const deltaMin = p.preferredMetrics?.isAvailable ? `${p.preferredMetrics.deltaMin}%` : 'N/C';
    const deltaComp = p.preferredMetrics?.isAvailable ? `${p.preferredMetrics.deltaCompetencia}%` : 'N/C';

    return [
      escapeCSV(p.sku),
      escapeCSV(p.display_name),
      escapeCSV(p.active_ingredient || p.display_name),
      escapeCSV(p.category),
      escapeCSV(p.unit_of_measure),
      escapeCSV(p.is_ims ? 'SÍ' : 'NO'),
      ...basePrices.map(escapeCSV),
      ...adjPrices.map(escapeCSV),
      escapeCSV(p.minPrice !== null ? p.minPrice : 'N/C'),
      escapeCSV(winnerProv),
      escapeCSV(deltaMin),
      escapeCSV(deltaComp)
    ].join(';');
  });

  const csvContent = [headers.join(';'), ...rows].join('\r\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `Comparativo_Farmacias_${timestamp}.csv`);
}

/**
 * Exporta un Resumen Ejecutivo Analítico de Negociación para Gerencia.
 */
export function exportExecutiveSummary(benchmark, imsMetrics, adjustments, preferredProviderId, scenarioName = 'Simulación Actual') {
  const prefProvider = DEFAULT_PROVIDERS.find((p) => p.id === preferredProviderId) || DEFAULT_PROVIDERS[0];
  const dateStr = new Date().toLocaleString();

  const lines = [];
  lines.push('=== REPORTE EJECUTIVO DE NEGOCIACIÓN FARMACÉUTICA ===');
  lines.push(`Escenario: ${scenarioName}`);
  lines.push(`Fecha de Generación: ${dateStr}`);
  lines.push(`Proveedor Preferido Base: ${prefProvider.name}`);
  lines.push('');
  lines.push('--- AJUSTES PORCENTUALES APLICADOS ---');
  DEFAULT_PROVIDERS.forEach((prov) => {
    const adj = adjustments[prov.id] ?? 0;
    lines.push(`${prov.name}: ${adj > 0 ? '+' : ''}${adj}%`);
  });
  lines.push('');
  lines.push('--- BENCHMARK GLOBAL DE COMPETITIVIDAD ---');
  lines.push('Ranking;Proveedor;Costo Canasta Homogénea;Cotizados;Win Rate (%);Ítems Ganados;Completitud (%)');
  
  benchmark.rankedList.forEach((prov) => {
    lines.push([
      `#${prov.rank}`,
      prov.name,
      prov.comparableBasketTotal > 0 ? `$${prov.comparableBasketTotal}` : `$${prov.basketTotal}`,
      prov.quotedCount,
      `${prov.winRate}%`,
      prov.winCount,
      `${prov.completenessRate}%`
    ].join(';'));
  });

  lines.push('');
  lines.push('--- ANÁLISIS DE AHORRO ESTIMADO ---');
  lines.push(`Costo Canasta Proveedor Preferido (${prefProvider.shortName}): $${benchmark.preferredBasketTotal}`);
  lines.push(`Costo Canasta Óptima (Comprando siempre el mínimo): $${benchmark.optimalBasketTotal}`);
  lines.push(`Ahorro Potencial Global: ${benchmark.potentialGlobalSavings}%`);
  lines.push('');
  lines.push('--- ANÁLISIS DEL SEGMENTO IMS (TOP 800 ARTÍCULOS DE ALTA ROTACIÓN) ---');
  lines.push('Proveedor;Costo Canasta IMS;Win Rate IMS (%);Índice Competitividad Crítica (ICC)');
  
  Object.values(imsMetrics.benchmark.providers).forEach((prov) => {
    lines.push([
      prov.name,
      `$${prov.imsBasketTotal}`,
      `${prov.imsWinRate}%`,
      `${prov.icc}x`
    ].join(';'));
  });

  lines.push('');
  lines.push('--- DIAGNÓSTICO DE COMPORTAMIENTO COMERCIAL CRUZADO ---');
  imsMetrics.crossAnalysisInsights.forEach((insight) => {
    lines.push(`- [${insight.badge}] ${insight.message}`);
  });

  const content = lines.join('\r\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(content, `Reporte_Gerencial_${timestamp}.csv`);
}
