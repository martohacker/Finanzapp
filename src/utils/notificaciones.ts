/**
 * Solicita permiso de notificaciones y muestra una notificación local si hay mensaje.
 * Para push en segundo plano haría falta FCM/backend.
 */
export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permiso = await Notification.requestPermission();
  return permiso === 'granted';
}

export function mostrarNotificacionLocal(titulo: string, cuerpo: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(titulo, { body: cuerpo, icon: '/favicon.ico' });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    setTimeout(() => n.close(), 5000);
  } catch {
    // ignore
  }
}

export function permisoNotificaciones(): NotificationPermission | null {
  if (!('Notification' in window)) return null;
  return Notification.permission;
}
