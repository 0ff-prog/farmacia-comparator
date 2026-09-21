import { useState } from 'react';
import {
  Radio,
  Key,
  Lock,
  User,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Building,
  Eye,
  EyeOff,
  Cloud
} from 'lucide-react';

export default function PharmacyConnections({
  credentials,
  onSaveCredentials,
  onTestConnection,
  onSyncCatalog
}) {
  const [formData, setFormData] = useState({ ...credentials });
  const [showPassword, setShowPassword] = useState({});
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const togglePasswordVisibility = (key) => {
    setShowPassword((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (pharmacyKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [pharmacyKey]: {
        ...prev[pharmacyKey],
        [field]: value
      }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveCredentials(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const runTest = async (pharmacyKey) => {
    setIsTesting((prev) => ({ ...prev, [pharmacyKey]: true }));
    try {
      const result = await onTestConnection(pharmacyKey, formData[pharmacyKey]);
      setTestResults((prev) => ({
        ...prev,
        [pharmacyKey]: result
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [pharmacyKey]: { success: false, message: 'Error en la verificación de conexión' }
      }));
    } finally {
      setIsTesting((prev) => ({ ...prev, [pharmacyKey]: false }));
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await onSyncCatalog();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo de Conexiones */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Centro de Conexión de Farmacias & Credenciales
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                1 API + 3 Portales B2B
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configura tus credenciales reales para extraer u homologar las listas de precios en vivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando Catálogos...' : 'Sincronizar Todo'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          ¡Configuraciones y credenciales guardadas exitosamente!
        </div>
      )}

      {syncSuccess && (
        <div className="p-4 bg-blue-500/15 border border-blue-500/30 rounded-2xl text-blue-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Cloud className="w-4 h-4" />
          ¡Catálogo maestro sincronizado y normalizado con las 4 farmacias!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Farmacia 1: Conexión por API (Droguería Cobeca) */}
        <div className="bg-slate-800/90 rounded-2xl border border-blue-500/40 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Droguería Cobeca
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    CONEXIÓN POR API REST
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Petición HTTP POST JSON con autenticación por Token JWT</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => runTest('prov_1')}
              disabled={isTesting['prov_1']}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting['prov_1'] ? 'animate-spin' : ''}`} />
              Probar Conexión API
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Endpoint URL de la API:
              </label>
              <input
                type="text"
                value={formData.prov_1?.apiUrl || ''}
                onChange={(e) => handleInputChange('prov_1', 'apiUrl', e.target.value)}
                placeholder="https://comparadores.drogueriascobeca.com/api/articulos/drogueria"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                ID Droguería / Sede:
              </label>
              <input
                type="text"
                value={formData.prov_1?.drogueriaId || '7'}
                onChange={(e) => handleInputChange('prov_1', 'drogueriaId', e.target.value)}
                placeholder="7"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Token de Autorización (JWT / Bearer Token):
              </label>
              <textarea
                rows={2}
                value={formData.prov_1?.apiKey || ''}
                onChange={(e) => handleInputChange('prov_1', 'apiKey', e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {testResults['prov_1'] && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResults['prov_1'].success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              {testResults['prov_1'].success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testResults['prov_1'].message}</span>
            </div>
          )}
        </div>

        {/* Las 3 Farmacias por Portal B2B / Usuario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Farmacia 2: Saas */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Farmacia Saas</h3>
                    <span className="text-[10px] text-slate-400">Usuario & Contraseña B2B</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runTest('prov_2')}
                  disabled={isTesting['prov_2']}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  {isTesting['prov_2'] ? '...' : 'Probar'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Usuario / Código:
                  </label>
                  <input
                    type="text"
                    value={formData.prov_2?.username || ''}
                    onChange={(e) => handleInputChange('prov_2', 'username', e.target.value)}
                    placeholder="usuario.saas"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Contraseña:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword['prov_2'] ? 'text' : 'password'}
                      value={formData.prov_2?.password || ''}
                      onChange={(e) => handleInputChange('prov_2', 'password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('prov_2')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword['prov_2'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Sucursal / Centro:
                  </label>
                  <input
                    type="text"
                    value={formData.prov_2?.branch || ''}
                    onChange={(e) => handleInputChange('prov_2', 'branch', e.target.value)}
                    placeholder="Principal Occidente"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {testResults['prov_2'] && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] mt-3 ${
                  testResults['prov_2'].success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}
              >
                {testResults['prov_2'].message}
              </div>
            )}
          </div>

          {/* Farmacia 3: Locatel */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-purple-600/20 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Farmacia Locatel</h3>
                    <span className="text-[10px] text-slate-400">Usuario & Contraseña B2B</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runTest('prov_3')}
                  disabled={isTesting['prov_3']}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  {isTesting['prov_3'] ? '...' : 'Probar'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Usuario / Código:
                  </label>
                  <input
                    type="text"
                    value={formData.prov_3?.username || ''}
                    onChange={(e) => handleInputChange('prov_3', 'username', e.target.value)}
                    placeholder="cliente.locatel"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    Contraseña:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword['prov_3'] ? 'text' : 'password'}
                      value={formData.prov_3?.password || ''}
                      onChange={(e) => handleInputChange('prov_3', 'password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('prov_3')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword['prov_3'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Sucursal / Centro:
                  </label>
                  <input
                    type="text"
                    value={formData.prov_3?.branch || ''}
                    onChange={(e) => handleInputChange('prov_3', 'branch', e.target.value)}
                    placeholder="Sede Central"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {testResults['prov_3'] && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] mt-3 ${
                  testResults['prov_3'].success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}
              >
                {testResults['prov_3'].message}
              </div>
            )}
          </div>

          {/* Farmacia 4: Farmatodo */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-amber-600/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                    4
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Farmacia Farmatodo</h3>
                    <span className="text-[10px] text-slate-400">Usuario & Contraseña B2B</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runTest('prov_4')}
                  disabled={isTesting['prov_4']}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  {isTesting['prov_4'] ? '...' : 'Probar'}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    Usuario / Código:
                  </label>
                  <input
                    type="text"
                    value={formData.prov_4?.username || ''}
                    onChange={(e) => handleInputChange('prov_4', 'username', e.target.value)}
                    placeholder="cuenta.farmatodo"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Contraseña:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword['prov_4'] ? 'text' : 'password'}
                      value={formData.prov_4?.password || ''}
                      onChange={(e) => handleInputChange('prov_4', 'password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('prov_4')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword['prov_4'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Sucursal / Centro:
                  </label>
                  <input
                    type="text"
                    value={formData.prov_4?.branch || ''}
                    onChange={(e) => handleInputChange('prov_4', 'branch', e.target.value)}
                    placeholder="Distribuidora Nacional"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {testResults['prov_4'] && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] mt-3 ${
                  testResults['prov_4'].success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}
              >
                {testResults['prov_4'].message}
              </div>
            )}
          </div>
        </div>

        {/* Botón de Guardado */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Todas las Credenciales</span>
          </button>
        </div>
      </form>
    </div>
  );
}
