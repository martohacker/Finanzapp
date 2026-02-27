import { useState, useMemo } from 'react';
import { useGastosFirebase } from './hooks/useGastosFirebase';
import { useMoneda } from './hooks/useMoneda';
import { useAuthFirebase } from './hooks/useAuthFirebase';
import { useIngresosFirebase } from './hooks/useIngresosFirebase';
import { useMetasAhorro } from './hooks/useMetasAhorro';
import { usePresupuestoCategoria } from './hooks/usePresupuestoCategoria';
import { GastoForm } from './components/GastoForm';
import { GastoList } from './components/GastoList';
import { GastosChart } from './components/GastosChart';
import { Estadisticas } from './components/Estadisticas';
import { ResumenConversion } from './components/ResumenConversion';
import { SelectorMoneda } from './components/SelectorMoneda';
import { BannerInstalacion } from './components/BannerInstalacion';
import { Login } from './components/Login';
import { ExportarDatos } from './components/ExportarDatos';
import { PresupuestoMensualCard } from './components/PresupuestoMensualCard';
import { GastosFijosSection } from './components/GastosFijosSection';
import { AgregarRapidoGasto } from './components/AgregarRapidoGasto';
import { Recordatorios } from './components/Recordatorios';
import { BalanceCard } from './components/BalanceCard';
import { FiltrosGastos, emptyFiltros, type FiltrosGastosState } from './components/FiltrosGastos';
import { MetasAhorroSection } from './components/MetasAhorroSection';
import { SelectorPeriodo } from './components/SelectorPeriodo';
import { PresupuestoCategoriaSection } from './components/PresupuestoCategoriaSection';
import { Onboarding } from './components/Onboarding';
import { Wallet, LogOut, User, Home, FileText, WalletCards, Database, Moon, Sun } from 'lucide-react';
import { useEstadisticasConvertidas } from './hooks/useEstadisticasEnPesos';
import { usePresupuestoMensual } from './hooks/usePresupuestoMensual';
import { useTheme } from './contexts/ThemeContext';
import {
  filtrarGastosPorPeriodo,
  calcularEstadisticasFromGastos,
  type PeriodoFiltro,
} from './utils/estadisticas';
import { Gasto } from './types';

function App() {
  const [seccionActiva, setSeccionActiva] = useState<'resumen' | 'gastos' | 'presupuesto' | 'datos'>('resumen');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [filtrosGastos, setFiltrosGastos] = useState<FiltrosGastosState>(emptyFiltros());

  const { theme, toggleTheme } = useTheme();
  const { usuarioActual, cargando: cargandoAuth, registrar, login, cerrarSesion, usandoFirebase } = useAuthFirebase();
  const { gastos, cargando: cargandoGastos, errorFirebase, agregarGasto, eliminarGasto, editarGasto } = useGastosFirebase(usuarioActual?.id || null, usandoFirebase);
  const { ingresos, cargando: cargandoIngresos, agregarIngreso, eliminarIngreso } = useIngresosFirebase(usuarioActual?.id || null, usandoFirebase);
  const { metas, cargando: cargandoMetas, agregarMeta, actualizarMontoActual, eliminarMeta } = useMetasAhorro(usuarioActual?.id || null, usandoFirebase);
  const { presupuestosPorCategoria, guardarOActualizar: guardarLimiteCategoria, eliminarPorCategoria: quitarLimiteCategoria } = usePresupuestoCategoria(usuarioActual?.id || null, usandoFirebase);

  const { moneda, cambiarMoneda, obtenerMoneda } = useMoneda(usuarioActual?.id || null);
  const monedaActual = obtenerMoneda();

  const gastosEnPeriodo = useMemo(() => filtrarGastosPorPeriodo(gastos, periodo), [gastos, periodo]);
  const gastosMesActual = useMemo(() => filtrarGastosPorPeriodo(gastos, 'mes'), [gastos]);
  const { estadisticasConvertidas, cargandoConvertidas } = useEstadisticasConvertidas(
    gastosEnPeriodo,
    monedaActual.codigo
  );
  const { estadisticasConvertidas: estadisticasMesConvertidas } = useEstadisticasConvertidas(
    gastosMesActual,
    monedaActual.codigo
  );
  const estadisticasPeriodo = useMemo(() => calcularEstadisticasFromGastos(gastosEnPeriodo), [gastosEnPeriodo]);
  const estadisticasMostrar = estadisticasConvertidas || estadisticasPeriodo;
  const gastoPorCategoriaMes = estadisticasMesConvertidas?.gastoPorCategoria ?? {};

  const aplicarFiltros = (lista: Gasto[], f: FiltrosGastosState): Gasto[] =>
    lista.filter((g) => {
      if (f.texto && !g.descripcion.toLowerCase().includes(f.texto.toLowerCase())) return false;
      if (f.categoria && g.categoria !== f.categoria) return false;
      if (f.fechaDesde && g.fecha < f.fechaDesde) return false;
      if (f.fechaHasta && g.fecha > f.fechaHasta) return false;
      const m = g.monto;
      if (f.montoMin && m < parseFloat(f.montoMin)) return false;
      if (f.montoMax && m > parseFloat(f.montoMax)) return false;
      return true;
    });

  const gastosFiltrados = useMemo(() => aplicarFiltros(gastos, filtrosGastos), [gastos, filtrosGastos]);

  const totalIngresosMes = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return ingresos
      .filter((i) => {
        const [iy, im] = i.fecha.split('-');
        return iy === String(y) && im === m && i.moneda === monedaActual.codigo;
      })
      .reduce((s, i) => s + i.monto, 0);
  }, [ingresos, monedaActual.codigo]);

  const {
    presupuesto,
    gastosFijos,
    cargando: cargandoPresupuesto,
    actualizarMontoPresupuesto,
    agregarGastoFijo,
    eliminarGastoFijo,
    totalGastadoConvertido,
    restanteConvertido,
    porcentajeUsado,
  } = usePresupuestoMensual({
    userId: usuarioActual?.id || null,
    monedaDestino: monedaActual.codigo,
    gastos,
  });

  // Mostrar pantalla de carga solo mientras se verifica la sesión (Firebase Auth o localStorage).
  // El resto (gastos, ingresos, metas, presupuesto, conversión) se cargan en segundo plano
  // para que la app sea usable antes y no dependa del más lento (p. ej. API de cotizaciones).
  if (cargandoAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">Cargando...</p>
        </div>
      </div>
    );
  }

  const cargandoDatos = cargandoGastos || cargandoConvertidas || cargandoPresupuesto || cargandoIngresos || cargandoMetas;

  // Si no hay usuario, mostrar pantalla de login
  if (!usuarioActual) {
    return <Login onLogin={login} onRegistrar={registrar} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 pb-24">
      <Onboarding onCerrar={() => {}} />

      <div className="container mx-auto px-4 pt-8 pb-4 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 sm:p-3 rounded-lg">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-100">FinanzApp</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">Control total de tus finanzas personales</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-700 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
                <User size={18} className="text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{usuarioActual.nombre}</span>
              </div>
              <SelectorMoneda monedaActual={moneda} onCambiarMoneda={cambiarMoneda} />
              <button
                onClick={cerrarSesion}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-200 dark:border-red-800/50"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Indicador suave mientras cargan gastos/ingresos/etc. (no bloquea la vista) */}
        {cargandoDatos && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />
            <span>Actualizando datos...</span>
          </div>
        )}

        {/* Banner de instalación (iOS) */}
        <BannerInstalacion />

        {/* Aviso si hay error de conexión */}
        {errorFirebase && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
            ⚠️ Error de conexión. Los datos se guardan en este dispositivo.
          </div>
        )}

        {/* Recordatorios: presupuesto y vencimientos */}
        <Recordatorios
          presupuestoMonto={presupuesto?.monto ?? 0}
          porcentajeUsado={porcentajeUsado}
          restante={restanteConvertido}
          gastosFijos={gastosFijos}
          moneda={monedaActual}
        />

        {/* Navegación principal estilo pill (barra inferior translúcida) */}
        <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center z-40">
          <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-800/95 backdrop-blur border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 px-2 py-1 shadow-lg">
            {[
              { id: 'resumen', label: 'Inicio', icon: Home },
              { id: 'gastos', label: 'Gastos', icon: FileText },
              { id: 'presupuesto', label: 'Presupuesto', icon: WalletCards },
              // Solo mostramos "Datos" cuando no se usa Firebase (modo local)
              ...(!usandoFirebase ? [{ id: 'datos', label: 'Datos', icon: Database }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const activo = seccionActiva === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSeccionActiva(tab.id as typeof seccionActiva)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    activo
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-transparent text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sección: Resumen */}
        {seccionActiva === 'resumen' && (
          <>
            <div className="mb-4">
              <SelectorPeriodo periodo={periodo} onChange={setPeriodo} />
            </div>
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <Estadisticas estadisticas={estadisticasMostrar} moneda={monedaActual} />
              </div>
              <div className="lg:col-span-1 space-y-4">
                <BalanceCard
                  totalIngresosMes={totalIngresosMes}
                  gastoDelMes={estadisticasMostrar.gastoDelMes}
                  ingresos={ingresos}
                  moneda={monedaActual}
                  onAgregarIngreso={agregarIngreso}
                  onEliminarIngreso={eliminarIngreso}
                />
                <PresupuestoMensualCard
                  presupuesto={presupuesto}
                  totalGastado={totalGastadoConvertido}
                  restante={restanteConvertido}
                  porcentajeUsado={porcentajeUsado}
                  moneda={monedaActual}
                  onActualizarPresupuesto={actualizarMontoPresupuesto}
                />
              </div>
            </div>

            <div className="mb-8">
              <MetasAhorroSection
                metas={metas}
                moneda={monedaActual}
                onAgregarMeta={agregarMeta}
                onActualizarMonto={actualizarMontoActual}
                onEliminar={eliminarMeta}
              />
            </div>

            {gastosEnPeriodo.length > 0 && monedaActual.codigo !== 'ARS' && (
              <div className="mb-8">
                <ResumenConversion 
                  estadisticas={estadisticasMostrar} 
                  monedaActual={monedaActual} 
                  gastos={gastosEnPeriodo}
                />
              </div>
            )}

            <div className="mb-8">
              <GastosChart estadisticas={estadisticasMostrar} moneda={monedaActual} />
            </div>
          </>
        )}

        {/* Sección: Gastos */}
        {seccionActiva === 'gastos' && (
          <div className="space-y-6">
            <FiltrosGastos
              filtros={filtrosGastos}
              onChange={setFiltrosGastos}
              onClear={() => setFiltrosGastos(emptyFiltros())}
              resultadosCount={gastosFiltrados.length}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <GastoForm onAgregarGasto={agregarGasto} monedaActual={monedaActual.codigo} />
              </div>
              <div className="lg:col-span-2">
                <GastoList 
                  gastos={gastosFiltrados} 
                  onEliminarGasto={eliminarGasto} 
                  onEditarGasto={editarGasto}
                  onRepetirGasto={agregarGasto}
                  moneda={monedaActual} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Sección: Presupuesto y fijos */}
        {seccionActiva === 'presupuesto' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <PresupuestoMensualCard
                presupuesto={presupuesto}
                totalGastado={totalGastadoConvertido}
                restante={restanteConvertido}
                porcentajeUsado={porcentajeUsado}
                moneda={monedaActual}
                onActualizarPresupuesto={actualizarMontoPresupuesto}
              />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <PresupuestoCategoriaSection
                presupuestosPorCategoria={presupuestosPorCategoria}
                gastoPorCategoria={gastoPorCategoriaMes}
                moneda={monedaActual}
                onGuardarLimite={(catId, monto) => guardarLimiteCategoria(catId, monto, monedaActual.codigo)}
                onQuitarLimite={quitarLimiteCategoria}
              />
              <GastosFijosSection
                gastosFijos={gastosFijos}
                moneda={monedaActual}
                onAgregar={(g) =>
                  agregarGastoFijo({
                    descripcion: g.descripcion,
                    monto: g.monto,
                    categoria: g.categoria,
                    moneda: monedaActual.codigo,
                    diaVencimiento: g.diaVencimiento,
                  })
                }
                onEliminar={eliminarGastoFijo}
              />
            </div>
          </div>
        )}

        {/* Sección: Exportar / Importar */}
        {seccionActiva === 'datos' && !usandoFirebase && (
          <div className="mt-4">
            <ExportarDatos 
              gastos={gastos} 
              usuarioId={usuarioActual.id}
              usuarioNombre={usuarioActual.nombre}
            />
          </div>
        )}
      </div>

      {/* Botón flotante agregar gasto rápido */}
      <AgregarRapidoGasto onAgregarGasto={agregarGasto} monedaActual={monedaActual.codigo} />
    </div>
  );
}

export default App;
