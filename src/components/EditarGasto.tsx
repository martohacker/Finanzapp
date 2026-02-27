import { useState, useEffect } from 'react';
import { Gasto } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { MONEDAS, MONEDA_DEFAULT } from '../constants/monedas';
import { X } from 'lucide-react';

interface EditarGastoProps {
  gasto: Gasto;
  onGuardar: (gasto: Omit<Gasto, 'id'>) => void;
  onCancelar: () => void;
}

export function EditarGasto({ gasto, onGuardar, onCancelar }: EditarGastoProps) {
  const [descripcion, setDescripcion] = useState(gasto.descripcion);
  const [monto, setMonto] = useState(gasto.monto.toString());
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [fecha, setFecha] = useState(gasto.fecha);
  const [moneda, setMoneda] = useState(gasto.moneda || MONEDA_DEFAULT);

  useEffect(() => {
    setDescripcion(gasto.descripcion);
    setMonto(gasto.monto.toString());
    setCategoria(gasto.categoria);
    setFecha(gasto.fecha);
    setMoneda(gasto.moneda || MONEDA_DEFAULT);
  }, [gasto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) {
      return;
    }

    onGuardar({
      descripcion: descripcion.trim(),
      monto: parseFloat(monto),
      categoria,
      fecha,
      moneda,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-none dark:border dark:border-slate-600 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100">Editar Gasto</h2>
          <button
            onClick={onCancelar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-700 dark:text-slate-300"
            title="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-descripcion" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <input
              id="edit-descripcion"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ej: Almuerzo en restaurante"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-monto" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Monto
              </label>
              <input
                id="edit-monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-moneda" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Moneda
              </label>
              <select
                id="edit-moneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <label htmlFor="edit-fecha" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                id="edit-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-categoria" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                id="edit-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {CATEGORIAS.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icono} {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
