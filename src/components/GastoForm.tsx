import { useState } from 'react';
import { Gasto } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { MONEDAS, MONEDA_DEFAULT } from '../constants/monedas';
import { Plus, ChevronDown, ChevronUp, Calendar, Wallet } from 'lucide-react';

interface GastoFormProps {
  onAgregarGasto: (gasto: Omit<Gasto, 'id'>) => void;
  monedaActual?: string;
}

export function GastoForm({ onAgregarGasto, monedaActual = MONEDA_DEFAULT }: GastoFormProps) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0].id);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [moneda, setMoneda] = useState(monedaActual);
  const [masOpciones, setMasOpciones] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) return;

    onAgregarGasto({
      descripcion: descripcion.trim(),
      monto: parseFloat(monto),
      categoria,
      fecha,
      moneda,
    });

    setDescripcion('');
    setMonto('');
    setCategoria(CATEGORIAS[0].id);
    setFecha(new Date().toISOString().split('T')[0]);
    setMoneda(monedaActual);
  };

  const inputBase =
    'border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-none dark:border dark:border-slate-700 overflow-hidden transition-shadow hover:shadow-xl dark:hover:border-slate-600"
    >
      {/* Bloque principal: descripción + monto + categoría + botón en flujo horizontal/compacto */}
      <div className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿En qué gastaste?"
              className={`w-full px-4 py-3 ${inputBase} placeholder:text-gray-400 dark:placeholder:text-slate-500`}
              required
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <div className="w-24 sm:w-28">
              <input
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-3 ${inputBase} text-center font-semibold placeholder:text-gray-400`}
                required
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={`w-full px-3 py-3 ${inputBase} bg-white dark:bg-slate-700`}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icono} {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="shrink-0 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
        </div>

        {/* Toggle "Fecha y moneda" */}
        <button
          type="button"
          onClick={() => setMasOpciones((o) => !o)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors w-full"
        >
          {masOpciones ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Fecha y moneda
        </button>

        {/* Panel expandible fecha + moneda */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            masOpciones ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                  <Calendar size={14} />
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={`w-full px-3 py-2.5 ${inputBase}`}
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                  <Wallet size={14} />
                  Moneda
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className={`w-full px-3 py-2.5 ${inputBase} bg-white dark:bg-slate-700`}
                >
                  {MONEDAS.map((mon) => (
                    <option key={mon.codigo} value={mon.codigo}>
                      {mon.simbolo} {mon.codigo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
