import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Download,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  LogOut,
  Loader2
} from 'lucide-react';

import { INITIAL_CATALOG } from './data/mockPharmacyData';
import {
  evaluateProductRow,
  calculateProviderBenchmarks,
  calculateIMSMetrics,
  getProviders,
  updateDefaultProviders
} from './utils/analyticsMath';
import { exportComparisonToCSV, exportExecutiveSummary } from './utils/exportUtils';
import {
  saveScenarioToFirestore,
  fetchScenariosFromFirestore,
  deleteScenarioFromFirestore
} from './services/firebaseService';

import LoginView from './components/auth/LoginView';
import Sidebar from './components/layout/Sidebar';
import ExecutiveDashboard from './components/dashboard/ExecutiveDashboard';
import PriceAdjusterControls from './components/comparison/PriceAdjusterControls';
import FilterToolbar from './components/comparison/FilterToolbar';
import ComparisonTable from './components/comparison/ComparisonTable';
import ProviderBenchmark from './components/analytics/ProviderBenchmark';
import IMSCriticalAnalysis from './components/analytics/IMSCriticalAnalysis';
import ScenariosView from './components/scenarios/ScenariosView';
import PharmacyConnections from './components/connections/PharmacyConnections';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const INITIAL_PRESET_SCENARIOS = [
  {
    id: 'scen_base',
    name: 'Condición Base (Precios de Lista)',
    notes: 'Precios de lista sin ningún descuento ni recargo logístico aplicado.',
    adjustments: { prov_1: 0, prov_2: 0, prov_3: 0, prov_4: 0 },
    preferredProviderId: 'prov_1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'scen_cobeca_agg',
    name: 'Cobeca Preferente (-8% Descuento)',
    notes: 'Negociación agresiva con Droguería Cobeca por compromiso de pronto pago.',
    adjustments: { prov_1: -8, prov_2: 0, prov_3: 0, prov_4: 0 },
    preferredProviderId: 'prov_1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'scen_parity_test',
    name: 'Simulación Competitiva Saas vs Cobeca',
    notes: 'Descuento del 5% en Cobeca contrastado con rebaja de Saas en alta rotación.',
    adjustments: { prov_1: -5, prov_2: -3, prov_3: 2, prov_4: 0 },
    preferredProviderId: 'prov_1',
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  // ── Autenticación ─────────────────────────────────────────────────────────
  const [authSession, setAuthSession] = useState(() => {
    const token = sessionStorage.getItem('app_token');
    if (!token) return null;
    return {
      token,
      userName: sessionStorage.getItem('user_name') || '',
      userCode: sessionStorage.getItem('user_code') || '',
      drogueriaId: sessionStorage.getItem('drogueria_id') || '7',
      drogueriaName: sessionStorage.getItem('drogueria_name') || 'Cobeca',
    };
  });

  const handleLoginSuccess = (session) => {
    setAuthSession(session);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('app_token');
    sessionStorage.removeItem('user_name');
    sessionStorage.removeItem('user_code');
    sessionStorage.removeItem('drogueria_id');
    sessionStorage.removeItem('drogueria_name');
    setAuthSession(null);
  };

  // Si no hay sesión activa, mostrar login
  if (!authSession) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return <MainApp authSession={authSession} onLogout={handleLogout} />;
}

function MainApp({ authSession, onLogout }) {
  // Navegación Activa (persistida en localStorage para no perder la vista al recargar)
  const [activeSection, setActiveSection] = useState(() => {
    try {
      return localStorage.getItem('pharma_active_section') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pharma_active_section', activeSection);
    } catch {
      // ignore
    }
  }, [activeSection]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Catálogo de Productos (Inicia con datos base y carga los 6,800+ de Cobeca en vivo)
  const [products, setProducts] = useState(INITIAL_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const loadCatalog = useCallback(async () => {
    if (!authSession?.token) return;
    setIsCatalogLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/catalog?full=true`, {
        headers: { Authorization: `Bearer ${authSession.token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.items && data.items.length > 0) {
          setProducts(data.items);
        }
        if (data.provider_names) {
          setProviderLabels(data.provider_names);
          updateDefaultProviders(data.provider_names);
        }
      }
    } catch (e) {
      console.warn('Usando catálogo inicial:', e);
    } finally {
      setIsCatalogLoading(false);
    }
  }, [authSession.token]);

  useEffect(() => {
    let isCurrent = true;
    if (!authSession.token) return;

    fetch(`${API_BASE}/api/catalog?full=true`, {
      headers: { Authorization: `Bearer ${authSession.token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isCurrent && data?.items?.length) {
          setProducts(data.items);
        }
        if (isCurrent && data?.provider_names) {
          setProviderLabels(data.provider_names);
          updateDefaultProviders(data.provider_names);
        }
      })
      .catch((err) => console.warn('Catálogo base cargado:', err));

    return () => {
      isCurrent = false;
    };
  }, [authSession.token]);

  // Ajustes de Descuento (% por farmacia)
  const [adjustments, setAdjustments] = useState({
    prov_1: 0,
    prov_2: 0,
    prov_3: 0,
    prov_4: 0
  });

  // Proveedor Preferido
  const [preferredProviderId, setPreferredProviderId] = useState('prov_1');

  // Filtros de Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [imsOnly, setImsOnly] = useState(false);
  const [onlyComparable, setOnlyComparable] = useState(false);
  const [onlyFullBasket, setOnlyFullBasket] = useState(false);
  const [deviationFilter, setDeviationFilter] = useState('all');

  // Estado de las Conexiones
  const [connectionsStatus, setConnectionsStatus] = useState({
    prov_1: { status: 'connected', label: 'Sesión Cobeca Activa' },
    prov_2: { status: 'unconfigured', label: 'Droguería 1 — sin archivo' },
    prov_3: { status: 'unconfigured', label: 'Droguería 2 — sin archivo' },
    prov_4: { status: 'unconfigured', label: 'Droguería 3 — sin archivo' }
  });

  // Nombres Personalizados de Droguerías
  const [providerLabels, setProviderLabels] = useState({});

  // Función unificada para consultar el estado real de conexiones y nombres desde el backend
  const refreshConnectionsStatus = useCallback(async () => {
    if (!authSession?.token) return;
    try {
      const resp = await fetch(`${API_BASE}/api/connections/status`, {
        headers: { Authorization: `Bearer ${authSession.token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.providers) {
          const newStatus = {};
          data.providers.forEach((p) => {
            newStatus[p.provider_id] = { status: p.status, label: p.label };
          });
          setConnectionsStatus(newStatus);
        }
        if (data.provider_names) {
          setProviderLabels(data.provider_names);
          updateDefaultProviders(data.provider_names);
        }
      }
    } catch (e) {
      console.warn('Aviso cargando estado de conexiones:', e);
    }
  }, [authSession?.token]);

  // Carga inicial automática de estado de conexiones y nombres en cada recarga
  useEffect(() => {
    if (authSession?.token) {
      refreshConnectionsStatus();
    }
  }, [authSession?.token, refreshConnectionsStatus]);

  /**
   * Renombra una droguería: persiste en el backend y actualiza el estado local.
   * @param {string} provId  - 'prov_2' | 'prov_3' | 'prov_4'
   * @param {string} name    - Nombre nuevo ingresado por el usuario
   */
  const handleProviderRename = useCallback(async (provId, name) => {
    try {
      const resp = await fetch(`${API_BASE}/api/provider-names/${provId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      if (resp.ok) {
        const data = await resp.json();
        const updated = {
          [provId]: { name: data.name, short_name: data.short_name }
        };
        setProviderLabels((prev) => ({
          ...prev,
          ...updated
        }));
        updateDefaultProviders(updated);
        // Recargar catálogo consolidado para reflejar nombres en benchmark
        loadCatalog();
      }
    } catch (e) {
      console.warn('Error al renombrar droguería:', e);
    }
  }, [loadCatalog]);

  // Lista de proveedores activa con nombres personalizados aplicados
  const activeProviders = getProviders(providerLabels);

  // Escenarios Guardados
  const [savedScenarios, setSavedScenarios] = useState(() => {
    try {
      const stored = localStorage.getItem('pharma_scenarios_v1');
      return stored ? JSON.parse(stored) : INITIAL_PRESET_SCENARIOS;
    } catch {
      return INITIAL_PRESET_SCENARIOS;
    }
  });

  // Sincronización Inicial con Firestore (si está disponible)
  useEffect(() => {
    async function loadCloudScenarios() {
      const cloudData = await fetchScenariosFromFirestore();
      if (cloudData && cloudData.length > 0) {
        setSavedScenarios(cloudData);
      }
    }
    loadCloudScenarios();
  }, []);

  // Persistencia de Escenarios
  useEffect(() => {
    try {
      localStorage.setItem('pharma_scenarios_v1', JSON.stringify(savedScenarios));
    } catch (e) {
      console.error('Error al guardar escenarios:', e);
    }
  }, [savedScenarios]);

  // Manejo de Ajustes
  const handleAdjustmentChange = (providerId, value) => {
    setAdjustments((prev) => ({
      ...prev,
      [providerId]: value
    }));
  };

  const handleResetAdjustments = () => {
    setAdjustments({
      prov_1: 0,
      prov_2: 0,
      prov_3: 0,
      prov_4: 0
    });
  };

  // Categorías Únicas
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  // Número de droguerías activas (con al menos 1 precio cotizado en el catálogo)
  const activeProviderCount = useMemo(() => {
    const providerIds = ['prov_1', 'prov_2', 'prov_3', 'prov_4'];
    const active = providerIds.filter((pid) =>
      products.some((p) => p.suppliers?.[pid]?.base_price > 0)
    );
    return Math.max(active.length, 1);
  }, [products]);

  // Evaluación en Tiempo Real
  const evaluatedProducts = useMemo(() => {
    updateDefaultProviders(providerLabels);
    return products.map((p) => evaluateProductRow(p, adjustments, preferredProviderId, activeProviderCount));
  }, [products, adjustments, preferredProviderId, providerLabels, activeProviderCount]);

  // Filtrado de la Matriz
  const filteredProducts = useMemo(() => {
    return evaluatedProducts.filter((item) => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = item.display_name.toLowerCase().includes(query);
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchActive = item.active_ingredient?.toLowerCase().includes(query);
        const matchBarcode = item.barcode ? String(item.barcode).toLowerCase().includes(query) : false;
        if (!matchName && !matchSku && !matchActive && !matchBarcode) return false;
      }

      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      if (imsOnly && !item.is_ims) {
        return false;
      }

      if (onlyComparable) {
        // Al menos una oferta válida en las otras droguerías competidoras (≥ 2 droguerías cotizando)
        if (!item.isComparable) return false;
      }

      if (onlyFullBasket) {
        // Disponible simultáneamente en todas las droguerías comparadas (Canasta Comparable)
        if (!item.isFullBasket) return false;
      }

      if (deviationFilter !== 'all') {
        const metrics = item.preferredMetrics;
        if (!metrics || !metrics.isAvailable) {
          if (deviationFilter !== 'unavailable') return false;
        } else {
          if (deviationFilter === 'winner' && !metrics.isWinner) return false;
          if (deviationFilter === 'competitive' && metrics.deltaCompetencia > 0) return false;
          if (deviationFilter === 'overpriced_slight' && (metrics.deltaCompetencia <= 0 || metrics.deltaCompetencia > 5)) return false;
          if (deviationFilter === 'overpriced_high' && metrics.deltaCompetencia <= 5) return false;
          if (deviationFilter === 'unavailable') return false;
        }
      }

      return true;
    });
  }, [evaluatedProducts, searchTerm, selectedCategory, imsOnly, onlyComparable, onlyFullBasket, deviationFilter]);

  // Cálculos Analíticos Globales y de IMS
  const globalBenchmark = useMemo(() => {
    updateDefaultProviders(providerLabels);
    return calculateProviderBenchmarks(products, adjustments, preferredProviderId);
  }, [products, adjustments, preferredProviderId, providerLabels]);

  const imsMetrics = useMemo(() => {
    updateDefaultProviders(providerLabels);
    return calculateIMSMetrics(products, adjustments, preferredProviderId);
  }, [products, adjustments, preferredProviderId, providerLabels]);

  // Manejo de Escenarios
  const handleSaveScenario = async (scenario) => {
    setSavedScenarios((prev) => [scenario, ...prev]);
    await saveScenarioToFirestore(scenario);
  };

  const handleLoadScenario = (scenario) => {
    if (scenario.adjustments) {
      setAdjustments({ ...scenario.adjustments });
    }
    if (scenario.preferredProviderId) {
      setPreferredProviderId(scenario.preferredProviderId);
    }
    setActiveSection('matrix');
  };

  const handleDeleteScenario = async (id) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    await deleteScenarioFromFirestore(id);
  };

  const handleExportScenarios = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedScenarios, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Escenarios_Negociacion_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportScenarios = (newScenarios) => {
    setSavedScenarios(newScenarios);
  };

  // Manejo de Conexiones via Backend
  const handleTestConnection = async (pharmacyKey) => {
    try {
      const resp = await fetch(`${API_BASE}/api/connections/test/${pharmacyKey}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authSession.token}` },
      });
      const data = await resp.json();
      setConnectionsStatus((prev) => ({
        ...prev,
        [pharmacyKey]: {
          status: data.success ? 'connected' : 'error',
          label: data.message || (data.success ? 'Conectado' : 'Error')
        }
      }));
      return data;
    } catch (err) {
      return { success: false, message: 'No se pudo conectar al backend: ' + err.message };
    }
  };

  const handleFileUpload = async (provId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await fetch(`${API_BASE}/api/upload/${provId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authSession.token}` },
        body: formData,
      });
      const data = await resp.json();
      if (data.success) {
        await refreshConnectionsStatus();
        await loadCatalog();
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Error al subir archivo: ' + err.message };
    }
  };

  const handleFileRemove = async (provId) => {
    try {
      const resp = await fetch(`${API_BASE}/api/upload/${provId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authSession.token}` },
      });
      const data = await resp.json();
      if (data.success) {
        await refreshConnectionsStatus();
        await loadCatalog();
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Error al remover archivo: ' + err.message };
    }
  };

  const handleSyncCatalog = async () => {
    try {
      // Lanzar sincronización completa en el backend
      const syncResp = await fetch(`${API_BASE}/api/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authSession.token}` }
      });
      await syncResp.json();

      // Recargar catálogo en vivo y estado de conexiones
      await loadCatalog();
      await refreshConnectionsStatus();
    } catch {
      // Si el backend no responde, mantener status actual
    }
  };

  const currentSectionTitle = {
    dashboard: 'Dashboard Ejecutivo de Precios',
    matrix: 'Matriz Comparativa de Ofertas',
    providers: 'Análisis de Competitividad por Proveedor',
    ims: 'Auditoría Segmento IMS (Top 800 de Alta Rotación)',
    scenarios: 'Gestor de Escenarios & Simulaciones de Descuentos',
    connections: 'Conexiones — Cobeca API + Listas de Precios'
  }[activeSection] || 'Comparador de Farmacias';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar de Navegación Multisección */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        connectionsStatus={connectionsStatus}
        savedScenariosCount={savedScenarios.length}
        providers={activeProviders}
      />

      {/* Área de Trabajo Principal con Scroll */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior */}
        <header className="bg-slate-900/95 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <h2 className="text-base font-black text-white truncate tracking-tight">
                {currentSectionTitle}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Plataforma B2B</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {products.length > 60
                    ? `${products.length.toLocaleString()} Artículos en Vivo`
                    : '4 Farmacias Homologadas'}
                </span>
                {isCatalogLoading && (
                  <span className="flex items-center gap-1 text-blue-400 font-medium animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Cargando API...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones Rápidas del Header */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{authSession.userName} <strong className="text-white">({authSession.drogueriaName} #{authSession.drogueriaId})</strong></span>
            </div>

            <button
              onClick={() => exportComparisonToCSV(filteredProducts, preferredProviderId, adjustments)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
              title="Descargar matriz en Excel/CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Excel</span>
            </button>

            <button
              onClick={() => exportExecutiveSummary(globalBenchmark, imsMetrics, adjustments, preferredProviderId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
              title="Descargar resumen ejecutivo gerencial"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reporte</span>
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Contenido Dinámico de la Sección Seleccionada */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECCIÓN 1: DASHBOARD EJECUTIVO */}
          {activeSection === 'dashboard' && (
            <ExecutiveDashboard
              benchmark={globalBenchmark}
              imsMetrics={imsMetrics}
              preferredProviderId={preferredProviderId}
              onNavigate={setActiveSection}
              onExportCSV={() => exportComparisonToCSV(filteredProducts, preferredProviderId, adjustments)}
              onExportReport={() => exportExecutiveSummary(globalBenchmark, imsMetrics, adjustments, preferredProviderId)}
              providers={activeProviders}
              connectionsStatus={connectionsStatus}
            />
          )}

          {/* SECCIÓN 2: MATRIZ COMPARATIVA */}
          {activeSection === 'matrix' && (
            <div className="space-y-6">
              {/* Sliders de Ajuste Dinámico */}
              <PriceAdjusterControls
                adjustments={adjustments}
                onAdjustmentChange={handleAdjustmentChange}
                preferredProviderId={preferredProviderId}
                onPreferredChange={setPreferredProviderId}
                onResetAdjustments={handleResetAdjustments}
                providers={activeProviders}
              />

              {/* Barra de Filtros en Vivo */}
              <FilterToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                imsOnly={imsOnly}
                onToggleIms={setImsOnly}
                onlyComparable={onlyComparable}
                onToggleComparable={setOnlyComparable}
                onlyFullBasket={onlyFullBasket}
                onToggleFullBasket={setOnlyFullBasket}
                deviationFilter={deviationFilter}
                onDeviationFilterChange={setDeviationFilter}
                preferredProviderId={preferredProviderId}
                totalCount={products.length}
                filteredCount={filteredProducts.length}
                comparableCount={globalBenchmark.comparableCount}
                activeProviderCount={activeProviderCount}
                providers={activeProviders}
                onClearFilters={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setImsOnly(false);
                  setOnlyComparable(false);
                  setOnlyFullBasket(false);
                  setDeviationFilter('all');
                }}
              />

              {/* Tabla Matricial */}
              <ComparisonTable
                products={filteredProducts}
                preferredProviderId={preferredProviderId}
                adjustments={adjustments}
                providers={activeProviders}
              />
            </div>
          )}

          {/* SECCIÓN 3: ANÁLISIS POR PROVEEDOR */}
          {activeSection === 'providers' && (
            <div className="space-y-6">
              <PriceAdjusterControls
                adjustments={adjustments}
                onAdjustmentChange={handleAdjustmentChange}
                preferredProviderId={preferredProviderId}
                onPreferredChange={setPreferredProviderId}
                onResetAdjustments={handleResetAdjustments}
                providers={activeProviders}
              />

              <ProviderBenchmark
                benchmark={globalBenchmark}
                preferredProviderId={preferredProviderId}
                adjustments={adjustments}
                providers={activeProviders}
              />
            </div>
          )}

          {/* SECCIÓN 4: ANÁLISIS SEGMENTO IMS */}
          {activeSection === 'ims' && (
            <div className="space-y-6">
              <IMSCriticalAnalysis
                imsMetrics={imsMetrics}
                preferredProviderId={preferredProviderId}
              />
            </div>
          )}

          {/* SECCIÓN 5: GESTOR DE ESCENARIOS */}
          {activeSection === 'scenarios' && (
            <ScenariosView
              currentAdjustments={adjustments}
              currentPreferredProviderId={preferredProviderId}
              savedScenarios={savedScenarios}
              onSaveScenario={handleSaveScenario}
              onLoadScenario={handleLoadScenario}
              onDeleteScenario={handleDeleteScenario}
              onExportScenarios={handleExportScenarios}
              onImportScenarios={handleImportScenarios}
            />
          )}

          {/* SECCIÓN 6: CONEXIONES */}
          {activeSection === 'connections' && (
            <PharmacyConnections
              connectionsStatus={connectionsStatus}
              onTestConnection={handleTestConnection}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              onSyncCatalog={handleSyncCatalog}
              authSession={authSession}
              providerLabels={providerLabels}
              onProviderRename={handleProviderRename}
            />
          )}
        </main>
      </div>
    </div>
  );
}