/**
 * Catálogo Maestro Unificado de Productos Farmacéuticos
 * Incluye datos estructurados con las 4 farmacias / proveedores:
 * - prov_1: Cobeca (fuente principal — API REST)
 * - prov_2: Droguería 1 (lista de precios por documento)
 * - prov_3: Droguería 2 (lista de precios por documento)
 * - prov_4: Droguería 3 (lista de precios por documento)
 * 
 * Contiene el flag `is_ims` para el segmento Top 800 de alta rotación,
 * con variación de precios realistas, faltantes de inventario y datos normalizados.
 */

// Lista base de medicamentos de alta demanda clínica y comercial
const SEED_PRODUCTS = [
  // CARDIOVASCULAR
  {
    master_id: 'atorvastatina-20mg-x30',
    sku: 'SKU-1001',
    display_name: 'Atorvastatina 20mg x 30 Tab',
    active_ingredient: 'Atorvastatina Cálcica',
    category: 'Cardiovascular',
    unit_of_measure: 'Caja x 30 Comprimidos',
    is_ims: true,
    prices: { prov_1: 4.20, prov_2: 4.45, prov_3: 3.95, prov_4: 4.80 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'losartan-potasico-50mg-x30',
    sku: 'SKU-1002',
    display_name: 'Losartán Potásico 50mg x 30 Tab',
    active_ingredient: 'Losartán Potásico',
    category: 'Cardiovascular',
    unit_of_measure: 'Caja x 30 Tabletas',
    is_ims: true,
    prices: { prov_1: 3.10, prov_2: 2.90, prov_3: 3.40, prov_4: 3.65 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'amlodipina-10mg-x30',
    sku: 'SKU-1003',
    display_name: 'Amlodipina 10mg x 30 Tab',
    active_ingredient: 'Amlodipino Besilato',
    category: 'Cardiovascular',
    unit_of_measure: 'Caja x 30 Tabletas',
    is_ims: true,
    prices: { prov_1: 2.80, prov_2: 3.10, prov_3: 2.65, prov_4: 3.25 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'carvedilol-25mg-x30',
    sku: 'SKU-1004',
    display_name: 'Carvedilol 25mg x 30 Tab',
    active_ingredient: 'Carvedilol',
    category: 'Cardiovascular',
    unit_of_measure: 'Caja x 30 Tabletas',
    is_ims: true,
    prices: { prov_1: 5.50, prov_2: 5.20, prov_3: 5.85, prov_4: 6.10 },
    stocks: { prov_1: true, prov_2: true, prov_3: false, prov_4: true }
  },
  {
    master_id: 'enalapril-20mg-x30',
    sku: 'SKU-1005',
    display_name: 'Enalapril Maleato 20mg x 30 Tab',
    active_ingredient: 'Enalapril Maleato',
    category: 'Cardiovascular',
    unit_of_measure: 'Caja x 30 Tabletas',
    is_ims: true,
    prices: { prov_1: 2.20, prov_2: 2.15, prov_3: 2.50, prov_4: 2.70 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },

  // ANALGÉSICOS Y ANTIINFLAMATORIOS
  {
    master_id: 'acetaminofen-500mg-x20',
    sku: 'SKU-2001',
    display_name: 'Acetaminofén (Paracetamol) 500mg x 20 Tab',
    active_ingredient: 'Paracetamol',
    category: 'Analgésicos',
    unit_of_measure: 'Blíster x 20 Tabletas',
    is_ims: true,
    prices: { prov_1: 1.40, prov_2: 1.25, prov_3: 1.60, prov_4: 1.85 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'ibuprofeno-400mg-x20',
    sku: 'SKU-2002',
    display_name: 'Ibuprofeno 400mg x 20 Cápsulas Blandas',
    active_ingredient: 'Ibuprofeno',
    category: 'Analgésicos',
    unit_of_measure: 'Caja x 20 Cápsulas',
    is_ims: true,
    prices: { prov_1: 2.75, prov_2: 2.90, prov_3: 2.50, prov_4: 3.10 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'ketoprofeno-100mg-x20',
    sku: 'SKU-2003',
    display_name: 'Ketoprofeno 100mg x 20 Comprimidos',
    active_ingredient: 'Ketoprofeno',
    category: 'Analgésicos',
    unit_of_measure: 'Caja x 20 Comprimidos',
    is_ims: true,
    prices: { prov_1: 4.80, prov_2: 4.60, prov_3: 5.10, prov_4: 5.40 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: false }
  },
  {
    master_id: 'diclofenac-sodico-50mg-x20',
    sku: 'SKU-2004',
    display_name: 'Diclofenac Sódico 50mg x 20 Grageas',
    active_ingredient: 'Diclofenaco Sódico',
    category: 'Analgésicos',
    unit_of_measure: 'Caja x 20 Grageas',
    is_ims: true,
    prices: { prov_1: 2.10, prov_2: 2.30, prov_3: 1.95, prov_4: 2.45 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'tramadol-50mg-x10',
    sku: 'SKU-2005',
    display_name: 'Tramadol Clorhidrato 50mg x 10 Cápsulas',
    active_ingredient: 'Tramadol Clorhidrato',
    category: 'Analgésicos',
    unit_of_measure: 'Caja x 10 Cápsulas',
    is_ims: false,
    prices: { prov_1: 6.20, prov_2: 6.50, prov_3: 5.90, prov_4: 6.80 },
    stocks: { prov_1: true, prov_2: false, prov_3: true, prov_4: true }
  },

  // ANTIBIÓTICOS Y ANTIINFECCIOSOS
  {
    master_id: 'amoxicilina-clavulanico-875-125-x14',
    sku: 'SKU-3001',
    display_name: 'Amoxicilina + Ácido Clavulánico 875/125mg x 14',
    active_ingredient: 'Amoxicilina / Clavulanato',
    category: 'Antibióticos',
    unit_of_measure: 'Caja x 14 Tabletas',
    is_ims: true,
    prices: { prov_1: 11.50, prov_2: 12.10, prov_3: 10.80, prov_4: 12.90 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'azitromicina-500mg-x3',
    sku: 'SKU-3002',
    display_name: 'Azitromicina 500mg x 3 Tabletas',
    active_ingredient: 'Azitromicina',
    category: 'Antibióticos',
    unit_of_measure: 'Caja x 3 Tabletas',
    is_ims: true,
    prices: { prov_1: 4.60, prov_2: 4.20, prov_3: 4.90, prov_4: 5.20 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'ciprofloxacina-500mg-x10',
    sku: 'SKU-3003',
    display_name: 'Ciprofloxacina 500mg x 10 Tabletas',
    active_ingredient: 'Ciprofloxacina',
    category: 'Antibióticos',
    unit_of_measure: 'Caja x 10 Tabletas',
    is_ims: true,
    prices: { prov_1: 5.30, prov_2: 5.60, prov_3: 5.00, prov_4: 5.90 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'cefalexina-500mg-x20',
    sku: 'SKU-3004',
    display_name: 'Cefalexina 500mg x 20 Cápsulas',
    active_ingredient: 'Cefalexina',
    category: 'Antibióticos',
    unit_of_measure: 'Caja x 20 Cápsulas',
    is_ims: false,
    prices: { prov_1: 7.20, prov_2: 6.90, prov_3: 7.40, prov_4: 7.80 },
    stocks: { prov_1: true, prov_2: true, prov_3: false, prov_4: true }
  },

  // GASTROINTESTINAL
  {
    master_id: 'omeprazol-20mg-x28',
    sku: 'SKU-4001',
    display_name: 'Omeprazol 20mg x 28 Cápsulas',
    active_ingredient: 'Omeprazol',
    category: 'Gastrointestinal',
    unit_of_measure: 'Caja x 28 Cápsulas',
    is_ims: true,
    prices: { prov_1: 3.20, prov_2: 3.40, prov_3: 2.95, prov_4: 3.60 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'pantoprazol-40mg-x28',
    sku: 'SKU-4002',
    display_name: 'Pantoprazol 40mg x 28 Comprimidos',
    active_ingredient: 'Pantoprazol',
    category: 'Gastrointestinal',
    unit_of_measure: 'Caja x 28 Comprimidos',
    is_ims: true,
    prices: { prov_1: 6.80, prov_2: 6.40, prov_3: 7.10, prov_4: 7.50 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'domperidona-10mg-x30',
    sku: 'SKU-4003',
    display_name: 'Domperidona 10mg x 30 Tabletas',
    active_ingredient: 'Domperidona',
    category: 'Gastrointestinal',
    unit_of_measure: 'Caja x 30 Tabletas',
    is_ims: false,
    prices: { prov_1: 3.90, prov_2: 4.10, prov_3: 3.70, prov_4: 4.30 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: false }
  },
  {
    master_id: 'loperamida-2mg-x10',
    sku: 'SKU-4004',
    display_name: 'Loperamida 2mg x 10 Tabletas',
    active_ingredient: 'Clorhidrato de Loperamida',
    category: 'Gastrointestinal',
    unit_of_measure: 'Blíster x 10 Tabletas',
    is_ims: true,
    prices: { prov_1: 1.60, prov_2: 1.50, prov_3: 1.75, prov_4: 1.95 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },

  // RESPIRATORIO Y ANTIALÉRGICOS
  {
    master_id: 'loratadina-10mg-x10',
    sku: 'SKU-5001',
    display_name: 'Loratadina 10mg x 10 Tabletas',
    active_ingredient: 'Loratadina',
    category: 'Respiratorio',
    unit_of_measure: 'Caja x 10 Tabletas',
    is_ims: true,
    prices: { prov_1: 1.80, prov_2: 1.65, prov_3: 1.95, prov_4: 2.10 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'cetirizina-10mg-x10',
    sku: 'SKU-5002',
    display_name: 'Cetirizina 10mg x 10 Tabletas',
    active_ingredient: 'Cetirizina Diclorhidrato',
    category: 'Respiratorio',
    unit_of_measure: 'Caja x 10 Tabletas',
    is_ims: true,
    prices: { prov_1: 2.40, prov_2: 2.60, prov_3: 2.15, prov_4: 2.80 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'salbutamol-inhalador-100mcg',
    sku: 'SKU-5003',
    display_name: 'Salbutamol Aerosol 100mcg 200 Dosis',
    active_ingredient: 'Salbutamol Sulfato',
    category: 'Respiratorio',
    unit_of_measure: 'Frasco Inhalador x 200 Dosis',
    is_ims: true,
    prices: { prov_1: 5.90, prov_2: 5.50, prov_3: 6.20, prov_4: 6.60 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'montelukast-10mg-x30',
    sku: 'SKU-5004',
    display_name: 'Montelukast 10mg x 30 Comprimidos Recubiertos',
    active_ingredient: 'Montelukast Sódico',
    category: 'Respiratorio',
    unit_of_measure: 'Caja x 30 Comprimidos',
    is_ims: false,
    prices: { prov_1: 8.90, prov_2: 9.30, prov_3: 8.50, prov_4: 9.80 },
    stocks: { prov_1: true, prov_2: false, prov_3: true, prov_4: true }
  },

  // ENDOCRINOLOGÍA Y METABOLISMO
  {
    master_id: 'metformina-850mg-x30',
    sku: 'SKU-6001',
    display_name: 'Metformina Clorhidrato 850mg x 30 Tab',
    active_ingredient: 'Metformina Clorhidrato',
    category: 'Endocrinología',
    unit_of_measure: 'Caja x 30 Tabletas',
    is_ims: true,
    prices: { prov_1: 3.50, prov_2: 3.20, prov_3: 3.80, prov_4: 4.10 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'levotiroxina-100mcg-x50',
    sku: 'SKU-6002',
    display_name: 'Levotiroxina Sódica 100mcg x 50 Tab',
    active_ingredient: 'Levotiroxina Sódica',
    category: 'Endocrinología',
    unit_of_measure: 'Caja x 50 Tabletas',
    is_ims: true,
    prices: { prov_1: 6.40, prov_2: 6.70, prov_3: 6.10, prov_4: 7.20 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'glibenclamida-5mg-x30',
    sku: 'SKU-6003',
    display_name: 'Glibenclamida 5mg x 30 Tabletas',
    active_ingredient: 'Glibenclamida',
    category: 'Endocrinología',
    unit_of_measure: 'Caja x 30 Tabletas',
    is_ims: false,
    prices: { prov_1: 2.10, prov_2: 1.95, prov_3: 2.30, prov_4: 2.50 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },

  // NEUROLOGÍA Y SALUD MENTAL
  {
    master_id: 'sertralina-50mg-x30',
    sku: 'SKU-7001',
    display_name: 'Sertralina 50mg x 30 Comprimidos',
    active_ingredient: 'Sertralina Clorhidrato',
    category: 'Neurología',
    unit_of_measure: 'Caja x 30 Comprimidos',
    is_ims: true,
    prices: { prov_1: 7.80, prov_2: 8.20, prov_3: 7.40, prov_4: 8.90 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'pregabalina-75mg-x30',
    sku: 'SKU-7002',
    display_name: 'Pregabalina 75mg x 30 Cápsulas',
    active_ingredient: 'Pregabalina',
    category: 'Neurología',
    unit_of_measure: 'Caja x 30 Cápsulas',
    is_ims: true,
    prices: { prov_1: 9.50, prov_2: 9.10, prov_3: 10.20, prov_4: 10.80 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: false }
  },

  // DERMATOLOGÍA
  {
    master_id: 'betametasona-crema-0-05-30g',
    sku: 'SKU-8001',
    display_name: 'Betametasona Crema 0.05% x 30g',
    active_ingredient: 'Betametasona Dipropionato',
    category: 'Dermatología',
    unit_of_measure: 'Tubo x 30g',
    is_ims: true,
    prices: { prov_1: 3.40, prov_2: 3.60, prov_3: 3.15, prov_4: 3.85 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'clotrimazol-crema-1-20g',
    sku: 'SKU-8002',
    display_name: 'Clotrimazol Crema Tópica 1% x 20g',
    active_ingredient: 'Clotrimazol',
    category: 'Dermatología',
    unit_of_measure: 'Tubo x 20g',
    is_ims: false,
    prices: { prov_1: 2.30, prov_2: 2.10, prov_3: 2.50, prov_4: 2.75 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },

  // VITAMINAS Y SUPLEMENTOS OTC
  {
    master_id: 'vitamina-c-1000mg-x10-efervescente',
    sku: 'SKU-9001',
    display_name: 'Vitamina C 1000mg x 10 Tabletas Efervescentes',
    active_ingredient: 'Ácido Ascórbico',
    category: 'Vitaminas y OTC',
    unit_of_measure: 'Tubo x 10 Tabletas',
    is_ims: true,
    prices: { prov_1: 3.90, prov_2: 4.20, prov_3: 3.60, prov_4: 4.50 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'complejo-b-forte-x30',
    sku: 'SKU-9002',
    display_name: 'Complejo B Forte x 30 Grageas',
    active_ingredient: 'Vitaminas B1, B6, B12',
    category: 'Vitaminas y OTC',
    unit_of_measure: 'Caja x 30 Grageas',
    is_ims: true,
    prices: { prov_1: 4.50, prov_2: 4.10, prov_3: 4.80, prov_4: 5.10 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  },
  {
    master_id: 'calcio-vitamina-d3-x60',
    sku: 'SKU-9003',
    display_name: 'Calcio 600mg + Vitamina D3 400UI x 60 Tab',
    active_ingredient: 'Carbonato de Calcio / Colecalciferol',
    category: 'Vitaminas y OTC',
    unit_of_measure: 'Frasco x 60 Tabletas',
    is_ims: false,
    prices: { prov_1: 7.80, prov_2: 8.10, prov_3: 7.50, prov_4: 8.60 },
    stocks: { prov_1: true, prov_2: true, prov_3: false, prov_4: true }
  },
  {
    master_id: 'zinc-sulfato-50mg-x30',
    sku: 'SKU-9004',
    display_name: 'Sulfato de Zinc 50mg x 30 Cápsulas',
    active_ingredient: 'Sulfato de Zinc Heptahidratado',
    category: 'Vitaminas y OTC',
    unit_of_measure: 'Caja x 30 Cápsulas',
    is_ims: true,
    prices: { prov_1: 3.10, prov_2: 2.85, prov_3: 3.30, prov_4: 3.50 },
    stocks: { prov_1: true, prov_2: true, prov_3: true, prov_4: true }
  }
];

// Generador sintético para enriquecer el catálogo hasta 120 SKUs representativos
// con distribución de precios y rotación coherente (800 IMS ratio)
function generateExpandedCatalog() {
  const genericMolecules = [
    { name: 'Candesartán', cat: 'Cardiovascular', dose: '16mg x 30 Tab', price: 6.5 },
    { name: 'Valsartán', cat: 'Cardiovascular', dose: '80mg x 28 Tab', price: 7.2 },
    { name: 'Hidroclorotiazida', cat: 'Cardiovascular', dose: '25mg x 30 Tab', price: 2.1 },
    { name: 'Naproxeno', cat: 'Analgésicos', dose: '550mg x 10 Tab', price: 3.4 },
    { name: 'Celecoxib', cat: 'Analgésicos', dose: '200mg x 10 Cápsulas', price: 5.8 },
    { name: 'Dexametasona', cat: 'Analgésicos', dose: '4mg x 10 Comprimidos', price: 2.6 },
    { name: 'Claromicina', cat: 'Antibióticos', dose: '500mg x 10 Tab', price: 9.4 },
    { name: 'Metronidazol', cat: 'Antibióticos', dose: '500mg x 20 Tab', price: 3.1 },
    { name: 'Amikacina', cat: 'Antibióticos', dose: '500mg Ampolla x 2ml', price: 4.2 },
    { name: 'Esomeprazol', cat: 'Gastrointestinal', dose: '40mg x 28 Cápsulas', price: 8.5 },
    { name: 'Sucralfato', cat: 'Gastrointestinal', dose: '1g x 20 Sobres', price: 7.1 },
    { name: 'Hioscina Butilbromuro', cat: 'Gastrointestinal', dose: '10mg x 20 Grageas', price: 3.8 },
    { name: 'Budesonida Inhalador', cat: 'Respiratorio', dose: '200mcg 200 Dosis', price: 11.2 },
    { name: 'Desloratadina', cat: 'Respiratorio', dose: '5mg x 10 Tab', price: 3.6 },
    { name: 'Ambroxol Jarabe', cat: 'Respiratorio', dose: '15mg/5ml x 120ml', price: 3.0 },
    { name: 'Glimepirida', cat: 'Endocrinología', dose: '4mg x 30 Tab', price: 4.9 },
    { name: 'Dapagliflozina', cat: 'Endocrinología', dose: '10mg x 28 Tab', price: 22.5 },
    { name: 'Sitagliptina', cat: 'Endocrinología', dose: '100mg x 28 Tab', price: 18.0 },
    { name: 'Alprazolam', cat: 'Neurología', dose: '0.5mg x 30 Tab', price: 4.5 },
    { name: 'Clonazepam', cat: 'Neurología', dose: '2mg x 30 Tab', price: 5.2 },
    { name: 'Escitalopram', cat: 'Neurología', dose: '10mg x 30 Tab', price: 9.8 },
    { name: 'Mupirocina Ungüento', cat: 'Dermatología', dose: '2% x 15g', price: 4.6 },
    { name: 'Ketoconazol Crema', cat: 'Dermatología', dose: '2% x 30g', price: 3.2 },
    { name: 'Colágeno Hidrolizado + Vit C', cat: 'Vitaminas y OTC', dose: 'Polvo 300g', price: 12.0 },
    { name: 'Omega 3 1000mg', cat: 'Vitaminas y OTC', dose: 'x 60 Cápsulas Blandas', price: 8.5 }
  ];

  const fullList = [...SEED_PRODUCTS];

  genericMolecules.forEach((mol, i) => {
    const skuNum = 9100 + i;
    const baseP = mol.price;
    const isIms = (i % 3 !== 0); // 66% rotación alta IMS

    fullList.push({
      master_id: `${mol.name.toLowerCase().replace(/\s+/g, '-')}-${mol.dose.toLowerCase().replace(/\s+/g, '-')}`,
      sku: `SKU-${skuNum}`,
      display_name: `${mol.name} ${mol.dose}`,
      active_ingredient: mol.name,
      category: mol.cat,
      unit_of_measure: 'Unidad de Dispensación',
      is_ims: isIms,
      prices: {
        prov_1: Math.round(baseP * (1 + ((i * 7) % 19 - 8) / 100) * 100) / 100,
        prov_2: Math.round(baseP * (1 + ((i * 11) % 23 - 10) / 100) * 100) / 100,
        prov_3: Math.round(baseP * (1 + ((i * 13) % 21 - 9) / 100) * 100) / 100,
        prov_4: Math.round(baseP * (1 + ((i * 5) % 25 - 6) / 100) * 100) / 100
      },
      stocks: {
        prov_1: true,
        prov_2: (i % 7 !== 0),
        prov_3: (i % 9 !== 0),
        prov_4: (i % 6 !== 0)
      }
    });
  });

  // Transformar al formato ProductMaster
  return fullList.map((item) => {
    return {
      master_id: item.master_id,
      sku: item.sku,
      display_name: item.display_name,
      active_ingredient: item.active_ingredient,
      category: item.category,
      unit_of_measure: item.unit_of_measure,
      is_ims: item.is_ims,
      suppliers: {
        prov_1: {
          supplier_id: 'prov_1',
          supplier_name: 'Cobeca',
          raw_name: item.display_name,
          base_price: item.prices.prov_1,
          in_stock: item.stocks.prov_1,
          product_url: 'https://comparadores.drogueriascobeca.com'
        },
        prov_2: {
          supplier_id: 'prov_2',
          supplier_name: 'Droguería 1',
          raw_name: item.display_name,
          base_price: item.prices.prov_2,
          in_stock: item.stocks.prov_2,
          product_url: null
        },
        prov_3: {
          supplier_id: 'prov_3',
          supplier_name: 'Droguería 2',
          raw_name: item.display_name,
          base_price: item.prices.prov_3,
          in_stock: item.stocks.prov_3,
          product_url: null
        },
        prov_4: {
          supplier_id: 'prov_4',
          supplier_name: 'Droguería 3',
          raw_name: item.display_name,
          base_price: item.prices.prov_4,
          in_stock: item.stocks.prov_4,
          product_url: null
        }
      }
    };
  });
}

export const INITIAL_CATALOG = generateExpandedCatalog();
