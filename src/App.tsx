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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 sm:p-3 rounded-lg">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">FinanzApp</h1>
                <p className="text-sm sm:text-base text-gray-600">Control total de tus finanzas personales</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <User size={18} className="text-primary-600" />
                <span className="text-sm font-medium text-gray-700">{usuarioActual.nombre}</span>
              </div>
              <SelectorMoneda monedaActual={moneda} onCambiarMoneda={cambiarMoneda} />
              <button
                onClick={cerrarSesion}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Banner de instalación (iOS) */}
        <BannerInstalacion />

        {/* Exportar/Importar datos */}
        {!usandoFirebase && (
          <ExportarDatos 
            gastos={gastos} 
            usuarioId={usuarioActual.id}
            usuarioNombre={usuarioActual.nombre}
          />
        )}

        {/* Estadísticas */}
        <div className="mb-8">
          <Estadisticas estadisticas={estadisticas} moneda={monedaActual} />
        </div>

        {/* Conversión a Pesos Argentinos (si la moneda no es ARS) */}
        {monedaActual.codigo !== 'ARS' && (
          <div className="mb-8">
            <ResumenConversion 
              estadisticas={estadisticas} 
              monedaActual={monedaActual} 
            />
          </div>
        )}

        {/* Gráficos */}
        <div className="mb-8">
          <GastosChart estadisticas={estadisticas} moneda={monedaActual} />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <GastoForm onAgregarGasto={agregarGasto} />
          </div>

          {/* Lista de gastos */}
          <div className="lg:col-span-2">
            <GastoList 
              gastos={gastos} 
              onEliminarGasto={eliminarGasto} 
              onEditarGasto={editarGasto}
              moneda={monedaActual} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
