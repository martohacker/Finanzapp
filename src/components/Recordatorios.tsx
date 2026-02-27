import { useMemo, useEffect, useRef, useState } from 'react';
import { GastoFijo } from '../types';
import { Moneda } from '../constants/monedas';
import { AlertTriangle, Calendar, Bell } from 'lucide-react';
import { solicitarPermisoNotificaciones, mostrarNotificacionLocal, permisoNotificaciones } from '../utils/notificaciones';

const DIAS_AVISO_VENCIMIENTO = 7;
const PORCENTAJE_AVISO_PRESUPUESTO = 70;

interface RecordatoriosProps {
  presupuestoMonto: number;
  porcentajeUsado: number;
  restante: number;
  gastosFijos: GastoFijo[];
  moneda: Moneda;
}

function formatearMonto(value: number, moneda: Moneda): string {
  return new Intl.NumberFormat(moneda.locale, {
    style: 'currency',
    currency: moneda.codigo,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Días hasta el próximo vencimiento (dia del mes). Si ya pasó este mes, cuenta para el próximo mes. */
function diasHastaVencimiento(diaVencimiento: number): number {
  const hoy = new Date();
  const diaHoy = hoy.getDate();
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();

  if (diaVencimiento >= diaHoy) {
    return diaVencimiento - diaHoy;
  }
  // Ya pasó este mes: próximo mes
  return ultimoDiaMes - diaHoy + diaVencimiento;
}

/** Fecha del próximo vencimiento para mostrar (ej: "15 de marzo"). */
function textoProximoVencimiento(diaVencimiento: number): string {
  const hoy = new Date();
  const diaHoy = hoy.getDate();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();

  if (diaVencimiento >= diaHoy) {
    const d = new Date(anio, mes, diaVencimiento);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  }
  const d = new Date(anio, mes + 1, diaVencimiento);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

export function Recordatorios({
  presupuestoMonto,
  porcentajeUsado,
  restante,
  gastosFijos,
  moneda,
}: RecordatoriosProps) {
  const avisoPresupuesto = useMemo(() => {
    if (presupuestoMonto <= 0) return null;
    if (restante <= 0) {
      return { tipo: 'superado' as const, mensaje: 'Superaste el presupuesto del mes.' };
    }
    if (porcentajeUsado >= PORCENTAJE_AVISO_PRESUPUESTO) {
      return {
        tipo: 'cerca' as const,
        mensaje: `Llevás ${Math.round(porcentajeUsado)}% del presupuesto. Te queda ${formatearMonto(restante, moneda)}.`,
      };
    }
    return null;
  }, [presupuestoMonto, porcentajeUsado, restante, moneda]);

  const proximosVencimientos = useMemo(() => {
    return gastosFijos
      .filter((g) => g.diaVencimiento != null && g.diaVencimiento >= 1 && g.diaVencimiento <= 31)
      .map((g) => ({
        ...g,
        diasHasta: diasHastaVencimiento(g.diaVencimiento!),
        textoFecha: textoProximoVencimiento(g.diaVencimiento!),
      }))
      .filter((g) => g.diasHasta >= 0 && g.diasHasta <= DIAS_AVISO_VENCIMIENTO)
      .sort((a, b) => a.diasHasta - b.diasHasta);
  }, [gastosFijos]);

  const yaNotificadoRef = useRef(false);
  const [permiso, setPermiso] = useState<NotificationPermission | null>(() => permisoNotificaciones());

  useEffect(() => {
    if (!avisoPresupuesto && proximosVencimientos.length === 0) return;
    if (permiso !== 'granted' || yaNotificadoRef.current) return;
    yaNotificadoRef.current = true;
    if (avisoPresupuesto) {
      mostrarNotificacionLocal('FinanzApp', avisoPresupuesto.mensaje);
    } else if (proximosVencimientos.length > 0) {
      const texto = proximosVencimientos.map((g) => `${g.descripcion} el ${g.textoFecha}`).join(', ');
      mostrarNotificacionLocal('Próximos vencimientos', texto);
    }
  }, [avisoPresupuesto, proximosVencimientos, permiso]);

  const activarNotificaciones = async () => {
    const ok = await solicitarPermisoNotificaciones();
    setPermiso(permisoNotificaciones());
    if (ok) yaNotificadoRef.current = false;
  };

  if (!avisoPresupuesto && proximosVencimientos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {avisoPresupuesto && (
        <div
          role="alert"
          className={`flex items-start gap-3 p-4 rounded-xl dark:border ${
            avisoPresupuesto.tipo === 'superado'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200'
          }`}
        >
          <AlertTriangle size={22} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{avisoPresupuesto.mensaje}</p>
            {permiso !== 'granted' && (
              <button
                type="button"
                onClick={activarNotificaciones}
                className="mt-2 flex items-center gap-1 text-sm opacity-90 hover:underline"
              >
                <Bell size={14} />
                Activar notificaciones en el navegador
              </button>
            )}
          </div>
        </div>
      )}

      {proximosVencimientos.length > 0 && (
        <div
          role="complementary"
          className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-200"
        >
          <Calendar size={22} className="flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium mb-1">Próximos vencimientos</p>
            <ul className="text-sm space-y-1">
              {proximosVencimientos.map((g) => (
                <li key={g.id}>
                  <strong>{g.descripcion}</strong> — {formatearMonto(g.monto, moneda)} el {g.textoFecha}
                  {g.diasHasta === 0 && ' (hoy)'}
                  {g.diasHasta === 1 && ' (mañana)'}
                </li>
              ))}
            </ul>
            {permiso !== 'granted' && (
              <button
                type="button"
                onClick={activarNotificaciones}
                className="mt-2 flex items-center gap-1 text-sm opacity-90 hover:underline"
              >
                <Bell size={14} />
                Activar notificaciones en el navegador
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
