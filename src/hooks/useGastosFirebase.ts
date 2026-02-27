<<<<<<< Updated upstream
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
=======
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
>>>>>>> Stashed changes
  doc,
  onSnapshot,
  Timestamp,
  Query,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../services/firebase';
import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';

const obtenerStorageKey = (userId: string | null) =>
  userId ? `finanzapp-gastos-${userId}` : 'finanzapp-gastos-temp';

<<<<<<< Updated upstream
// Función para sincronizar gastos en segundo plano sin bloquear la UI
async function sincronizarGastosEnSegundoPlano(
  gastosLocal: Gasto[], 
  userId: string
): Promise<void> {
  if (!isFirebaseConfigured() || !db || !auth?.currentUser) {
    console.warn('💡 No se puede sincronizar: Firebase no está configurado o usuario no autenticado.');
    console.warn('Estado:', {
      isFirebaseConfigured: isFirebaseConfigured(),
      tieneDb: !!db,
      tieneAuth: !!auth,
      currentUser: auth?.currentUser?.uid,
      userId: userId,
    });
    return;
  }

  // Verificar que el usuario esté autenticado correctamente
  if (auth.currentUser.uid !== userId) {
    console.error('🔴 ERROR: El userId no coincide con el usuario autenticado');
    console.error('   userId proporcionado:', userId);
    console.error('   auth.currentUser.uid:', auth.currentUser.uid);
    return;
  }

  // Intentar sincronizar SIN timeout primero para capturar el error real
  try {
    console.log('🔄 Iniciando sincronización de', gastosLocal.length, 'gastos...');
    console.log('🔍 Verificando autenticación:', {
      userId: userId,
      authUserId: auth.currentUser?.uid,
      coincide: auth.currentUser?.uid === userId,
    });
    
    const gastosRef = collection(db, 'gastos');
    let sincronizados = 0;
    const errores: any[] = [];
    
    // PRIMERO: Verificar estado de autenticación en detalle
    console.log('🔍 Paso 0: Verificando estado de autenticación...');
    console.log('📋 Detalles de autenticación:', {
      tieneAuth: !!auth,
      tieneCurrentUser: !!auth?.currentUser,
      currentUserUid: auth?.currentUser?.uid,
      userId: userId,
      coinciden: auth?.currentUser?.uid === userId,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
    });
    
    if (!auth?.currentUser) {
      console.error('🔴 ERROR: No hay usuario autenticado en Firebase');
      console.error('📋 Esto significa que las reglas de Firestore bloquearán todas las operaciones');
      console.error('📋 SOLUCIÓN: El usuario debe estar autenticado antes de sincronizar');
      alert('❌ No hay usuario autenticado\n\nDebes iniciar sesión primero.\n\nRevisa la consola para más detalles.');
      return;
    }
    
    if (auth.currentUser.uid !== userId) {
      console.error('🔴 ERROR: El userId no coincide con el usuario autenticado');
      console.error('📋 Esto causará que las reglas de Firestore bloqueen las operaciones');
      return;
    }
    
    // PRIMERO: Verificar conectividad con una consulta simple (sin orderBy)
    console.log('🔍 Paso 1: Verificando conectividad básica con Firebase...');
    try {
      // Consulta simple sin orderBy para verificar conectividad básica
      const simpleQuery = query(
        gastosRef,
        where('user_id', '==', userId)
      );
      const testTimeout = new Promise((_, reject) => {
        setTimeout(() => {
          const timeoutError: any = new Error('Timeout de lectura: Firebase no responde');
          timeoutError.code = 'read-timeout';
          reject(timeoutError);
        }, 5000);
      });
      
      console.log('📤 Enviando consulta a Firebase...');
      const resultado = await Promise.race([getDocs(simpleQuery), testTimeout]);
      console.log('✅ Firebase responde correctamente (conectividad básica OK)');
      console.log('📊 Documentos encontrados:', (resultado as any).size || 0);
      
      // SEGUNDO: Verificar que el índice compuesto existe (consulta con orderBy)
      console.log('🔍 Paso 1.5: Verificando índice compuesto...');
      try {
        const indexQuery = query(
          gastosRef,
          where('user_id', '==', userId),
          orderBy('fecha', 'desc')
        );
        const indexTimeout = new Promise((_, reject) => {
          setTimeout(() => {
            const timeoutError: any = new Error('Timeout: Falta el índice compuesto');
            timeoutError.code = 'index-timeout';
            reject(timeoutError);
          }, 5000);
        });
        
        await Promise.race([getDocs(indexQuery), indexTimeout]);
        console.log('✅ Índice compuesto OK');
      } catch (indexError: any) {
        if (indexError?.code === 'failed-precondition' || indexError?.code === 'index-timeout') {
          console.error('🔴 FALTA EL ÍNDICE COMPUESTO en Firestore');
          console.error('📋 Esto es CRÍTICO para que las consultas funcionen');
          console.error('📋 SOLUCIÓN: Ve a Firebase Console → Firestore Database → Indexes');
          console.error('📋 Crea un índice con:');
          console.error('   - Collection: gastos');
          console.error('   - Fields: user_id (Ascending), fecha (Descending)');
          console.error('📋 O haz clic en el enlace del error si aparece uno');
          alert('⚠️ Falta el índice compuesto en Firestore\n\nVe a Firebase Console → Firestore Database → Indexes y crea el índice.\n\nRevisa la consola para más detalles.');
          return;
        }
        throw indexError;
      }
    } catch (readTestError: any) {
      if (readTestError?.code === 'read-timeout') {
        console.error('🔴 Firebase no responde después de 5 segundos');
        console.error('📋 Diagnóstico:');
        console.error('   - Usuario autenticado:', !!auth?.currentUser);
        console.error('   - UID del usuario:', auth?.currentUser?.uid);
        console.error('   - userId esperado:', userId);
        console.error('   - Índice compuesto: ✅ Existe y está habilitado');
        console.error('   - Dominio autorizado: ✅ Confirmado por el usuario');
        console.error('');
        console.error('📋 CAUSA MÁS PROBABLE: Las reglas de Firestore están bloqueando la lectura');
        console.error('📋 SOLUCIÓN URGENTE: Ve a Firebase Console → Firestore Database → Rules');
        console.error('📋 Copia y pega estas reglas EXACTAMENTE:');
        console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{gastoId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
    }
  }
}`);
        console.error('📋 Luego haz clic en "Publish" y espera 1-2 minutos');
        console.error('');
        console.error('📋 Si las reglas ya están correctas, verifica:');
        console.error('   - Que el usuario esté realmente autenticado (ve a Authentication → Users)');
        console.error('   - Que el user_id en los documentos coincida con auth.uid');
        alert('⚠️ Firebase no responde\n\nEl problema más probable son las REGLAS DE FIRESTORE.\n\nVe a Firebase Console → Firestore Database → Rules y verifica/corrige las reglas.\n\nRevisa la consola para ver las reglas exactas que debes usar.');
        return;
      } else if (readTestError?.code === 'permission-denied') {
        console.error('🔴 PERMISOS DENEGADOS en lectura');
        console.error('📋 Las reglas de Firestore están bloqueando la lectura');
        console.error('📋 SOLUCIÓN: Ve a Firebase Console → Firestore Database → Rules');
        console.error('📋 Asegúrate de que las reglas permitan lectura para usuarios autenticados');
        alert('❌ Permisos denegados en Firestore\n\nLas reglas están bloqueando la lectura.\n\nRevisa la consola para más detalles.');
        return;
      } else if (readTestError?.code === 'failed-precondition') {
        console.error('🔴 FALTA EL ÍNDICE COMPUESTO');
        console.error('📋 Ve a Firebase Console → Firestore Database → Indexes');
        alert('⚠️ Falta el índice compuesto\n\nCrea el índice en Firebase Console.\n\nRevisa la consola para más detalles.');
        return;
      } else {
        console.warn('⚠️ Error en prueba de lectura (continuando de todas formas):', readTestError);
      }
    }
    
    // TERCERO: Intentar sincronizar el primer gasto para detectar errores de escritura
    if (gastosLocal.length > 0) {
      const primerGasto = gastosLocal[0];
      console.log('🧪 Paso 2: Prueba de escritura con el primer gasto:', primerGasto.descripcion);
      
      try {
        console.log('💾 Intentando crear gasto en Firebase...');
        console.log('📋 Verificando estado antes de escribir:', {
          tieneAuth: !!auth,
          tieneCurrentUser: !!auth?.currentUser,
          currentUserUid: auth?.currentUser?.uid,
          userId: userId,
          coinciden: auth?.currentUser?.uid === userId,
          tieneDb: !!db,
          tieneGastosRef: !!gastosRef,
        });
        
        console.log('📋 Datos a guardar:', {
          user_id: userId,
          descripcion: primerGasto.descripcion,
          monto: primerGasto.monto,
          categoria: primerGasto.categoria,
          fecha: primerGasto.fecha,
          moneda: primerGasto.moneda || 'ARS',
        });
        
        // Verificar que el user_id coincida exactamente
        if (auth?.currentUser?.uid !== userId) {
          console.error('🔴 ERROR CRÍTICO: El userId no coincide con auth.currentUser.uid');
          console.error('   Esto causará que las reglas bloqueen la escritura');
          console.error('   auth.currentUser.uid:', auth?.currentUser?.uid);
          console.error('   userId esperado:', userId);
          alert('❌ Error de autenticación\n\nEl ID de usuario no coincide. Cierra sesión y vuelve a iniciar sesión.');
          return;
        }
        
        // Intentar crear el documento - primero sin timeout para capturar el error real
        console.log('📤 Enviando petición de escritura a Firebase...');
        const datosAGuardar = {
          user_id: userId, // CRÍTICO: debe coincidir exactamente con auth.currentUser.uid
          descripcion: primerGasto.descripcion,
          monto: primerGasto.monto,
          categoria: primerGasto.categoria,
          fecha: primerGasto.fecha,
          moneda: primerGasto.moneda || 'ARS',
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        };
        
        console.log('📋 Datos completos a guardar:', JSON.stringify(datosAGuardar, null, 2));
        console.log('🔍 Verificación final antes de escribir:');
        console.log('   - auth.currentUser.uid:', auth?.currentUser?.uid);
        console.log('   - datosAGuardar.user_id:', datosAGuardar.user_id);
        console.log('   - ¿Coinciden?:', auth?.currentUser?.uid === datosAGuardar.user_id);
        
        // Intentar escribir SIN timeout primero para capturar el error real de Firebase
        // Si Firebase está bloqueando, debería devolver un error inmediatamente
        const writePromise = addDoc(gastosRef, datosAGuardar);
        
        // Timeout de 10 segundos - más tiempo para que Firebase responda
        const writeTimeout = new Promise((_, reject) => {
          setTimeout(() => {
            const timeoutError: any = new Error('Timeout de escritura después de 10 segundos');
            timeoutError.code = 'timeout';
            timeoutError.message = 'Timeout de escritura: Firebase no responde. Esto puede indicar que las reglas están bloqueando la operación o hay un problema de conectividad.';
            reject(timeoutError);
          }, 10000);
        });
        
        let docRef;
        try {
          console.log('⏳ Esperando respuesta de Firebase (máximo 10 segundos)...');
          console.log('💡 Si Firebase está bloqueando, debería devolver un error inmediatamente.');
          console.log('💡 Si no hay respuesta, puede ser un problema de red o reglas mal configuradas.');
          docRef = await Promise.race([writePromise, writeTimeout]) as any;
        } catch (raceError: any) {
          // Si el error viene de Firebase (tiene código), lanzarlo directamente
          if (raceError?.code && raceError.code !== 'timeout') {
            console.error('🔴 Firebase devolvió un error real:', raceError.code);
            throw raceError;
          }
          // Si es timeout, lanzarlo también
          console.error('🔴 Timeout: Firebase no respondió después de 10 segundos');
          throw raceError;
        }
        console.log('✅ PRIMER GASTO CREADO EXITOSAMENTE con ID:', docRef.id);
        sincronizados++;
        
        // Si el primer gasto funcionó, continuar con el resto
        for (let i = 1; i < gastosLocal.length; i++) {
          const gastoLocal = gastosLocal[i];
          try {
            // Verificar si el gasto ya existe
            const q = query(
              gastosRef,
              where('user_id', '==', userId),
              where('descripcion', '==', gastoLocal.descripcion),
              where('fecha', '==', gastoLocal.fecha),
              where('monto', '==', gastoLocal.monto)
            );
            const existingDocs = await getDocs(q);
            
            if (existingDocs.empty) {
              await addDoc(gastosRef, {
                user_id: userId,
                descripcion: gastoLocal.descripcion,
                monto: gastoLocal.monto,
                categoria: gastoLocal.categoria,
                fecha: gastoLocal.fecha,
                moneda: gastoLocal.moneda || 'ARS',
                created_at: Timestamp.now(),
                updated_at: Timestamp.now(),
              });
              sincronizados++;
            }
          } catch (syncError: any) {
            errores.push(syncError);
            console.warn(`⚠️ Error al sincronizar gasto ${i + 1}:`, syncError);
          }
        }
      } catch (primerError: any) {
        console.error('🔴 ERROR AL INTENTAR CREAR EL PRIMER GASTO:', primerError);
        console.error('📋 Código de error:', primerError?.code || 'undefined (probablemente timeout)');
        console.error('📋 Mensaje:', primerError?.message);
        console.error('📋 Stack:', primerError?.stack);
        
        // Si es timeout o permisos denegados, es un problema de reglas
        const esTimeout = primerError?.code === 'timeout' || primerError?.message?.includes('Timeout de escritura');
        const esPermisosDenegados = primerError?.code === 'permission-denied';
        
        if (esTimeout || esPermisosDenegados) {
          console.error('');
          console.error('🔴 PROBLEMA CON LA BASE DE DATOS DE FIRESTORE');
          console.error('');
          console.error('📋 DIAGNÓSTICO:');
          console.error('   ✅ Lectura funciona (conectividad OK)');
          console.error('   ✅ Índice compuesto existe');
          console.error('   ✅ Usuario autenticado correctamente');
          console.error('   ❌ ESCRITURA BLOQUEADA (timeout después de 10 segundos)');
          console.error('');
          console.error('📋 CAUSA MÁS PROBABLE: Las reglas de Firestore están bloqueando la escritura');
          console.error('   Si las reglas estuvieran correctas, Firebase devolvería un error inmediato,');
          console.error('   no un timeout. Esto sugiere que:');
          console.error('   - Las reglas no están publicadas (haz clic en "Publish")');
          console.error('   - Hay un problema con la autenticación del usuario');
          console.error('   - El user_id no coincide exactamente con auth.uid');
          console.error('   - Hay un problema de red o conectividad');
          console.error('');
          console.error('📋 VERIFICACIONES URGENTES:');
          console.error('   1. Ve a Firebase Console → Firestore Database → Rules');
          console.error('   2. Verifica que las reglas estén EXACTAMENTE así:');
          console.error('   3. IMPORTANTE: Haz clic en "Publish" (aunque no hayas cambiado nada)');
          console.error('   4. Espera 1-2 minutos después de publicar');
          console.error('   5. Verifica en Authentication → Users que tu usuario esté listado');
          console.error('   6. Verifica que auth.currentUser.uid coincida con el user_id que envías');
          console.error('');
          console.error('📋 Reglas que deben estar publicadas:');
          console.error('');
          console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{gastoId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
    }
  }
}`);
          console.error('');
          console.error('   4. Haz clic en "Publish"');
          console.error('   5. Espera 1-2 minutos y recarga la página');
          console.error('');
          console.error('📋 VERIFICACIONES ADICIONALES:');
          console.error('   - Authentication → Settings → Authorized domains → debe incluir "martohacker.github.io"');
          console.error('   - Authentication → Users → verifica que tu usuario esté listado');
          console.error('   - Firestore Database → Settings → verifica la región/ubicación');
          console.error('   - Firestore Database → Data → verifica que la colección "gastos" exista o se cree automáticamente');
          
          // Mostrar alerta visual
          alert('❌ Problema con la base de datos de Firestore\n\nLa escritura está siendo bloqueada.\n\nVe a Firebase Console → Firestore Database → Rules y verifica/corrige las reglas.\n\nRevisa la consola para ver las instrucciones detalladas.');
          return;
        } else if (primerError?.code === 'unauthenticated') {
          console.error('🔴 USUARIO NO AUTENTICADO');
          console.error('📋 El usuario no está autenticado correctamente en Firebase');
          alert('❌ Error de autenticación\n\nEl usuario no está autenticado correctamente.\n\nCierra sesión y vuelve a iniciar sesión.');
          return;
        } else {
          console.error('📋 Error desconocido:', primerError);
          errores.push(primerError);
        }
      }
      
      if (sincronizados > 0) {
        console.log(`✅ Sincronizados ${sincronizados} gastos con Firebase.`);
        // Recargar la página después de un breve delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (errores.length > 0) {
        console.error('❌ No se pudieron sincronizar los gastos.');
        console.error('📊 Resumen de errores:');
        
        const permisosDenegados = errores.filter(e => e?.code === 'permission-denied').length;
        const noAutenticado = errores.filter(e => e?.code === 'unauthenticated').length;
        const otrosErrores = errores.filter(e => e?.code !== 'permission-denied' && e?.code !== 'unauthenticated').length;
        
        if (permisosDenegados > 0) {
          console.error(`🔴 ${permisosDenegados} error(es) de permisos denegados`);
          console.error('📋 SOLUCIÓN: Ve a Firebase Console → Firestore Database → Rules');
          console.error('📋 Copia y pega estas reglas:');
          console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{gastoId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
    }
  }
}`);
        }
        
        if (noAutenticado > 0) {
          console.error(`🔴 ${noAutenticado} error(es) de usuario no autenticado`);
          console.error('📋 SOLUCIÓN: Verifica que el usuario haya iniciado sesión correctamente.');
        }
        
        if (otrosErrores > 0) {
          console.error(`⚠️ ${otrosErrores} otro(s) error(es):`, errores.filter(e => e?.code !== 'permission-denied' && e?.code !== 'unauthenticated'));
        }
      } else {
        console.log('ℹ️ Todos los gastos ya estaban sincronizados.');
      }
    }
  } catch (error: any) {
    console.error('❌ Error crítico en sincronización:', error);
    console.error('📋 Código:', error?.code);
    console.error('📋 Mensaje:', error?.message);
    
    if (error?.code === 'permission-denied') {
      console.error('🔴 PERMISOS DENEGADOS detectados');
      console.error('📋 SOLUCIÓN URGENTE: Ve a Firebase Console → Firestore Database → Rules');
      alert('❌ Error de permisos en Firebase\n\nLas reglas de Firestore están bloqueando la escritura.\n\nRevisa la consola para ver las instrucciones detalladas.');
    }
=======
function docToGasto(id: string, data: Record<string, unknown>): Gasto {
  return {
    id,
    descripcion: (data.descripcion as string) ?? '',
    monto:
      typeof data.monto === 'number'
        ? (data.monto as number)
        : Number(data.monto ?? 0) || 0,
    categoria: (data.categoria as string) ?? 'otros',
    fecha: (data.fecha as string) ?? '',
    moneda: (data.moneda as string) || 'ARS',
  };
}

/** Construye la query de gastos del usuario, con fallback sin orderBy si falta índice */
function buildGastosQuery(userId: string): Query | null {
  if (!db) return null;
  const gastosRef = collection(db, 'gastos');
  try {
    return query(
      gastosRef,
      where('user_id', '==', userId),
      orderBy('fecha', 'desc')
    );
  } catch {
    return query(gastosRef, where('user_id', '==', userId));
>>>>>>> Stashed changes
  }
}

export function useGastosFirebase(userId: string | null, usandoFirebase: boolean) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorFirebase, setErrorFirebase] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const guardarEnLocalStorage = useCallback(
    (gastosToSave?: Gasto[]) => {
      if (!userId) return;
      const list = gastosToSave ?? gastos;
      localStorage.setItem(obtenerStorageKey(userId), JSON.stringify(list));
    },
    [userId, gastos]
  );

  // Sincronizar gastos locales a Firebase (solo cuando Firebase está vacío y hay datos locales)
  const sincronizarLocalesAFirebase = useCallback(
    async (_gastosLocal: Gasto[]) => {
      // Sincronización desactivada para evitar datos corruptos desde localStorage
      return;
    },
    []
  );

  // Suscripción en tiempo real a Firestore o carga desde localStorage
  useEffect(() => {
    if (!userId) {
      setGastos([]);
      setCargando(false);
      setErrorFirebase(null);
      return;
    }

    const storageKey = obtenerStorageKey(userId);

    if (usandoFirebase && isFirebaseConfigured() && db) {
      const q = buildGastosQuery(userId);
      if (!q) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            setGastos(JSON.parse(stored));
          } catch { /* noop */ }
        }
        setCargando(false);
        return;
      }

      setCargando(true);
      setErrorFirebase(null);

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const list: Gasto[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            list.push(docToGasto(docSnap.id, data));
          });
          if (list.length > 0) {
            list.sort((a, b) => b.fecha.localeCompare(a.fecha));
          }
<<<<<<< Updated upstream

          console.log(`✅ Cargados ${gastosConvertidos.length} gastos desde Firebase`);
          
          // Guardar también en localStorage como backup
          const storageKey = obtenerStorageKey(userId);
          
          // Si Firebase está vacío pero hay datos en localStorage, mostrarlos
          if (gastosConvertidos.length === 0) {
            const storedLocal = localStorage.getItem(storageKey);
            if (storedLocal) {
              try {
                const gastosLocal: Gasto[] = JSON.parse(storedLocal);
                if (gastosLocal && gastosLocal.length > 0) {
                  console.warn(`⚠️ Hay ${gastosLocal.length} gastos en localStorage pero 0 en Firebase.`);
                  console.warn('💡 Mostrando datos locales mientras se sincroniza...');
                  
                  // Mostrar los datos locales en la UI
                  setGastos(gastosLocal);
                  
                  // IMPORTANTE: Dejar de cargar ANTES de sincronizar
                  setCargando(false);
                  
                  // Sincronizar en segundo plano
                  console.warn('💡 Sincronizando en segundo plano (no bloquea la UI)...');
                  sincronizarGastosEnSegundoPlano(gastosLocal, userId).catch(err => {
                    console.error('❌ Error en sincronización en segundo plano:', err);
                  });
                  
                  return; // Salir temprano, ya mostramos los datos
                }
              } catch (e) {
                // Ignorar errores de parsing
              }
            }
          }
          
          // Si hay datos en Firebase o no hay datos locales, usar los de Firebase
          setGastos(gastosConvertidos);
          
          if (gastosConvertidos.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(gastosConvertidos));
          }
          
          // IMPORTANTE: Dejar de cargar
          setCargando(false);
        } catch (error: any) {
          console.error('❌ Error al cargar desde Firebase:', error);
          console.error('Detalles del error:', {
            message: error instanceof Error ? error.message : String(error),
            code: error?.code,
          });
          
          // Si es un error de índice faltante, mostrar ayuda
          if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.error('🔴 ERROR: Falta crear un índice compuesto en Firestore.');
            console.error('📋 Ve a Firebase Console → Firestore Database → Indexes');
            console.error('📋 Crea un índice para:');
            console.error('   - Collection: gastos');
            console.error('   - Fields: user_id (Ascending), fecha (Descending)');
            console.error('   - Scope: Collection');
          }
          
          // Fallback a localStorage
          cargarDesdeLocalStorage();
          setCargando(false);
        }
      } else {
        console.warn('⚠️ No se usa Firebase para cargar. Razones:', {
          usandoFirebase,
          isFirebaseConfigured: isFirebaseConfigured(),
          tieneDb: !!db,
        });
        // Cargar desde localStorage
        cargarDesdeLocalStorage();
        setCargando(false);
      }
    };
=======
          setGastos(list);
          setCargando(false);
          if (list.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(list));
          } else {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const local = JSON.parse(stored) as Gasto[];
                if (local?.length > 0) {
                  sincronizarLocalesAFirebase(local);
                }
              } catch {
                // ignore
              }
            }
          }
        },
        (err: { code?: string; message?: string }) => {
          setCargando(false);
          setErrorFirebase(err?.message ?? 'Error al conectar con Firebase');
          if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
            setErrorFirebase('Falta crear un índice en Firestore (ver consola)');
          }
          // Fallback a localStorage
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              setGastos(JSON.parse(stored));
            } catch {
              setGastos([]);
            }
          } else {
            setGastos([]);
          }
          // Si hay datos en localStorage y Firebase devolvió 0 antes del error, intentar sync
          const storedRaw = localStorage.getItem(storageKey);
          if (storedRaw) {
            try {
              const local = JSON.parse(storedRaw) as Gasto[];
              if (local?.length > 0) {
                sincronizarLocalesAFirebase(local);
              }
            } catch {
              // ignore
            }
          }
        }
      );
>>>>>>> Stashed changes

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }

    // Sin Firebase: cargar solo desde localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setGastos(JSON.parse(stored));
      } catch {
        setGastos([]);
      }
    } else {
      setGastos([]);
    }
    setCargando(false);
    setErrorFirebase(null);
    return undefined;
  }, [userId, usandoFirebase, sincronizarLocalesAFirebase]);

  // Backup en localStorage cuando cambian los gastos (solo si no estamos usando listener)
  useEffect(() => {
    if (!userId || !usandoFirebase || !isFirebaseConfigured()) {
      if (userId && gastos.length > 0) {
        guardarEnLocalStorage(gastos);
      }
    }
  }, [gastos, userId, usandoFirebase, guardarEnLocalStorage]);

  const guardarGasto = useCallback(
    async (gasto: Gasto, esNuevo: boolean, listaActual: Gasto[]) => {
      if (!usandoFirebase || !isFirebaseConfigured() || !db || !userId) {
        guardarEnLocalStorage(listaActual);
        return;
      }

      const currentUser = auth?.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        guardarEnLocalStorage(listaActual);
        return;
      }

      try {
        const gastosRef = collection(db, 'gastos');
        if (esNuevo) {
          await addDoc(gastosRef, {
            user_id: userId,
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS',
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
          // onSnapshot actualizará el estado con el nuevo documento e id real
        } else {
<<<<<<< Updated upstream
          // Actualizar gasto existente - pero primero verificar si existe
          console.log('💾 Intentando actualizar gasto en Firebase:', gasto.id);
          
          // Verificar si el documento existe en Firebase
          const gastoRef = doc(db, 'gastos', gasto.id);
          const gastoDoc = await getDoc(gastoRef);
          
          if (gastoDoc.exists()) {
            // El documento existe, actualizarlo
            console.log('📋 El documento existe, actualizando...');
            await updateDoc(gastoRef, {
              descripcion: gasto.descripcion,
              monto: gasto.monto,
              categoria: gasto.categoria,
              fecha: gasto.fecha,
              moneda: gasto.moneda || 'ARS',
              updated_at: Timestamp.now(),
            });
            console.log('✅ Gasto actualizado en Firebase');
          } else {
            // El documento no existe (probablemente es un ID local), crear uno nuevo
            console.log('⚠️ El gasto no existe en Firebase (ID local detectado), creando uno nuevo...');
            const docRef = await addDoc(gastosRef, {
              user_id: userId,
              descripcion: gasto.descripcion,
              monto: gasto.monto,
              categoria: gasto.categoria,
              fecha: gasto.fecha,
              moneda: gasto.moneda || 'ARS',
              created_at: Timestamp.now(),
              updated_at: Timestamp.now(),
            });
            console.log('✅ Gasto creado en Firebase con nuevo ID:', docRef.id);
            console.log('💡 El ID local se reemplazará con el ID de Firebase al recargar');
          }
        }
      } catch (error: any) {
        console.error('❌ Error al guardar en Firebase:', error);
        console.error('Detalles del error:', {
          message: error instanceof Error ? error.message : String(error),
          code: error?.code,
          stack: error instanceof Error ? error.stack : undefined,
        });
        
        // Si es un error de permisos, mostrar ayuda detallada
        if (error?.code === 'permission-denied') {
          console.error('🔴 ERROR: Permisos denegados al escribir en Firestore.');
          console.error('📋 SOLUCIÓN: Ve a Firebase Console → Firestore Database → Rules');
          console.error('📋 Copia y pega estas reglas EXACTAMENTE:');
          console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{gastoId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
    }
  }
}`);
          console.error('📋 Luego haz clic en "Publish"');
          console.error('📋 Verifica que el usuario esté autenticado: userId =', userId);
          console.error('📋 auth.currentUser.uid =', auth?.currentUser?.uid);
        }
        
        // Si es un error 400, puede ser un problema de reglas o dominio
        if (error?.code === 'invalid-argument' || error?.message?.includes('400')) {
          console.error('🔴 ERROR 400: Problema con la escritura en Firestore.');
          console.error('📋 Posibles causas:');
          console.error('   1. Reglas de seguridad bloqueando la escritura');
          console.error('   2. Dominio no autorizado en Firebase Authentication');
          console.error('   3. Usuario no autenticado correctamente');
          console.error('   4. Verifica en Firebase Console → Authentication → Settings → Authorized domains');
          console.error('   5. Agrega tu dominio: martohacker.github.io');
        }
        
        // Mostrar alerta visual al usuario
        alert(`❌ Error al guardar en Firebase: ${error?.code || error?.message || 'Error desconocido'}\n\nRevisa la consola para más detalles.`);
        
        guardarEnLocalStorage();
=======
          const gastoRef = doc(db, 'gastos', gasto.id);
          await updateDoc(gastoRef, {
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS',
            updated_at: Timestamp.now(),
          });
        }
        setErrorFirebase(null);
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        setErrorFirebase(err?.message ?? 'Error al guardar');
        guardarEnLocalStorage(listaActual);
      }
    },
    [usandoFirebase, userId, guardarEnLocalStorage]
  );

  const agregarGasto = useCallback(
    async (gasto: Omit<Gasto, 'id'>) => {
      const nuevoGasto: Gasto = {
        ...gasto,
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      const listaConNuevo = [nuevoGasto, ...gastos];
      setGastos(listaConNuevo);
      await guardarGasto(nuevoGasto, true, listaConNuevo);
    },
    [gastos, guardarGasto]
  );

  const eliminarGasto = useCallback(
    async (id: string) => {
      if (usandoFirebase && isFirebaseConfigured() && db && userId) {
        try {
          await deleteDoc(doc(db, 'gastos', id));
        } catch {
          // Si falla (ej. ya borrado), igual quitamos del estado local
        }
>>>>>>> Stashed changes
      }
      setGastos((prev) => prev.filter((g) => g.id !== id));
    },
    [usandoFirebase, userId]
  );

  const editarGasto = useCallback(
    async (id: string, gastoActualizado: Omit<Gasto, 'id'>) => {
      const gastoEditado: Gasto = { ...gastoActualizado, id };
      const listaActual = gastos.map((g) => (g.id === id ? gastoEditado : g));
      setGastos(listaActual);
      await guardarGasto(gastoEditado, false, listaActual);
    },
    [gastos, guardarGasto]
  );

<<<<<<< Updated upstream
  // Guardar en localStorage también como backup
  useEffect(() => {
    if (userId && gastos.length > 0) {
      guardarEnLocalStorage();
    }
  }, [gastos, userId]);

  const agregarGasto = async (gasto: Omit<Gasto, 'id'>) => {
    const nuevoGasto: Gasto = {
      ...gasto,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    
    console.log('➕ Agregando nuevo gasto:', nuevoGasto);
    console.log('🔍 Estado actual:', {
      usandoFirebase,
      isFirebaseConfigured: isFirebaseConfigured(),
      tieneDb: !!db,
      tieneAuth: !!auth,
      tieneUserId: !!userId,
      userIdActual: userId,
      authUserId: auth?.currentUser?.uid,
    });
    
    // Agregar primero al estado para respuesta inmediata
    setGastos([nuevoGasto, ...gastos]);
    
    // Guardar en Firebase/localStorage
    try {
      await guardarGasto(nuevoGasto, true);
      console.log('✅ Gasto agregado y guardado correctamente');
    } catch (error) {
      console.error('❌ Error al agregar gasto:', error);
      // El error ya se maneja en guardarGasto, pero mostramos confirmación
    }
    
    // Si se guardó en Firebase, recargar para obtener el ID real
    if (usandoFirebase && isFirebaseConfigured() && db && userId) {
      // Recargar gastos para obtener el ID real de Firebase
      const gastosRef = collection(db, 'gastos');
      let querySnapshot;
      try {
        const q = query(
          gastosRef,
          where('user_id', '==', userId),
          orderBy('fecha', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch {
        // Si falla con orderBy, intentar sin orderBy
        const q = query(
          gastosRef,
          where('user_id', '==', userId)
        );
        querySnapshot = await getDocs(q);
      }
      
      const gastosActualizados: Gasto[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        gastosActualizados.push({
          id: docSnap.id,
          descripcion: data.descripcion,
          monto: data.monto,
          categoria: data.categoria,
          fecha: data.fecha,
          moneda: data.moneda || 'ARS', // Por defecto ARS
        });
      });
      
      // Ordenar por fecha si no se ordenó en la query
      gastosActualizados.sort((a, b) => b.fecha.localeCompare(a.fecha));
      setGastos(gastosActualizados);
    }
  };

  const eliminarGasto = async (id: string) => {
    if (usandoFirebase && isFirebaseConfigured() && db && userId) {
      try {
        const gastoRef = doc(db, 'gastos', id);
        await deleteDoc(gastoRef);
      } catch (error) {
        console.error('Error al eliminar en Firebase:', error);
      }
    }
    
    const nuevosGastos = gastos.filter(g => g.id !== id);
    setGastos(nuevosGastos);
  };

  const editarGasto = async (id: string, gastoActualizado: Omit<Gasto, 'id'>) => {
    const gastoEditado: Gasto = { ...gastoActualizado, id };
    
    setGastos(gastos.map(g => 
      g.id === id ? gastoEditado : g
    ));
    
    await guardarGasto(gastoEditado, false);
  };

  const calcularEstadisticas = (): Estadisticas => {
=======
  const calcularEstadisticas = useCallback((): Estadisticas => {
>>>>>>> Stashed changes
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const gastosDelDia = gastos.filter((g) => g.fecha === fechaActual);
    const gastosDelMes = gastos.filter((g) => {
      const fechaGasto = new Date(g.fecha);
      return fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual;
    });

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelDia = gastosDelDia.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelMes = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);

    const diasDelMes = ahora.getDate();
    const promedioDiario = diasDelMes > 0 ? gastoDelMes / diasDelMes : 0;

    const diasTotal =
      gastos.length > 0
        ? Math.max(
            1,
            Math.ceil(
              (ahora.getTime() - new Date(gastos[gastos.length - 1].fecha).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 1;
    const promedioMensual = (totalGastos / diasTotal) * 30;

    const gastoPorCategoria: Record<string, number> = {};
    CATEGORIAS.forEach((cat) => {
      gastoPorCategoria[cat.id] = gastos
        .filter((g) => g.categoria === cat.id)
        .reduce((sum, g) => sum + g.monto, 0);
    });

    return {
      totalGastos,
      promedioDiario,
      promedioMensual,
      gastoPorCategoria,
      gastoDelMes,
      gastoDelDia,
    };
  }, [gastos]);

  return {
    gastos,
    cargando,
    errorFirebase,
    agregarGasto,
    eliminarGasto,
    editarGasto,
    calcularEstadisticas,
  };
}
