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
<<<<<<< Updated upstream
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1">Agregar Gasto</h2>
        <p className="text-xs sm:text-sm text-gray-600">Registra un nuevo gasto</p>
      </div>
      
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <input
          id="descripcion"
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Ej: Almuerzo en restaurante"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
            Monto
          </label>
          <input
            id="monto"
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {CATEGORIAS.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icono} {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 sm:py-3.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-base sm:text-lg touch-manipulation shadow-md hover:shadow-lg"
      >
        <Plus size={20} />
        Agregar Gasto
      </button>
=======
>>>>>>> Stashed changes
    </form>
  );
}
