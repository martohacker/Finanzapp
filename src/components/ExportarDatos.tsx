import { Download, Upload, FileJson } from 'lucide-react';
import { useState } from 'react';
import { Gasto } from '../types';

interface ExportarDatosProps {
  gastos: Gasto[];
  usuarioId: string;
  usuarioNombre: string;
  permitirImportar?: boolean;
}

export function ExportarDatos({
  gastos,
  usuarioId,
  usuarioNombre,
  permitirImportar = true,
}: ExportarDatosProps) {
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const exportarJson = () => {
    try {
      const datos = {
        usuario: {
          id: usuarioId,
          nombre: usuarioNombre,
        },
        gastos,
        fechaExportacion: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finanzapp-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExito('Backup JSON exportado exitosamente');
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError('Error al exportar datos');
      setTimeout(() => setError(null), 3000);
    }
  };

  const exportarCsv = () => {
    try {
      if (!gastos.length) {
        setError('No hay gastos para exportar.');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const encabezados = ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Moneda'];
      const filas = gastos.map((g) => [
        g.fecha,
        g.descripcion.replace(/"/g, '""'),
        g.categoria,
        g.monto.toString().replace('.', ','),
        g.moneda || 'ARS',
      ]);

      const lineas = [
        encabezados.join(';'),
        ...filas.map((cols) => cols.map((c) => `"${c}"`).join(';')),
      ];

      const contenido = '\ufeff' + lineas.join('\n');
      const blob = new Blob([contenido], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finanzapp-gastos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExito('Gastos exportados a CSV (compatible con Excel).');
      setTimeout(() => setExito(null), 3000);
    } catch {
      setError('Error al exportar CSV.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const importarDatos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const contenido = e.target?.result as string;
        const datos = JSON.parse(contenido);

        if (!datos.gastos || !Array.isArray(datos.gastos)) {
          throw new Error('Formato de archivo inválido');
        }

        // Guardar en localStorage
        const storageKey = `finanzapp-gastos-${usuarioId}`;
        localStorage.setItem(storageKey, JSON.stringify(datos.gastos));

        setExito(`Importados ${datos.gastos.length} gastos exitosamente. Recarga la página.`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err) {
        setError('Error al importar datos. Verifica que el archivo sea válido.');
        setTimeout(() => setError(null), 5000);
      }
    };

    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileJson className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Exportar/Importar Datos</h3>
            <p className="text-sm text-gray-600">Backup manual de tus gastos (JSON / CSV)</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportarJson}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download size={18} />
            Backup JSON
          </button>

          <button
            onClick={exportarCsv}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          
          {permitirImportar && (
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer">
              <Upload size={18} />
              Importar
              <input
                type="file"
                accept=".json"
                onChange={importarDatos}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {exito && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {exito}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        💡 <strong>Tip:</strong> Exporta tus datos regularmente para hacer backup. Puedes importarlos en otro dispositivo.
      </div>
    </div>
  );
}

