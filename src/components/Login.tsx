import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ exito: boolean; error?: string }>;
  onRegistrar: (email: string, password: string, nombre: string) => Promise<{ exito: boolean; error?: string }>;
}

export function Login({ onLogin, onRegistrar }: LoginProps) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={4}
              />
            </div>
            {esRegistro && (
              <p className="mt-1 text-xs text-gray-500">Mínimo 4 caracteres</p>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}

