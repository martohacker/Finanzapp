import { useGastosFirebase } from './hooks/useGastosFirebase';
import { useMoneda } from './hooks/useMoneda';
import { useAuthFirebase } from './hooks/useAuthFirebase';
import { GastoForm } from './components/GastoForm';
import { GastoList } from './components/GastoList';
import { GastosChart } from './components/GastosChart';
import { Estadisticas } from './components/Estadisticas';
import { ResumenConversion } from './components/ResumenConversion';
import { SelectorMoneda } from './components/SelectorMoneda';
import { BannerInstalacion } from './components/BannerInstalacion';
import { Login } from './components/Login';
import { ExportarDatos } from './components/ExportarDatos';
import { Wallet, LogOut, User } from 'lucide-react';

function App() {
  const { usuarioActual, cargando: cargandoAuth, registrar, login, cerrarSesion, usandoFirebase } = useAuthFirebase();
  const { gastos, cargando: cargandoGastos, agregarGasto, eliminarGasto, editarGasto, calcularEstadisticas } = useGastosFirebase(usuarioActual?.id || null, usandoFirebase);
  const { moneda, cambiarMoneda, obtenerMoneda } = useMoneda(usuarioActual?.id || null);
  const estadisticas = calcularEstadisticas();
  const monedaActual = obtenerMoneda();

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (cargandoAuth || cargandoGastos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
          {usandoFirebase && (
            <p className="text-xs text-gray-500 mt-2">📡 Sincronizando con Firebase...</p>
          )}
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar pantalla de login
  if (!usuarioActual) {
    return <Login onLogin={login} onRegistrar={registrar} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 sm:pb-8">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header - Sticky en móvil */}
        <header className="mb-4 sm:mb-8 sticky top-0 z-10 bg-gradient-to-br from-gray-50 to-gray-100 pb-2 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="bg-primary-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wallet className="text-white" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">FinanzApp</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Control total de tus finanzas personales</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm text-xs sm:text-sm">
                <User size={16} className="text-primary-600 flex-shrink-0" />
                <span className="font-medium text-gray-700 truncate max-w-[120px] sm:max-w-none">{usuarioActual.nombre}</span>
              </div>
              <SelectorMoneda monedaActual={moneda} onCambiarMoneda={cambiarMoneda} />
              <button
                onClick={cerrarSesion}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-lg transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Banner de instalación (iOS) */}
        <div className="mb-6 sm:mb-8">
          <BannerInstalacion />
        </div>

        {/* Exportar/Importar datos */}
        {!usandoFirebase && (
          <div className="mb-6 sm:mb-8">
            <ExportarDatos 
              gastos={gastos} 
              usuarioId={usuarioActual.id}
              usuarioNombre={usuarioActual.nombre}
            />
          </div>
        )}

        {/* Sección: Estadísticas */}
        <section className="mb-8 sm:mb-10">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">📊 Resumen Financiero</h2>
            <p className="text-sm text-gray-600">Vista general de tus gastos</p>
          </div>
          <Estadisticas estadisticas={estadisticas} moneda={monedaActual} />
        </section>

        {/* Sección: Conversión a Pesos Argentinos */}
        {monedaActual.codigo !== 'ARS' && (
          <section className="mb-8 sm:mb-10">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">💱 Conversión a Pesos</h2>
              <p className="text-sm text-gray-600">Equivalencia en pesos argentinos</p>
            </div>
            <ResumenConversion 
              estadisticas={estadisticas} 
              monedaActual={monedaActual} 
            />
          </section>
        )}

        {/* Sección: Gráficos */}
        <section className="mb-8 sm:mb-10">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">📈 Visualización</h2>
            <p className="text-sm text-gray-600">Gráficos y análisis de tus gastos</p>
          </div>
          <GastosChart estadisticas={estadisticas} moneda={monedaActual} />
        </section>

        {/* Sección: Gestión de Gastos */}
        <section className="mb-8 sm:mb-10">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">💰 Gestión de Gastos</h2>
            <p className="text-sm text-gray-600">Agrega y gestiona tus gastos</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Formulario */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <GastoForm onAgregarGasto={agregarGasto} monedaActual={monedaActual.codigo} />
            </div>

            {/* Lista de gastos */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <GastoList 
                gastos={gastos} 
                onEliminarGasto={eliminarGasto} 
                onEditarGasto={editarGasto}
                moneda={monedaActual} 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
