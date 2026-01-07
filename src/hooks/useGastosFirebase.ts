import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
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
    return;
  }

  // Timeout de seguridad: máximo 10 segundos para sincronizar
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout de sincronización')), 10000);
  });

  const syncPromise = (async () => {
    try {
      const gastosRef = collection(db, 'gastos');
      let sincronizados = 0;
      const errores: any[] = [];
      
      for (const gastoLocal of gastosLocal) {
        try {
          // Verificar si el gasto ya existe en Firebase
          const q = query(
            gastosRef,
            where('user_id', '==', userId),
            where('descripcion', '==', gastoLocal.descripcion),
            where('fecha', '==', gastoLocal.fecha),
            where('monto', '==', gastoLocal.monto)
          );
          const existingDocs = await getDocs(q);
          
          if (existingDocs.empty) {
            // No existe, crear nuevo
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
          console.warn('⚠️ Error al sincronizar un gasto:', syncError);
          
          // Mostrar detalles específicos del error
          if (syncError?.code === 'permission-denied') {
            console.error('🔴 PERMISOS DENEGADOS: Las reglas de Firestore están bloqueando la escritura.');
            console.error('📋 Solución: Ve a Firebase Console → Firestore Database → Rules');
            console.error('📋 Asegúrate de que las reglas permitan create con:');
            console.error('   allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;');
          } else if (syncError?.code === 'unauthenticated') {
            console.error('🔴 USUARIO NO AUTENTICADO: El usuario no está autenticado correctamente.');
            console.error('📋 Verifica que el usuario haya iniciado sesión.');
          } else if (syncError?.code === 'invalid-argument') {
            console.error('🔴 ARGUMENTO INVÁLIDO: Problema con los datos enviados.');
            console.error('📋 Verifica que todos los campos sean válidos.');
          } else {
            console.error('📋 Código de error:', syncError?.code);
            console.error('📋 Mensaje:', syncError?.message);
          }
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
    } catch (syncError) {
      console.error('❌ Error al sincronizar gastos:', syncError);
      throw syncError;
    }
  })();

  // Ejecutar con timeout
  try {
    await Promise.race([syncPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout de sincronización') {
      console.warn('⏱️ Timeout: La sincronización tardó demasiado. Continuando sin sincronizar.');
    } else {
      throw error;
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
          // Actualizar gasto existente
          console.log('💾 Actualizando gasto en Firebase:', gasto.id);
          const gastoRef = doc(db, 'gastos', gasto.id);
          await updateDoc(gastoRef, {
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS', // Por defecto ARS
            updated_at: Timestamp.now(),
          });
          console.log('✅ Gasto actualizado en Firebase');
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

