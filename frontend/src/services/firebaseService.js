import { collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const SCENARIOS_COLLECTION = 'scenarios';
const CONFIG_COLLECTION = 'pharmacy_configs';

/**
 * Guarda un escenario de negociación en Cloud Firestore con timestamp del servidor.
 */
export async function saveScenarioToFirestore(scenario) {
  try {
    const docRef = doc(db, SCENARIOS_COLLECTION, scenario.id);
    await setDoc(docRef, {
      ...scenario,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.warn('Firestore fallback: guardando localmente debido a:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Recupera los escenarios guardados en Cloud Firestore.
 */
export async function fetchScenariosFromFirestore() {
  try {
    const colRef = collection(db, SCENARIOS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const scenarios = [];
    snapshot.forEach((docSnap) => {
      scenarios.push({ id: docSnap.id, ...docSnap.data() });
    });
    return scenarios;
  } catch (error) {
    console.warn('Firestore fallback al leer escenarios:', error.message);
    return null;
  }
}

/**
 * Elimina un escenario de Cloud Firestore.
 */
export async function deleteScenarioFromFirestore(scenarioId) {
  try {
    const docRef = doc(db, SCENARIOS_COLLECTION, scenarioId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.warn('Firestore error al eliminar escenario:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Guarda la configuración y estado de las conexiones de farmacias.
 */
export async function savePharmacyCredentialsToFirestore(credentials) {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, 'active_credentials');
    await setDoc(docRef, {
      credentials,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.warn('Firestore error al guardar credenciales:', error.message);
    return { success: false, error: error.message };
  }
}
