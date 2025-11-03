import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';

interface GastosChartProps {
  estadisticas: Estadisticas;
  moneda: Moneda;
}

export function GastosChart({ estadisticas, moneda }: GastosChartProps) {
  const datosGrafico = CATEGORIAS.map(cat => ({
    nombre: cat.nombre,
    icono: cat.icono,
    monto: estadisticas.gastoPorCategoria[cat.id] || 0,
    color: cat.color,
  })).filter(item => item.monto > 0);

  if (datosGrafico.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No hay datos para mostrar en el gráfico</p>
        <p className="text-gray-400 text-sm mt-2">Agrega algunos gastos para ver las estadísticas visuales</p>
      </div>
    );
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Gráficos de Gastos</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pastel */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={datosGrafico}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="monto"
              >
                {datosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatearMonto(value, moneda)}
              />
              <Legend
                formatter={(value, entry: any) => `${entry.payload.icono} ${value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Comparativa por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nombre" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={(value) => formatearMonto(value, moneda, 0)}
              />
              <Tooltip
                formatter={(value: number) => formatearMonto(value, moneda)}
              />
              <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                {datosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
