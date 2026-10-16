import { useState } from 'react';
import { Lock, User, AlertCircle, Loader2, Building2, ShieldCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function LoginView({ onLoginSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !clave.trim()) {
      setError('Introduce tu usuario y clave de Cobeca.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), clave }),
      });
      const data = await resp.json();

      if (!resp.ok || !data.access_token) {
        setError(data.detail || data.message || 'Credenciales incorrectas.');
        setIsLoading(false);
        return;
      }

      // Guardar en sessionStorage (se borra al cerrar pestaña)
      sessionStorage.setItem('app_token', data.access_token);
      sessionStorage.setItem('user_name', data.user_name);
      sessionStorage.setItem('user_code', data.user_code);
      sessionStorage.setItem('drogueria_id', data.drogueria_id);
      sessionStorage.setItem('drogueria_name', data.drogueria_name);

      onLoginSuccess({
        token: data.access_token,
        userName: data.user_name,
        userCode: data.user_code,
        drogueriaId: data.drogueria_id,
        drogueriaName: data.drogueria_name,
      });
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('No se puede conectar al servidor. Verifica que el backend este corriendo en ' + API_BASE);
      } else {
        setError('Error de conexion: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo y Titulo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Comparador de Farmacias
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Plataforma B2B de Analisis de Precios
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-5 shadow-2xl"
        >
          <div className="text-center pb-2 border-b border-slate-700/50">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Inicia sesion con tu cuenta de <strong className="text-white">Cobeca</strong></span>
            </div>
          </div>

          {/* Usuario */}
          <div>
            <label htmlFor="usuario" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ej: F29990"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Clave */}
          <div>
            <label htmlFor="clave" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Clave
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="clave"
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Tu clave de acceso"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Boton */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando con Cobeca...
              </>
            ) : (
              'Iniciar Sesion'
            )}
          </button>

          <p className="text-xs text-center text-slate-500">
            Las credenciales se validan directamente con el servidor de Cobeca.
            <br />Tu clave nunca se almacena en el navegador.
          </p>
        </form>
      </div>
    </div>
  );
}