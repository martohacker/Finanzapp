import { useState } from 'react';
import { Gasto } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { Plus, X } from 'lucide-react';

interface AgregarRapidoGastoProps {
  onAgregarGasto: (gasto: Omit<Gasto, 'id'>) => void;
  monedaActual: string;
}

export function AgregarRapidoGasto({ onAgregarGasto, monedaActual }: AgregarRapidoGastoProps) {
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0].id);

  const fechaHoy = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(monto.replace(',', '.')) || 0;
    if (!descripcion.trim() || valor <= 0) return;

    onAgregarGasto({
      descripcion: descripcion.trim(),
      monto: valor,
      categoria,
      fecha: fechaHoy,
      moneda: monedaActual,
    });

    setDescripcion('');
    setMonto('');
    setCategoria(CATEGORIAS[0].id);
    setAbierto(false);
  };

  const handleCerrar = () => {
    setAbierto(false);
    setDescripcion('');
    setMonto('');
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-20 right-4 sm:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 transition-all"
        title="Agregar gasto rápido"
        aria-label="Agregar gasto rápido"
      >
        <Plus size={28} />
      </button>

      {/* Modal */}
      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          onClick={handleCerrar}
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-agregar-rapido"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-slate-600 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-600">
              <h2 id="titulo-agregar-rapido" className="text-lg font-bold text-gray-800 dark:text-slate-100">
                Agregar gasto rápido
              </h2>
              <button
                type="button"
                onClick={handleCerrar}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="rapido-desc" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <input
                  id="rapido-desc"
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Café, super..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="rapido-monto" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Monto ({monedaActual})
                </label>
                <input
                  id="rapido-monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="rapido-cat" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  id="rapido-cat"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icono} {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Fecha: hoy ({fechaHoy})
              </p>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Agregar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
