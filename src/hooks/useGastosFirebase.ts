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
  doc,
  Timestamp
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../services/firebase';
import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';

const obtenerStorageKey = (userId: string | null) => 
  userId ? `finanzapp-gastos-${userId}` : 'finanzapp-gastos-temp';

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
    
    // PRIMERO: Verificar conectividad y permisos de lectura (más rápido)
    console.log('🔍 Paso 1: Verificando conectividad con Firebase...');
    try {
      const testQuery = query(
        gastosRef,
        where('user_id', '==', userId),
        orderBy('fecha', 'desc')
      );
      const testTimeout = new Promise((_, reject) => {
        setTimeout(() => {
          const timeoutError: any = new Error('Timeout de lectura: Firebase no responde');
          timeoutError.code = 'read-timeout';
          reject(timeoutError);
        }, 5000);
      });
      
      await Promise.race([getDocs(testQuery), testTimeout]);
      console.log('✅ Firebase responde correctamente (lectura OK)');
    } catch (readTestError: any) {
      if (readTestError?.code === 'read-timeout') {
        console.error('🔴 Firebase no responde después de 5 segundos');
        console.error('📋 Posibles causas:');
        console.error('   1. Problema de conexión a internet');
        console.error('   2. Firebase está caído (poco probable)');
        console.error('   3. El dominio no está autorizado en Firebase Authentication');
        console.error('📋 SOLUCIÓN: Ve a Firebase Console → Authentication → Settings → Authorized domains');
        console.error('📋 Agrega: martohacker.github.io');
        alert('⚠️ Firebase no responde\n\nVerifica tu conexión a internet y que el dominio esté autorizado en Firebase.\n\nRevisa la consola para más detalles.');
        return;
      } else if (readTestError?.code === 'permission-denied') {
        console.error('🔴 PERMISOS DENEGADOS en lectura');
        console.error('📋 Las reglas de Firestore están bloqueando incluso la lectura');
      } else {
        console.warn('⚠️ Error en prueba de lectura (continuando de todas formas):', readTestError);
      }
    }
    
    // SEGUNDO: Intentar sincronizar el primer gasto para detectar errores de escritura
    if (gastosLocal.length > 0) {
      const primerGasto = gastosLocal[0];
      console.log('🧪 Paso 2: Prueba de escritura con el primer gasto:', primerGasto.descripcion);
      
      try {
        console.log('💾 Intentando crear gasto en Firebase...');
        console.log('📋 Datos a guardar:', {
          user_id: userId,
          descripcion: primerGasto.descripcion,
          monto: primerGasto.monto,
          categoria: primerGasto.categoria,
          fecha: primerGasto.fecha,
        });
        
        // Intentar crear el documento con timeout para detectar problemas rápidamente
        const writePromise = addDoc(gastosRef, {
          user_id: userId,
          descripcion: primerGasto.descripcion,
          monto: primerGasto.monto,
          categoria: primerGasto.categoria,
          fecha: primerGasto.fecha,
          moneda: primerGasto.moneda || 'ARS',
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });
        
        // Timeout de 8 segundos - suficiente para que Firebase devuelva el error real
        const writeTimeout = new Promise((_, reject) => {
          setTimeout(() => {
            const timeoutError: any = new Error('Timeout de escritura después de 8 segundos');
            timeoutError.code = 'timeout';
            timeoutError.message = 'Timeout de escritura: Las reglas de Firestore probablemente están bloqueando la operación. Si ves este mensaje, las reglas de Firestore necesitan ser configuradas.';
            reject(timeoutError);
          }, 8000);
        });
        
        let docRef;
        try {
          docRef = await Promise.race([writePromise, writeTimeout]) as any;
        } catch (raceError: any) {
          // Si el error viene de Firebase (tiene código), lanzarlo directamente
          if (raceError?.code && raceError.code !== 'timeout') {
            throw raceError;
          }
          // Si es timeout, lanzarlo también
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
          console.error('🔴 PERMISOS DENEGADOS: Las reglas de Firestore están bloqueando la escritura.');
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
          console.error('📋 Luego haz clic en "Publish"');
          console.error('📋 También verifica:');
          console.error('   - Authentication → Settings → Authorized domains → agrega "martohacker.github.io"');
          console.error('   - Authentication → Users → verifica que tu usuario esté listado');
          
          // Mostrar alerta visual
          alert('❌ Error de permisos en Firebase\n\nLas reglas de Firestore están bloqueando la escritura.\n\nRevisa la consola para ver las instrucciones detalladas.');
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
  }
}

export function useGastosFirebase(userId: string | null, usandoFirebase: boolean) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar gastos desde Firebase o localStorage
  useEffect(() => {
    if (!userId) {
      setGastos([]);
      setCargando(false);
      return;
    }

    const cargarGastos = async () => {
      setCargando(true);
      
      if (usandoFirebase && isFirebaseConfigured() && db) {
        // Cargar desde Firebase
        console.log('📥 Intentando cargar gastos desde Firebase para userId:', userId);
        try {
          const gastosRef = collection(db, 'gastos');
          
          // Intentar primero con orderBy (requiere índice compuesto)
          let querySnapshot;
          try {
            const q = query(
              gastosRef,
              where('user_id', '==', userId),
              orderBy('fecha', 'desc')
            );
            querySnapshot = await getDocs(q);
            console.log('✅ Query con orderBy exitosa');
          } catch (orderByError: any) {
            // Si falla con orderBy, intentar sin orderBy y ordenar en el cliente
            console.warn('⚠️ Query con orderBy falló, intentando sin orderBy:', orderByError?.code);
            const q = query(
              gastosRef,
              where('user_id', '==', userId)
            );
            querySnapshot = await getDocs(q);
            console.log('✅ Query sin orderBy exitosa (ordenando en cliente)');
          }

          const gastosConvertidos: Gasto[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            gastosConvertidos.push({
              id: docSnap.id,
              descripcion: data.descripcion,
              monto: data.monto,
              categoria: data.categoria,
              fecha: data.fecha,
              moneda: data.moneda || 'ARS', // Por defecto ARS si no existe
            });
          });

          // Ordenar por fecha descendente si no se ordenó en la query
          if (gastosConvertidos.length > 0) {
            gastosConvertidos.sort((a, b) => {
              // Comparar fechas en formato ISO (YYYY-MM-DD)
              return b.fecha.localeCompare(a.fecha);
            });
          }

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

    const cargarDesdeLocalStorage = () => {
      const storageKey = obtenerStorageKey(userId);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setGastos(JSON.parse(stored));
        } catch (error) {
          console.error('Error al cargar gastos:', error);
          setGastos([]);
        }
      } else {
        setGastos([]);
      }
    };

    cargarGastos();
  }, [userId, usandoFirebase]);

  // Guardar en Firebase cuando cambien
  const guardarGasto = async (gasto: Gasto, esNuevo: boolean) => {
    console.log('🔍 guardarGasto llamado:', {
      usandoFirebase,
      isFirebaseConfigured: isFirebaseConfigured(),
      tieneDb: !!db,
      tieneUserId: !!userId,
      esNuevo,
    });

    if (usandoFirebase && isFirebaseConfigured() && db && userId) {
      try {
        // Verificar autenticación antes de escribir
        if (auth) {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.error('❌ No hay usuario autenticado en Firebase');
            console.error('💡 El usuario debe estar autenticado para escribir en Firestore');
            guardarEnLocalStorage();
            return;
          }
          if (currentUser.uid !== userId) {
            console.error('❌ El userId no coincide con el usuario autenticado');
            console.error('   userId proporcionado:', userId);
            console.error('   auth.currentUser.uid:', currentUser.uid);
            guardarEnLocalStorage();
            return;
          }
          console.log('✅ Usuario autenticado correctamente:', {
            uid: currentUser.uid,
            email: currentUser.email,
          });
        }
        
        const gastosRef = collection(db, 'gastos');
        
        if (esNuevo) {
          // Insertar nuevo gasto
          console.log('💾 Guardando nuevo gasto en Firebase:', {
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS',
            userId: userId,
          });
          const docRef = await addDoc(gastosRef, {
            user_id: userId,
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS', // Por defecto ARS
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
          console.log('✅ Gasto guardado en Firebase con ID:', docRef.id);
          console.log('📋 Verifica en Firebase Console → Firestore → Data → gastos que el documento se haya creado correctamente.');
        } else {
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
      }
    } else {
      console.warn('⚠️ No se usa Firebase. Razones:', {
        usandoFirebase,
        isFirebaseConfigured: isFirebaseConfigured(),
        tieneDb: !!db,
        tieneUserId: !!userId,
      });
      guardarEnLocalStorage();
    }
  };

  const guardarEnLocalStorage = () => {
    if (userId) {
      const storageKey = obtenerStorageKey(userId);
      localStorage.setItem(storageKey, JSON.stringify(gastos));
    }
  };

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
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const gastosDelDia = gastos.filter(g => g.fecha === fechaActual);
    const gastosDelMes = gastos.filter(g => {
      const fechaGasto = new Date(g.fecha);
      return fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual;
    });

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelDia = gastosDelDia.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelMes = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);

    const diasDelMes = ahora.getDate();
    const promedioDiario = diasDelMes > 0 ? gastoDelMes / diasDelMes : 0;

    const diasTotal = gastos.length > 0 
      ? Math.max(1, Math.ceil((ahora.getTime() - new Date(gastos[gastos.length - 1].fecha).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const promedioMensual = (totalGastos / diasTotal) * 30;

    const gastoPorCategoria: Record<string, number> = {};
    CATEGORIAS.forEach(cat => {
      gastoPorCategoria[cat.id] = gastos
        .filter(g => g.categoria === cat.id)
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
  };

  return {
    gastos,
    cargando,
    agregarGasto,
    eliminarGasto,
    editarGasto,
    calcularEstadisticas,
  };
}

