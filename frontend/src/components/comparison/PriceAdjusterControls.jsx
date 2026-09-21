import { Sliders, RotateCcw, Award, TrendingDown, TrendingUp } from 'lucide-react';
import { DEFAULT_PROVIDERS } from '../../utils/analyticsMath';

export default function PriceAdjusterControls({
  adjustments,
  onAdjustmentChange,
  preferredProviderId,
  onPreferredChange,
  onResetAdjustments
}) {
  const quickPresets = [-15, -10, -5, 0, 5, 10];

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl backdrop-blur-sm space-y-4">
      {/* Encabezado del Panel de Ajustes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Ajustes Globales Dinámicos de Negociación</h2>
            <p className="text-xs text-slate-400">Simulación en tiempo real de descuentos comerciales y recargos logísticos por proveedor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onResetAdjustments}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 transition-all hover:text-white"
            title="Restablecer todos los porcentajes a 0%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer (0%)
          </button>
        </div>
      </div>

      {/* Grid de los 4 Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEFAULT_PROVIDERS.map((prov) => {
          const currentAdj = adjustments[prov.id] ?? 0;
          const isPreferred = preferredProviderId === prov.id;

          // Color border dinámico si es preferido o tiene ajuste
          const isNegative = currentAdj < 0;
          const isPositive = currentAdj > 0;

          return (
            <div
              key={prov.id}
              className={`relative rounded-xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                isPreferred
                  ? 'bg-slate-800/95 border-blue-500 ring-1 ring-blue-500/50 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Badge Superior: Nombre y Botón de Preferido */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-white truncate">{prov.shortName}</span>
                    {isPreferred && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        <Award className="w-3 h-3 text-blue-400" />
                        PREFERIDO
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate">{prov.name}</span>
                </div>

                <button
                  onClick={() => onPreferredChange(prov.id)}
                  title={isPreferred ? 'Proveedor preferido actual' : `Fijar ${prov.shortName} como preferido`}
                  className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                    isPreferred
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {isPreferred ? 'Activo' : 'Elegir'}
                </button>
              </div>

              {/* Porcentaje y Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ajuste de Negociación:</span>
                  <div className="flex items-center gap-1">
                    {isNegative && <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                    {isPositive && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="-50"
                        max="50"
                        value={currentAdj}
                        onChange={(e) => onAdjustmentChange(prov.id, parseFloat(e.target.value) || 0)}
                        className={`w-16 text-right text-xs font-bold px-1.5 py-1 rounded bg-slate-800 border focus:outline-none transition-colors ${
                          isNegative
                            ? 'text-emerald-400 border-emerald-500/40 focus:border-emerald-400'
                            : isPositive
                            ? 'text-rose-400 border-rose-500/40 focus:border-rose-400'
                            : 'text-slate-200 border-slate-600 focus:border-blue-400'
                        }`}
                      />
                      <span className="text-xs text-slate-400 ml-1">%</span>
                    </div>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="-40"
                  max="40"
                  step="0.5"
                  value={currentAdj}
                  onChange={(e) => onAdjustmentChange(prov.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />

                {/* Presets Rápidos */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {quickPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => onAdjustmentChange(prov.id, preset)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                        currentAdj === preset
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      {preset > 0 ? `+${preset}%` : `${preset}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
