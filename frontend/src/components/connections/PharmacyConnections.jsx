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
  Zap
} from 'lucide-react';

const PROVIDERS = [
  { id: 'prov_2', name: 'Drogueria 1', type: 'document' },
  { id: 'prov_3', name: 'Drogueria 2', type: 'document' },
  { id: 'prov_4', name: 'Drogueria 3', type: 'document' },
];

export default function PharmacyConnections({
  connectionsStatus,
  onTestConnection,
  onFileUpload,
  onSyncCatalog,
  authSession
}) {
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState({});
  const [uploadResults, setUploadResults] = useState({});
  const [isUploading, setIsUploading] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRefs = useRef({});

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
    } catch {
      setUploadResults((prev) => ({
        ...prev,
        [provId]: { success: false, message: 'Error al subir archivo' }
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, [provId]: false }));
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

  return (
    <div className="space-y-6">
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
      {PROVIDERS.map((prov) => {
        const status = connectionsStatus?.[prov.id] || {};
        const uploadResult = uploadResults[prov.id];

        return (
          <div key={prov.id} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{prov.name} — Lista de Precios</h4>
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
            <div className="mt-3 flex items-center gap-3">
              <input
                ref={(el) => { fileInputRefs.current[prov.id] = el; }}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFileSelect(prov.id, e.target.files?.[0])}
              />
              <button
                onClick={() => fileInputRefs.current[prov.id]?.click()}
                disabled={isUploading[prov.id]}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition-all"
              >
                {isUploading[prov.id] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isUploading[prov.id] ? 'Subiendo...' : 'Subir Archivo'}
              </button>

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