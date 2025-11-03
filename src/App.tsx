import { useGastos } from './hooks/useGastos';
import { useMoneda } from './hooks/useMoneda';
import { GastoForm } from './components/GastoForm';
import { GastoList } from './components/GastoList';
import { GastosChart } from './components/GastosChart';
import { Estadisticas } from './components/Estadisticas';
import { ResumenConversion } from './components/ResumenConversion';
import { SelectorMoneda } from './components/SelectorMoneda';
import { Wallet } from 'lucide-react';

function App() {
  const { gastos, agregarGasto, eliminarGasto, calcularEstadisticas } = useGastos();
  const { moneda, cambiarMoneda, obtenerMoneda } = useMoneda();
  const estadisticas = calcularEstadisticas();
  const monedaActual = obtenerMoneda();

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
            <SelectorMoneda monedaActual={moneda} onCambiarMoneda={cambiarMoneda} />
          </div>
        </header>

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
            <GastoList gastos={gastos} onEliminarGasto={eliminarGasto} moneda={monedaActual} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
