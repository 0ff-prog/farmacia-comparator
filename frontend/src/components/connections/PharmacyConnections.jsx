import { useState, useRef } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  Zap,
  Trash2,
  Pencil,
  X,
  Check
} from 'lucide-react';

const BASE_PROVIDERS = [
  { id: 'prov_2', defaultName: 'Droguería 1', type: 'document' },
  { id: 'prov_3', defaultName: 'Droguería 2', type: 'document' },
  { id: 'prov_4', defaultName: 'Droguería 3', type: 'document' },
];

export default function PharmacyConnections({
  connectionsStatus,
  onTestConnection,
  onFileUpload,
  onFileRemove,
  onSyncCatalog,
  authSession,
  providerLabels = {},
  onProviderRename
}) {
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState({});
  const [uploadResults, setUploadResults] = useState({});
  const [isUploading, setIsUploading] = useState({});
  const [isRemoving, setIsRemoving] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRefs = useRef({});

  // ── Modal de nombre tras subida de archivo ────────────────────────────────
  // null | { provId, currentName }
  const [namePrompt, setNamePrompt] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const runTest = async (provId) => {
    setIsTesting((prev) => ({ ...prev, [provId]: true }));
    try {
      const result = await onTestConnection(provId);
      setTestResults((prev) => ({ ...prev, [provId]: result }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [provId]: { success: false, message: 'Error en la verificacion' }
      }));
    } finally {
      setIsTesting((prev) => ({ ...prev, [provId]: false }));
    }
  };

  const handleFileSelect = async (provId, file) => {
    if (!file) return;
    setIsUploading((prev) => ({ ...prev, [provId]: true }));
    try {
      const result = await onFileUpload(provId, file);
      setUploadResults((prev) => ({ ...prev, [provId]: result }));
      if (result?.success) {
        // Abrir modal para pedir nombre de la droguería
        const currentName = providerLabels[provId]?.name || BASE_PROVIDERS.find((p) => p.id === provId)?.defaultName || '';
        setNameInput(currentName);
        setNamePrompt({ provId, currentName });
      }
    } catch {
      setUploadResults((prev) => ({
        ...prev,
        [provId]: { success: false, message: 'Error al subir archivo' }
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, [provId]: false }));
    }
  };

  const handleNameSubmit = async () => {
    if (!namePrompt || !nameInput.trim()) return;
    setIsSavingName(true);
    try {
      if (onProviderRename) {
        await onProviderRename(namePrompt.provId, nameInput.trim());
      }
    } finally {
      setIsSavingName(false);
      setNamePrompt(null);
      setNameInput('');
    }
  };

  const handleNameSkip = () => {
    setNamePrompt(null);
    setNameInput('');
  };

  const handleRemove = async (provId) => {
    if (!onFileRemove) return;
    setIsRemoving((prev) => ({ ...prev, [provId]: true }));
    try {
      const result = await onFileRemove(provId);
      if (result && result.success) {
        setUploadResults((prev) => {
          const next = { ...prev };
          delete next[provId];
          return next;
        });
        if (fileInputRefs.current[provId]) {
          fileInputRefs.current[provId].value = '';
        }
      }
    } catch {
      // Error handled in parent
    } finally {
      setIsRemoving((prev) => ({ ...prev, [provId]: false }));
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSyncCatalog();
    } finally {
      setIsSyncing(false);
    }
  };

  const statusIcon = (status) => {
    if (status === 'connected') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-400" />;
    return <Radio className="w-4 h-4 text-slate-500" />;
  };

  const statusDot = (status) => {
    if (status === 'connected') return 'bg-emerald-400';
    if (status === 'error') return 'bg-red-400';
    return 'bg-slate-500';
  };

  /** Devuelve el nombre personalizado de un proveedor o el nombre por defecto. */
  const provName = (provId) =>
    providerLabels[provId]?.name ||
    BASE_PROVIDERS.find((p) => p.id === provId)?.defaultName ||
    provId;

  return (
    <div className="space-y-6">
      {/* ── Modal de nombre de droguería ─────────────────────────────────── */}
      {namePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-400" />
                Nombre de la Droguería
              </h3>
              <button
                onClick={handleNameSkip}
                className="text-slate-400 hover:text-white transition-colors"
                title="Omitir"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa un nombre personalizado para identificar esta droguería en toda la plataforma.
            </p>
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') handleNameSkip();
              }}
              placeholder="Ej: Farmaunión, Farmatodo, etc."
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleNameSkip}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
              >
                Omitir
              </button>
              <button
                onClick={handleNameSubmit}
                disabled={!nameInput.trim() || isSavingName}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all"
              >
                {isSavingName ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Fuentes de Datos</h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Cobeca via API (sesion activa) + 3 Droguerias via archivos Excel/CSV
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white transition-all shadow-lg shadow-blue-600/20"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar Estado
        </button>
      </div>

      {/* Cobeca Card (API Session) */}
      <div className="bg-slate-800/60 rounded-2xl border border-blue-500/20 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cobeca — API REST</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Sesion activa como <strong className="text-blue-300">{authSession?.userName}</strong>
                {' '}({authSession?.drogueriaName} #{authSession?.drogueriaId})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDot(connectionsStatus?.prov_1?.status)}`} />
            {statusIcon(connectionsStatus?.prov_1?.status)}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {connectionsStatus?.prov_1?.label || 'Estado desconocido'}
          </p>
          <button
            onClick={() => runTest('prov_1')}
            disabled={isTesting.prov_1}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-all"
          >
            {isTesting.prov_1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Probar API
          </button>
        </div>

        {testResults.prov_1 && (
          <div className={`mt-3 p-3 rounded-xl text-xs ${testResults.prov_1.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
            {testResults.prov_1.message}
          </div>
        )}
      </div>

      {/* Document Upload Cards */}
      {BASE_PROVIDERS.map((prov) => {
        const status = connectionsStatus?.[prov.id] || {};
        const uploadResult = uploadResults[prov.id];
        const displayName = provName(prov.id);

        return (
          <div key={prov.id} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{displayName} — Lista de Precios</h4>
                    {/* Botón inline para renombrar */}
                    {onProviderRename && (
                      <button
                        onClick={() => {
                          setNameInput(displayName);
                          setNamePrompt({ provId: prov.id, currentName: displayName });
                        }}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        title="Renombrar droguería"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sube un archivo Excel (.xlsx) o CSV con la lista de precios
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusDot(status.status)}`} />
                {statusIcon(status.status)}
              </div>
            </div>

            {/* Status label */}
            <p className="mt-3 text-xs text-slate-400">
              {status.label || 'Sin archivo cargado'}
            </p>

            {/* Upload zone */}
            <div className="mt-3 flex items-center flex-wrap gap-3">
              <input
                ref={(el) => { fileInputRefs.current[prov.id] = el; }}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFileSelect(prov.id, e.target.files?.[0])}
              />
              <button
                onClick={() => fileInputRefs.current[prov.id]?.click()}
                disabled={isUploading[prov.id] || isRemoving[prov.id]}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition-all disabled:opacity-50"
              >
                {isUploading[prov.id] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isUploading[prov.id]
                  ? 'Subiendo...'
                  : (status.status === 'connected' ? 'Reemplazar Archivo' : 'Subir Archivo')}
              </button>

              {status.status === 'connected' && (
                <button
                  onClick={() => handleRemove(prov.id)}
                  disabled={isRemoving[prov.id] || isUploading[prov.id]}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all disabled:opacity-50"
                  title="Eliminar archivo y desvincular precios"
                >
                  {isRemoving[prov.id] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  )}
                  {isRemoving[prov.id] ? 'Eliminando...' : 'Quitar Archivo'}
                </button>
              )}

              <span className="text-xs text-slate-500">.xlsx, .xls, .csv</span>
            </div>

            {/* Upload result / preview */}
            {uploadResult && (
              <div className={`mt-3 p-3 rounded-xl text-xs ${uploadResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                {uploadResult.success ? (
                  <div>
                    <p className="font-semibold mb-1">
                      {uploadResult.rows_detected} productos detectados en {uploadResult.filename}
                    </p>
                    {uploadResult.preview && uploadResult.preview.length > 0 && (
                      <div className="mt-2 overflow-x-auto">
                        <table className="text-[10px] w-full">
                          <thead>
                            <tr className="border-b border-emerald-500/20">
                              <th className="py-1 px-1.5 text-left">SKU</th>
                              <th className="py-1 px-1.5 text-left">Nombre</th>
                              <th className="py-1 px-1.5 text-right">Precio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResult.preview.map((item, idx) => (
                              <tr key={idx} className="border-b border-emerald-500/10">
                                <td className="py-0.5 px-1.5 font-mono">{item.sku}</td>
                                <td className="py-0.5 px-1.5">{item.name}</td>
                                <td className="py-0.5 px-1.5 text-right">${item.price?.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{uploadResult.message || 'Error al procesar el archivo'}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}