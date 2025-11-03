import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function BannerInstalacion() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Detectar si es iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Verificar si ya está instalada (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isAlreadyInstalled = (window.navigator as any).standalone || isStandalone;

    // Verificar si el usuario ya cerró el banner antes
    const bannerCerrado = localStorage.getItem('banner-instalacion-cerrado') === 'true';

    // Mostrar solo si es iOS, no está instalada y no se cerró antes
    if (iOS && !isAlreadyInstalled && !bannerCerrado) {
      setMostrar(true);
    }
  }, []);

  const cerrar = () => {
    setMostrar(false);
    localStorage.setItem('banner-instalacion-cerrado', 'true');
  };

  if (!mostrar) return null;

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-lg shadow-lg mb-6 relative">
      <button
        onClick={cerrar}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>
      
      <div className="flex items-start gap-3 pr-8">
        <div className="mt-1">
          <Download size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Instala FinanzApp en tu iPhone</h3>
          <p className="text-sm text-white/90 mb-2">
            Acceso rápido desde tu pantalla principal
          </p>
          <div className="text-xs space-y-1 text-white/80">
            <p>1️⃣ Toca el botón <strong>Compartir</strong> (⬆️) en la parte inferior</p>
            <p>2️⃣ Selecciona <strong>"Agregar a pantalla principal"</strong></p>
            <p>3️⃣ Toca <strong>"Agregar"</strong> para confirmar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

