import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Estadisticas, Gasto } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';

interface GastosChartProps {
  estadisticas: Estadisticas;
  moneda: Moneda;
  gastos: Gasto[];
}

export function GastosChart({ estadisticas, moneda, gastos }: GastosChartProps) {
  const datosGrafico = CATEGORIAS.map(cat => ({
    nombre: cat.nombre,
    icono: cat.icono,
    monto: estadisticas.gastoPorCategoria[cat.id] || 0,
    color: cat.color,
  })).filter(item => item.monto > 0);

  const ahora = new Date();
  const meses: string[] = [];
  const formatoMes = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push(formatoMes(d.getFullYear(), d.getMonth()));
  }

  const mapaMeses: Record<string, number> = {};
  meses.forEach((m) => {
    mapaMeses[m] = 0;
  });

  gastos.forEach((g) => {
    const [y, m] = g.fecha.split('-');
    if (!y || !m) return;
    const clave = `${y}-${m}`;
    if (clave in mapaMeses) {
      mapaMeses[clave] += g.monto;
    }
  });

  const datosTendencia = meses.map((m) => {
    const [y, mes] = m.split('-');
    const indiceMes = parseInt(mes, 10) - 1;
    const fecha = new Date(parseInt(y, 10), indiceMes, 1);
    const label = fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    return { mes: label, total: mapaMeses[m] };
  });

  const hayDatos = datosGrafico.length > 0 || datosTendencia.some((d) => d.total > 0);

  if (!hayDatos) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-8 text-center">
        <p className="text-gray-500 dark:text-slate-400">No hay datos para mostrar en el gráfico</p>
        <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">Agrega algunos gastos para ver las estadísticas visuales</p>
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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4 sm:mb-6">Gráficos de Gastos</h2>
      
      <div className="space-y-6">
        {/* Gráfico de tendencia mensual */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-slate-300 mb-3 sm:mb-4">
            Tendencia mensual (últimos 12 meses)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={datosTendencia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => formatearMonto(value, moneda, 0)} />
              <Tooltip formatter={(value: number) => formatearMonto(value, moneda)} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pastel */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-slate-300 mb-3 sm:mb-4">Gastos por Categoría</h3>
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-slate-300 mb-3 sm:mb-4">Comparativa por Categoría</h3>
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
    </div>
  );
}
