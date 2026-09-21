import { useState } from 'react';
import { Bookmark, X, Plus, Trash2, Check, Download, Upload, Clock } from 'lucide-react';
import { DEFAULT_PROVIDERS } from '../../utils/analyticsMath';

export default function ScenarioManagerModal({
  isOpen,
  onClose,
  currentAdjustments,
  currentPreferredProviderId,
  savedScenarios,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario,
  onExportScenarios,
  onImportScenarios
}) {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioNotes, setScenarioNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    onSaveScenario({
      id: `scen_${Date.now()}`,
      name: scenarioName.trim(),
      notes: scenarioNotes.trim(),
      adjustments: { ...currentAdjustments },
      preferredProviderId: currentPreferredProviderId,
      createdAt: new Date().toISOString()
    });

    setScenarioName('');
    setScenarioNotes('');
    setSuccessMessage('¡Escenario guardado exitosamente!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          onImportScenarios(parsed);
          setSuccessMessage('¡Escenarios importados con éxito!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          alert('El archivo no contiene un formato de escenarios válido.');
        }
      } catch {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gestor de Escenarios de Negociación</h2>
              <p className="text-xs text-slate-400">Guarda, compara y restaura simulaciones para respaldar decisiones comerciales</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Mensaje de Confirmación */}
          {successMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-2 font-medium animate-pulse">
              <Check className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {/* Formulario de Guardado */}
          <form onSubmit={handleSave} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/80 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Guardar Simulación Actual
            </h3>

            {/* Resumen de ajustes actuales */}
            <div className="flex flex-wrap gap-2 py-1">
              {DEFAULT_PROVIDERS.map((prov) => {
                const adj = currentAdjustments[prov.id] ?? 0;
                return (
                  <span
                    key={prov.id}
                    className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]"
                  >
                    {prov.shortName}: <strong className={adj < 0 ? 'text-emerald-400' : adj > 0 ? 'text-rose-400' : 'text-slate-400'}>
                      {adj > 0 ? `+${adj}%` : `${adj}%`}
                    </strong>
                  </span>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre del Escenario:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Descuento 8% Cobeca por Volumen Q4"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Notas Comerciales (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ej: Compromiso de compra mínima 500 uds"
                  value={scenarioNotes}
                  onChange={(e) => setScenarioNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm ml-auto"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Guardar Configuración
            </button>
          </form>

          {/* Lista de Escenarios Guardados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Escenarios Disponibles ({savedScenarios.length})</h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={onExportScenarios}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="Descargar escenarios como JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar JSON
                </button>

                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Importar JSON
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {savedScenarios.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
                No hay escenarios guardados aún. Guarda tu primera simulación arriba.
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedScenarios.map((scen) => {
                  const pref = DEFAULT_PROVIDERS.find((p) => p.id === scen.preferredProviderId)?.shortName || 'Cobeca';

                  return (
                    <div
                      key={scen.id}
                      className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{scen.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scen.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {scen.notes && (
                          <p className="text-slate-400 text-xs italic">{scen.notes}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {DEFAULT_PROVIDERS.map((prov) => {
                            const adj = scen.adjustments?.[prov.id] ?? 0;
                            return (
                              <span
                                key={prov.id}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-800"
                              >
                                {prov.shortName}: <strong className={adj < 0 ? 'text-emerald-400' : adj > 0 ? 'text-rose-400' : 'text-slate-400'}>
                                  {adj > 0 ? `+${adj}%` : `${adj}%`}
                                </strong>
                              </span>
                            );
                          })}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50">
                            Preferido: {pref}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => onLoadScenario(scen)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aplicar
                        </button>

                        <button
                          onClick={() => onDeleteScenario(scen.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar este escenario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-800/90 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
