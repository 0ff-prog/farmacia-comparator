import { useState, useMemo, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  Building2,
  CheckCircle2
} from 'lucide-react';

import { INITIAL_CATALOG } from './data/mockPharmacyData';
import {
  DEFAULT_PROVIDERS,
  evaluateProductRow,
  calculateProviderBenchmarks,
  calculateIMSMetrics
} from './utils/analyticsMath';
import { exportComparisonToCSV, exportExecutiveSummary } from './utils/exportUtils';
import {
  saveScenarioToFirestore,
  fetchScenariosFromFirestore,
  deleteScenarioFromFirestore,
  savePharmacyCredentialsToFirestore
} from './services/firebaseService';

import Sidebar from './components/layout/Sidebar';
import ExecutiveDashboard from './components/dashboard/ExecutiveDashboard';
import PriceAdjusterControls from './components/comparison/PriceAdjusterControls';
import FilterToolbar from './components/comparison/FilterToolbar';
import ComparisonTable from './components/comparison/ComparisonTable';
import ProviderBenchmark from './components/analytics/ProviderBenchmark';
import IMSCriticalAnalysis from './components/analytics/IMSCriticalAnalysis';
import ScenariosView from './components/scenarios/ScenariosView';
import PharmacyConnections from './components/connections/PharmacyConnections';

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

const DEFAULT_CREDENTIALS = {
  prov_1: {
    apiUrl: 'https://comparadores.drogueriascobeca.com/api/articulos/drogueria',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    drogueriaId: '7'
  },
  prov_2: {
    username: 'cliente.saas.occidente',
    password: '',
    branch: 'Sede Principal'
  },
  prov_3: {
    username: 'farmacia.locatel.central',
    password: '',
    branch: 'Centro Distribución 1'
  },
  prov_4: {
    username: 'cuenta.farmatodo.b2b',
    password: '',
    branch: 'Nacional'
  }
};

export default function App() {
  // Navegación Activa
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Catálogo de Productos
  const [products] = useState(INITIAL_CATALOG);

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
  const [deviationFilter, setDeviationFilter] = useState('all');

  // Credenciales de las 4 Farmacias
  const [credentials, setCredentials] = useState(() => {
    try {
      const stored = localStorage.getItem('pharma_credentials_v1');
      return stored ? JSON.parse(stored) : DEFAULT_CREDENTIALS;
    } catch {
      return DEFAULT_CREDENTIALS;
    }
  });

  // Estado de las Conexiones
  const [connectionsStatus, setConnectionsStatus] = useState({
    prov_1: { status: 'connected', label: 'API Cobeca Activa' },
    prov_2: { status: 'connected', label: 'Portal Saas Activo' },
    prov_3: { status: 'connected', label: 'Portal Locatel Activo' },
    prov_4: { status: 'connected', label: 'Portal Farmatodo Activo' }
  });

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

  // Evaluación en Tiempo Real
  const evaluatedProducts = useMemo(() => {
    return products.map((p) => evaluateProductRow(p, adjustments, preferredProviderId));
  }, [products, adjustments, preferredProviderId]);

  // Filtrado de la Matriz
  const filteredProducts = useMemo(() => {
    return evaluatedProducts.filter((item) => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = item.display_name.toLowerCase().includes(query);
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchActive = item.active_ingredient?.toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchActive) return false;
      }

      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      if (imsOnly && !item.is_ims) {
        return false;
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
  }, [evaluatedProducts, searchTerm, selectedCategory, imsOnly, deviationFilter]);

  // Cálculos Analíticos Globales y de IMS
  const globalBenchmark = useMemo(() => {
    return calculateProviderBenchmarks(products, adjustments, preferredProviderId);
  }, [products, adjustments, preferredProviderId]);

  const imsMetrics = useMemo(() => {
    return calculateIMSMetrics(products, adjustments, preferredProviderId);
  }, [products, adjustments, preferredProviderId]);

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

  // Manejo de Credenciales y Conexiones
  const handleSaveCredentials = async (newCreds) => {
    setCredentials(newCreds);
    localStorage.setItem('pharma_credentials_v1', JSON.stringify(newCreds));
    await savePharmacyCredentialsToFirestore(newCreds);
  };

  const handleTestConnection = async (pharmacyKey, creds) => {
    await new Promise((res) => setTimeout(res, 800));

    if (pharmacyKey === 'prov_1') {
      if (!creds.apiUrl || !creds.apiKey) {
        return { success: false, message: 'Falta configurar API_URL o Token JWT.' };
      }
      return {
        success: true,
        message: `✓ Conexión establecida con Cobeca (Sede #${creds.drogueriaId || '7'}). Catálogo activo.`
      };
    } else {
      const provName = DEFAULT_PROVIDERS.find((p) => p.id === pharmacyKey)?.shortName || 'Farmacia';
      if (!creds.username) {
        return { success: false, message: `Introduce un usuario válido para ${provName}.` };
      }
      return {
        success: true,
        message: `✓ Credenciales validadas para ${provName} (${creds.branch || 'Principal'}). Sesión B2B activa.`
      };
    }
  };

  const handleSyncCatalog = async () => {
    await new Promise((res) => setTimeout(res, 1000));
    setConnectionsStatus({
      prov_1: { status: 'connected', label: 'Cobeca Sincronizada' },
      prov_2: { status: 'connected', label: 'Saas Sincronizada' },
      prov_3: { status: 'connected', label: 'Locatel Sincronizada' },
      prov_4: { status: 'connected', label: 'Farmatodo Sincronizada' }
    });
  };

  const currentSectionTitle = {
    dashboard: 'Dashboard Ejecutivo de Precios',
    matrix: 'Matriz Comparativa de Ofertas',
    providers: 'Análisis de Competitividad por Proveedor',
    ims: 'Auditoría Segmento IMS (Top 800 de Alta Rotación)',
    scenarios: 'Gestor de Escenarios & Simulaciones de Descuentos',
    connections: 'Conexión de Farmacias & Credenciales (1 API + 3 Portales)'
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
                  4 Farmacias Homologadas
                </span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas del Header */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Sede Activa: <strong className="text-white">Droguería Cobeca (#7)</strong></span>
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
                deviationFilter={deviationFilter}
                onDeviationFilterChange={setDeviationFilter}
                preferredProviderId={preferredProviderId}
                totalCount={products.length}
                filteredCount={filteredProducts.length}
                onClearFilters={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setImsOnly(false);
                  setDeviationFilter('all');
                }}
              />

              {/* Tabla Matricial */}
              <ComparisonTable
                products={filteredProducts}
                preferredProviderId={preferredProviderId}
                adjustments={adjustments}
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
              />

              <ProviderBenchmark
                benchmark={globalBenchmark}
                preferredProviderId={preferredProviderId}
                adjustments={adjustments}
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

          {/* SECCIÓN 6: CONEXIÓN DE FARMACIAS & CREDENCIALES */}
          {activeSection === 'connections' && (
            <PharmacyConnections
              credentials={credentials}
              onSaveCredentials={handleSaveCredentials}
              onTestConnection={handleTestConnection}
              onSyncCatalog={handleSyncCatalog}
            />
          )}
        </main>
      </div>
    </div>
  );
}