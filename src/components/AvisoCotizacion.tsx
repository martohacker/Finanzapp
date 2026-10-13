import { AlertCircle } from 'lucide-react';

interface AvisoCotizacionProps {
  /** Versión en línea (texto chico) para usar dentro de una tarjeta */
  compacto?: boolean;
}

/** Se muestra en lugar de montos convertidos cuando no hay cotización disponible. */
export function AvisoCotizacion({ compacto = false }: AvisoCotizacionProps) {
  if (compacto) {
    return (
      <span role="status" className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
        <AlertCircle size={14} />
        Cotización no disponible
      </span>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
    >
      <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Cotización no disponible</p>
        <p className="text-sm">
          Tenés gastos en otras monedas y no pudimos obtener el tipo de cambio. Probá de nuevo más tarde.
        </p>
      </div>
    </div>
  );
}
