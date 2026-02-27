import { useState } from 'react';
import { MetaAhorro } from '../types';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { Target, Plus, Trash2 } from 'lucide-react';

interface MetasAhorroSectionProps {
  metas: MetaAhorro[];
  moneda: Moneda;
  onAgregarMeta: (datos: Omit<MetaAhorro, 'id' | 'userId'>) => void;
  onActualizarMonto: (id: string, montoActual: number) => void;
  onEliminar: (id: string) => void;
}

export function MetasAhorroSection({
  metas,
  moneda,
  onAgregarMeta,
  onActualizarMonto,
  onEliminar,
}: MetasAhorroSectionProps) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [montoInicial, setMontoInicial] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const objetivo = parseFloat(montoObjetivo.replace(',', '.')) || 0;
    const actual = parseFloat(montoInicial.replace(',', '.')) || 0;
    if (!nombre.trim() || objetivo <= 0) return;
    onAgregarMeta({
      nombre: nombre.trim(),
      montoObjetivo: objetivo,
      montoActual: actual,
      moneda: moneda.codigo,
    });
    setNombre('');
    setMontoObjetivo('');
    setMontoInicial('0');
    setMostrarForm(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Target size={20} className="text-primary-500" />
        Metas de ahorro
      </h3>

      {!mostrarForm ? (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-500/30 border border-primary-200 dark:border-primary-500/30 mb-4"
        >
          <Plus size={16} />
          Nueva meta
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Vacaciones, auto..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg bg-white text-gray-900 text-sm"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Objetivo</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoObjetivo}
                onChange={(e) => setMontoObjetivo(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg bg-white text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Ahorrado ya</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg bg-white text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">
              Crear meta
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="py-2 px-3 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {metas.length === 0 && !mostrarForm && (
          <p className="text-sm text-gray-500 dark:text-slate-400">Sin metas. Creá una para seguir tu ahorro.</p>
        )}
        {metas.map((meta) => {
          const porcentaje = meta.montoObjetivo > 0
            ? Math.min(100, (meta.montoActual / meta.montoObjetivo) * 100)
            : 0;
          return (
            <div
              key={meta.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-800 dark:text-slate-200">{meta.nombre}</span>
                <button
                  type="button"
                  onClick={() => onEliminar(meta.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Eliminar meta"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400 mb-1">
                <span>{formatearMonto(meta.montoActual, moneda, 0)} / {formatearMonto(meta.montoObjetivo, moneda, 0)}</span>
                <span>{porcentaje.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary-500 transition-all"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Sumar monto"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      const valor = parseFloat(input.value) || 0;
                      if (valor > 0) {
                        onActualizarMonto(meta.id, meta.montoActual + valor);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    const valor = parseFloat(input?.value || '0') || 0;
                    if (valor > 0) {
                      onActualizarMonto(meta.id, meta.montoActual + valor);
                      if (input) input.value = '';
                    }
                  }}
                  className="py-1 px-3 rounded bg-primary-600 text-white text-sm"
                >
                  Sumar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
