/**
 * Motor Matemático y Analítico para el Comparador de Farmacias
 * Maneja cálculos dinámicos en tiempo real para 4 proveedores/farmacias:
 * - Ajustes porcentuales por lista
 * - Colorimetría por fila (Verde, Amarillo, Rojo, Gris)
 * - Métricas de Proveedor Preferido (Desviación vs Mínimo y vs Media)
 * - Ranking global de competitividad, Win Rate y Surtido
 * - Módulo analítico IMS (Top 800) e Índice de Competitividad Crítica (ICC)
 */

export const DEFAULT_PROVIDERS = [
  { id: 'prov_1', name: 'Droguería Cobeca', shortName: 'Cobeca', color: 'blue', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'prov_2', name: 'Farmacia Saas', shortName: 'Saas', color: 'emerald', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'prov_3', name: 'Farmacia Locatel', shortName: 'Locatel', color: 'violet', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'prov_4', name: 'Farmacia Farmatodo', shortName: 'Farmatodo', color: 'amber', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
];

/**
 * Calcula el precio ajustado según el porcentaje dinámico.
 */
export function calculateAdjustedPrice(basePrice, adjustmentPercent = 0) {
  if (basePrice === undefined || basePrice === null || isNaN(basePrice) || basePrice <= 0) {
    return null;
  }
  const adj = Number(adjustmentPercent) || 0;
  const factor = 1 + adj / 100;
  return Math.max(0, Math.round(basePrice * factor * 100) / 100);
}

/**
 * Evalúa una fila/producto comparando las 4 farmacias.
 */
export function evaluateProductRow(product, adjustments = {}, preferredProviderId = 'prov_1') {
  const providerEvaluations = {};
  const validPrices = [];

  DEFAULT_PROVIDERS.forEach((prov) => {
    const offer = product.suppliers?.[prov.id];
    const adjPercent = adjustments[prov.id] ?? 0;

    if (!offer || !offer.in_stock || offer.base_price <= 0) {
      providerEvaluations[prov.id] = {
        providerId: prov.id,
        providerName: prov.name,
        shortName: prov.shortName,
        hasOffer: Boolean(offer),
        inStock: Boolean(offer?.in_stock),
        basePrice: offer?.base_price ?? null,
        adjustedPrice: null,
        adjPercent,
        colorTag: 'muted', // Gris / N/A
        colorClass: 'text-slate-500 bg-slate-800/40 border-slate-700/50',
        statusLabel: offer ? 'Sin Stock' : 'No Cotizado',
        isMin: false,
        isMax: false,
        isIntermediate: false,
      };
      return;
    }

    const adjustedPrice = calculateAdjustedPrice(offer.base_price, adjPercent);
    providerEvaluations[prov.id] = {
      providerId: prov.id,
      providerName: prov.name,
      shortName: prov.shortName,
      hasOffer: true,
      inStock: true,
      basePrice: offer.base_price,
      adjustedPrice,
      adjPercent,
      colorTag: 'normal',
      colorClass: '',
      statusLabel: 'Disponible',
      isMin: false,
      isMax: false,
      isIntermediate: false,
    };
    validPrices.push({ providerId: prov.id, price: adjustedPrice });
  });

  if (validPrices.length === 0) {
    return {
      ...product,
      evaluations: providerEvaluations,
      minPrice: null,
      maxPrice: null,
      winnerProviderId: null,
      preferredMetrics: null,
    };
  }

  const pricesOnly = validPrices.map((v) => v.price);
  const minPrice = Math.min(...pricesOnly);
  const maxPrice = Math.max(...pricesOnly);

  // Asignar colorimetría inteligente
  validPrices.forEach((v) => {
    const ev = providerEvaluations[v.providerId];
    if (v.price === minPrice) {
      ev.isMin = true;
      ev.colorTag = 'green';
      ev.colorClass = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 font-semibold';
      ev.statusLabel = 'Mejor Precio';
    } else if (v.price === maxPrice && maxPrice > minPrice) {
      ev.isMax = true;
      ev.colorTag = 'red';
      ev.colorClass = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      ev.statusLabel = 'Más Alto';
    } else {
      ev.isIntermediate = true;
      ev.colorTag = 'yellow';
      ev.colorClass = 'text-amber-300 bg-amber-500/10 border-amber-500/25';
      ev.statusLabel = 'Intermedio';
    }
  });

  const winner = validPrices.find((v) => v.price === minPrice);

  // Métricas del Proveedor Preferido
  let preferredMetrics;
  const prefEv = providerEvaluations[preferredProviderId];

  if (prefEv && prefEv.adjustedPrice !== null) {
    const prefPrice = prefEv.adjustedPrice;
    
    // Desviación vs Precio Mínimo del Mercado
    const deltaMin = minPrice > 0 ? ((prefPrice - minPrice) / minPrice) * 100 : 0;

    // Desviación vs Media de la Competencia (otros proveedores con stock)
    const competitorPrices = validPrices.filter((v) => v.providerId !== preferredProviderId);
    let deltaCompetencia = 0;
    let avgCompetencia = null;

    if (competitorPrices.length > 0) {
      avgCompetencia = competitorPrices.reduce((acc, c) => acc + c.price, 0) / competitorPrices.length;
      deltaCompetencia = avgCompetencia > 0 ? ((prefPrice - avgCompetencia) / avgCompetencia) * 100 : 0;
    }

    preferredMetrics = {
      isAvailable: true,
      price: prefPrice,
      isWinner: prefPrice === minPrice,
      deltaMin: Math.round(deltaMin * 10) / 10,
      deltaCompetencia: Math.round(deltaCompetencia * 10) / 10,
      competitorAverage: avgCompetencia ? Math.round(avgCompetencia * 100) / 100 : null,
      competitorCount: competitorPrices.length,
    };
  } else {
    preferredMetrics = {
      isAvailable: false,
      price: null,
      isWinner: false,
      deltaMin: null,
      deltaCompetencia: null,
      competitorAverage: null,
      competitorCount: 0,
    };
  }

  return {
    ...product,
    evaluations: providerEvaluations,
    minPrice,
    maxPrice,
    winnerProviderId: winner ? winner.providerId : null,
    preferredMetrics,
  };
}

/**
 * Calcula el análisis analítico global por proveedor (4 proveedores).
 */
export function calculateProviderBenchmarks(products, adjustments = {}, preferredProviderId = 'prov_1') {
  const evaluatedProducts = products.map((p) => evaluateProductRow(p, adjustments, preferredProviderId));
  const totalProducts = evaluatedProducts.length;

  const providerStats = {};
  DEFAULT_PROVIDERS.forEach((prov) => {
    providerStats[prov.id] = {
      id: prov.id,
      name: prov.name,
      shortName: prov.shortName,
      color: prov.color,
      badgeColor: prov.badgeColor,
      adjustmentPercent: adjustments[prov.id] ?? 0,
      totalCatalog: totalProducts,
      quotedCount: 0,
      missingCount: 0,
      winCount: 0,
      winRate: 0,
      basketTotal: 0,
      comparableBasketTotal: 0,
      imsQuotedCount: 0,
      imsWinCount: 0,
      imsBasketTotal: 0,
      imsWinRate: 0,
      icc: 1.0,
    };
  });

  // Identificar SKUs comunes (comparables) cotizados por todos con stock
  const allAvailableSkus = evaluatedProducts.filter((p) => {
    return DEFAULT_PROVIDERS.every((prov) => p.evaluations[prov.id]?.adjustedPrice !== null);
  });

  let optimalBasketTotal = 0;
  let preferredBasketTotal = 0;

  evaluatedProducts.forEach((p) => {
    if (p.minPrice !== null) {
      optimalBasketTotal += p.minPrice;
    }

    const prefAdj = p.evaluations[preferredProviderId]?.adjustedPrice;
    if (prefAdj !== null) {
      preferredBasketTotal += prefAdj;
    }

    DEFAULT_PROVIDERS.forEach((prov) => {
      const ev = p.evaluations[prov.id];
      const stats = providerStats[prov.id];

      if (ev && ev.adjustedPrice !== null) {
        stats.quotedCount += 1;
        stats.basketTotal += ev.adjustedPrice;

        if (ev.isMin) {
          stats.winCount += 1;
        }

        if (p.is_ims) {
          stats.imsQuotedCount += 1;
          stats.imsBasketTotal += ev.adjustedPrice;
          if (ev.isMin) {
            stats.imsWinCount += 1;
          }
        }
      }
    });
  });

  // Calcular canasta comparable homogénea
  allAvailableSkus.forEach((p) => {
    DEFAULT_PROVIDERS.forEach((prov) => {
      const ev = p.evaluations[prov.id];
      if (ev?.adjustedPrice) {
        providerStats[prov.id].comparableBasketTotal += ev.adjustedPrice;
      }
    });
  });

  // Finalizar cálculos de porcentajes y ratios
  Object.values(providerStats).forEach((stats) => {
    stats.missingCount = stats.totalCatalog - stats.quotedCount;
    stats.completenessRate = stats.totalCatalog > 0 ? Math.round((stats.quotedCount / stats.totalCatalog) * 1000) / 10 : 0;
    stats.winRate = stats.quotedCount > 0 ? Math.round((stats.winCount / stats.quotedCount) * 1000) / 10 : 0;
    stats.imsWinRate = stats.imsQuotedCount > 0 ? Math.round((stats.imsWinCount / stats.imsQuotedCount) * 1000) / 10 : 0;

    // Índice de Competitividad Crítica: ICC = WinRate(IMS) / WinRate(Global)
    if (stats.winRate > 0) {
      stats.icc = Math.round((stats.imsWinRate / stats.winRate) * 100) / 100;
    } else {
      stats.icc = stats.imsWinRate > 0 ? 1.5 : 1.0;
    }

    stats.basketTotal = Math.round(stats.basketTotal * 100) / 100;
    stats.comparableBasketTotal = Math.round(stats.comparableBasketTotal * 100) / 100;
    stats.imsBasketTotal = Math.round(stats.imsBasketTotal * 100) / 100;
  });

  // Ranking de competitividad por costo de canasta (menor es mejor)
  const rankedProviders = Object.values(providerStats)
    .filter((s) => s.quotedCount > 0)
    .sort((a, b) => {
      // Usar canasta comparable si hay suficientes, o basketTotal normalizado
      const costA = a.comparableBasketTotal > 0 ? a.comparableBasketTotal : a.basketTotal / (a.quotedCount || 1);
      const costB = b.comparableBasketTotal > 0 ? b.comparableBasketTotal : b.basketTotal / (b.quotedCount || 1);
      return costA - costB;
    });

  rankedProviders.forEach((p, idx) => {
    providerStats[p.id].rank = idx + 1;
  });

  return {
    providers: providerStats,
    rankedList: rankedProviders,
    totalProducts,
    comparableCount: allAvailableSkus.length,
    optimalBasketTotal: Math.round(optimalBasketTotal * 100) / 100,
    preferredBasketTotal: Math.round(preferredBasketTotal * 100) / 100,
    potentialGlobalSavings: preferredBasketTotal > 0 && optimalBasketTotal > 0
      ? Math.round(((preferredBasketTotal - optimalBasketTotal) / preferredBasketTotal) * 1000) / 10
      : 0,
  };
}

/**
 * Módulo de Análisis Segmentado IMS (Top 800 de Alta Rotación)
 */
export function calculateIMSMetrics(products, adjustments = {}, preferredProviderId = 'prov_1') {
  const imsProducts = products.filter((p) => p.is_ims);
  const benchmark = calculateProviderBenchmarks(imsProducts, adjustments, preferredProviderId);

  // Análisis Cruzado Inteligente de Comportamiento Comercial
  const crossAnalysisInsights = [];
  const providers = Object.values(benchmark.providers);

  providers.forEach((prov) => {
    // Diagnóstico 1: Proveedor Agresivo en Alta Rotación (IMS)
    if (prov.icc >= 1.15) {
      crossAnalysisInsights.push({
        providerId: prov.id,
        providerName: prov.name,
        type: 'aggressive',
        badge: 'Agresivo en Volumen',
        color: 'emerald',
        message: `${prov.shortName} tiene un ICC de ${prov.icc}x: Ofrece precios significativamente más agresivos en el Top 800 IMS (Win Rate ${prov.imsWinRate}%) que en el resto del catálogo.`,
      });
    } 
    // Diagnóstico 2: Inflado de márgenes en productos clave
    else if (prov.icc <= 0.85 && prov.quotedCount > 0) {
      crossAnalysisInsights.push({
        providerId: prov.id,
        providerName: prov.name,
        type: 'warning',
        badge: 'Alerta de Margen Alto',
        color: 'rose',
        message: `${prov.shortName} tiene un ICC de ${prov.icc}x: Pierde competitividad en el Top 800 IMS (Win Rate ${prov.imsWinRate}%), indicando márgenes inflados en artículos clave de alta rotación.`,
      });
    }

    // Diagnóstico 3: Comportamiento Cruzado (Globalmente costoso pero competitivo en IMS)
    if (prov.rank >= 3 && prov.imsWinRate >= 35) {
      crossAnalysisInsights.push({
        providerId: prov.id,
        providerName: prov.name,
        type: 'cross',
        badge: 'Oportunidad Táctica IMS',
        color: 'blue',
        message: `${prov.shortName} ocupa la posición #${prov.rank} a nivel general, pero es altamente competitivo en ítems IMS (${prov.imsWinCount} artículos más baratos). Recomendado para compras selectivas de alto volumen.`,
      });
    }
  });

  const avgPriceIMS = imsProducts.length > 0 && benchmark.optimalBasketTotal > 0
    ? Math.round((benchmark.optimalBasketTotal / imsProducts.length) * 100) / 100
    : 0;

  return {
    imsProductsCount: imsProducts.length,
    benchmark,
    avgPriceIMS,
    crossAnalysisInsights,
  };
}

/**
 * Formateo numérico en USD y porcentajes
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value, includeSign = true) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const prefix = includeSign && value > 0 ? '+' : '';
  return `${prefix}${Number(value).toFixed(1)}%`;
}
