import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ exito: boolean; error?: string }>;
  onRegistrar: (email: string, password: string, nombre: string) => Promise<{ exito: boolean; error?: string }>;
  onRecuperarContrasena?: (email: string) => Promise<{ exito: boolean; error?: string }>;
}

export function Login({ onLogin, onRegistrar, onRecuperarContrasena }: LoginProps) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState<string | null>(null);

  const handleRecuperar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!onRecuperarContrasena) return;
    setError(null);
    setMensajeRecuperacion(null);
    if (!email.trim()) {
      setError('Ingresa tu email para enviar el enlace de recuperación.');
      return;
    }
    setRecuperando(true);
    try {
      const resultado = await onRecuperarContrasena(email.trim());
      if (resultado.exito) {
        setMensajeRecuperacion('ok');
      } else {
        setError(resultado.error || 'No se pudo enviar el correo.');
      }
    } catch {
      setError('Ocurrió un error al solicitar la recuperación.');
    } finally {
      setRecuperando(false);
    }
  };

  const volverALogin = () => {
    setMostrarRecuperar(false);
    setError(null);
    setMensajeRecuperacion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      let resultado;
      if (esRegistro) {
        resultado = await onRegistrar(email, password, nombre);
      } else {
        resultado = await onLogin(email, password);
      }

      if (!resultado.exito) {
        setError(resultado.error || 'Error desconocido');
      }
      // Si es exitoso, el hook se encarga de actualizar el estado
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Pantalla: Recuperar contraseña */}
        {mostrarRecuperar ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-block bg-primary-600 p-4 rounded-full mb-4">
                <KeyRound className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Recuperar contraseña</h1>
              <p className="text-gray-600">
                Ingresá el email de tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {mensajeRecuperacion === 'ok' ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm space-y-2">
                  <p className="font-medium">Revisá tu correo.</p>
                  <p>Te enviamos un enlace para restablecer tu contraseña.</p>
                  <p className="text-green-700 mt-2">
                    Si no lo ves en la bandeja de entrada, <strong>revisá la carpeta de spam o correo no deseado</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={volverALogin}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecuperar} className="space-y-4">
                <div>
                  <label htmlFor="email-recuperar" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="email-recuperar"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={recuperando}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recuperando ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <button
                  type="button"
                  onClick={volverALogin}
                  className="w-full flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm py-2"
                >
                  <ArrowLeft size={16} />
                  Volver al inicio de sesión
                </button>
              </form>
            )}
          </>
        ) : (
          <>
        <div className="text-center mb-8">
          <div className="inline-block bg-primary-600 p-4 rounded-full mb-4">
            {esRegistro ? (
              <UserPlus className="text-white" size={32} />
            ) : (
              <LogIn className="text-white" size={32} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-gray-600">
            {esRegistro 
              ? 'Crea tu cuenta para comenzar a gestionar tus finanzas'
              : 'Ingresa a tu cuenta para ver tus finanzas'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {esRegistro && (
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={4}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {esRegistro && (
              <p className="mt-1 text-xs text-gray-500">Mínimo 4 caracteres</p>
            )}
            {!esRegistro && onRecuperarContrasena && (
              <button
                type="button"
                onClick={() => { setMostrarRecuperar(true); setError(null); setMensajeRecuperacion(null); }}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-md hover:shadow-lg text-base sm:text-lg"
          >
            {cargando ? 'Procesando...' : (esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError(null);
              setPassword('');
            }}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            {esRegistro 
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

