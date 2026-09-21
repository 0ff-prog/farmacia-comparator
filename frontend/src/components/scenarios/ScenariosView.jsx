import { useState } from 'react';
import {
  Bookmark,
  Plus,
  Trash2,
  Check,
  Download,
  Upload,
  Clock,
  Layers
} from 'lucide-react';
import { DEFAULT_PROVIDERS } from '../../utils/analyticsMath';

export default function ScenariosView({
  currentAdjustments,
  currentPreferredProviderId,
  savedScenarios,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario,
  onExportScenarios,
  onImportScenarios
}) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveScenario({
      id: `scen_${Date.now()}`,
      name: name.trim(),
      notes: notes.trim(),
      adjustments: { ...currentAdjustments },
      preferredProviderId: currentPreferredProviderId,
      createdAt: new Date().toISOString()
    });

    setName('');
    setNotes('');
    setSuccessMsg('¡Escenario de negociación guardado exitosamente!');
    setTimeout(() => setSuccessMsg(''), 3000);
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
          setSuccessMsg('¡Escenarios importados con éxito!');
          setTimeout(() => setSuccessMsg(''), 3000);
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
    <div className="space-y-6">
      {/* Cabecera de la Sección */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Gestor de Escenarios & Simulaciones de Negociación
            </h2>
            <p className="text-xs text-slate-400">
              Guarda diferentes configuraciones de descuentos comerciales aplicados a las 4 farmacias para comparar opciones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportScenarios}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Exportar JSON</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importar JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Formulario de Guardar Configuración Actual */}
      <form onSubmit={handleSave} className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            Guardar Configuración Actual como Escenario
          </h3>
          <span className="text-xs text-slate-400">
            Valores en memoria listos para archivar
          </span>
        </div>

        {/* Resumen de ajustes actuales */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Ajustes activos:</span>
          {DEFAULT_PROVIDERS.map((prov) => {
            const adj = currentAdjustments[prov.id] ?? 0;
            return (
              <span
                key={prov.id}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
              >
                {prov.shortName}:{' '}
                <strong
                  className={
                    adj < 0 ? 'text-emerald-400' : adj > 0 ? 'text-rose-400' : 'text-slate-400'
                  }
                >
                  {adj > 0 ? `+${adj}%` : `${adj}%`}
                </strong>
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Nombre del Escenario:</label>
            <input
              type="text"
              required
              placeholder="Ej: Descuento 10% Cobeca por Contrato Anual"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Notas Comerciales / Condiciones:</label>
            <input
              type="text"
              placeholder="Ej: Compromiso de pago a 7 días y flete bonificado"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Guardar Escenario</span>
          </button>
        </div>
      </form>

      {/* Lista de Escenarios Guardados */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Escenarios Guardados ({savedScenarios.length})
        </h3>

        {savedScenarios.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/40">
            No tienes escenarios guardados aún. Guarda tu primera simulación arriba.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedScenarios.map((scen) => {
              const pref = DEFAULT_PROVIDERS.find((p) => p.id === scen.preferredProviderId)?.shortName || 'Cobeca';

              return (
                <div
                  key={scen.id}
                  className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{scen.name}</h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(scen.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Preferido: {pref}
                      </span>
                    </div>

                    {scen.notes && (
                      <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        "{scen.notes}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      {DEFAULT_PROVIDERS.map((prov) => {
                        const adj = scen.adjustments?.[prov.id] ?? 0;
                        return (
                          <div
                            key={prov.id}
                            className="p-1.5 bg-slate-900/90 rounded-lg border border-slate-800 text-center"
                          >
                            <span className="text-[10px] text-slate-400 block">{prov.shortName}</span>
                            <span
                              className={`text-xs font-mono font-bold ${
                                adj < 0 ? 'text-emerald-400' : adj > 0 ? 'text-rose-400' : 'text-slate-300'
                              }`}
                            >
                              {adj > 0 ? `+${adj}%` : `${adj}%`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      onClick={() => onLoadScenario(scen)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aplicar en la Matriz
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
  );
}
