import { useState } from 'react';
import { Gasto } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { MONEDAS, MONEDA_DEFAULT } from '../constants/monedas';
import { Plus } from 'lucide-react';

interface GastoFormProps {
  onAgregarGasto: (gasto: Omit<Gasto, 'id'>) => void;
  monedaActual?: string; // Código de moneda actual (ej: 'ARS', 'USD')
}

export function GastoForm({ onAgregarGasto, monedaActual = MONEDA_DEFAULT }: GastoFormProps) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0].id);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [moneda, setMoneda] = useState(monedaActual);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) {
      return;
    }

    onAgregarGasto({
      descripcion: descripcion.trim(),
      monto: parseFloat(monto),
      categoria,
      fecha,
      moneda,
    });

    // Resetear formulario
    setDescripcion('');
    setMonto('');
    setCategoria(CATEGORIAS[0].id);
    setFecha(new Date().toISOString().split('T')[0]);
    setMoneda(monedaActual);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-3 sm:space-y-4">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Agregar Gasto</h2>
      
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
        </div>

        <div>
          <label htmlFor="moneda" className="block text-sm font-medium text-gray-700 mb-1">
            Moneda
          </label>
          <select
            id="moneda"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {MONEDAS.map(mon => (
              <option key={mon.codigo} value={mon.codigo}>
                {mon.simbolo} {mon.codigo} - {mon.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

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
    </form>
  );
}
