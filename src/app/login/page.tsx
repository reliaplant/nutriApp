'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, authService } from '../shared/firebase';
import Link from 'next/link';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor complete todos los campos');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const userCredential = await authService.login(email, password);
      const userData = await authService.getUserData(userCredential.user.uid);
      
      if (!userData) {
        throw new Error('No se encontró información del usuario');
      }
      
      // Save auth token in cookie for server-side auth
      const token = await userCredential.user.getIdToken(true);
      document.cookie = `session=${token}; path=/; max-age=${60*60*24*7}`; // 7 days
      
      // Redirect to dashboard
      router.replace('/');
      
    } catch (err: any) {
      console.error('Error de inicio de sesión:', err);
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intente más tarde o restablezca su contraseña');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !displayName) {
      setError('Por favor complete todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await authService.register(email, password, displayName);
      
      // Automatically log in after registration
      const userCredential = await authService.login(email, password);
      
      // Save auth token in cookie
      const token = await userCredential.user.getIdToken(true);
      document.cookie = `session=${token}; path=/; max-age=${60*60*24*7}`;
      
      // Redirect to dashboard
      router.replace('/');
      
    } catch (err: any) {
      console.error('Error de registro:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado');
      } else {
        setError(err.message || 'Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor ingrese su email');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await authService.resetPassword(email);
      setResetEmailSent(true);
      
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No se encontró ninguna cuenta con este email');
      } else {
        setError(err.message || 'Error al enviar el email de restablecimiento');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - form */}
      <div className="w-full max-w-md p-8 m-auto bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-600">NutriApp</h1>
          <p className="text-gray-600 mt-1">Gestión de pacientes y planes nutricionales</p>
        </div>
        
        {/* Tabs */}
        {!showResetForm && (
          <div className="flex border-b mb-6">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'login'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Iniciar sesión
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'register'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('register')}
            >
              Registrarse
            </button>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
            {error}
          </div>
        )}
        
        {/* Reset password success message */}
        {resetEmailSent && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded">
            Se ha enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada.
          </div>
        )}
        
        {/* Login Form */}
        {activeTab === 'login' && !showResetForm && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={loading}
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-sm text-emerald-600 hover:text-emerald-800 focus:outline-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                loading
                  ? 'bg-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        )}
        
        {/* Register Form */}
        {activeTab === 'register' && !showResetForm && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="Nombre y apellido"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="registerEmail"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="registerPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                loading
                  ? 'bg-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
        
        {/* Reset Password Form */}
        {showResetForm && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Restablecer contraseña</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  placeholder="Ingresa tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={loading || resetEmailSent}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetEmailSent(false);
                  }}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  disabled={loading}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                    loading || resetEmailSent
                      ? 'bg-emerald-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  disabled={loading || resetEmailSent}
                >
                  {loading ? 'Enviando...' : resetEmailSent ? 'Email enviado' : 'Enviar email'}
                </button>
              </div>
            </form>
          </>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Al continuar, aceptas nuestros <a href="#" className="text-emerald-600 hover:text-emerald-800">Términos de servicio</a> y <a href="#" className="text-emerald-600 hover:text-emerald-800">Política de privacidad</a>.</p>
        </div>
      </div>
      
      {/* Right side - image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-90"></div>
        <Image
          src="/images/login-bg.jpg" 
          alt="Nutrición saludable"
          layout="fill"
          objectFit="cover"
          className="mix-blend-overlay"
        />
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="max-w-md text-white">
            <h1 className="text-4xl font-bold mb-4">Optimiza la gestión de tus pacientes</h1>
            <p className="text-lg">
              Con NutriApp, podrás llevar un control eficiente de tus pacientes,
              crear planes nutricionales personalizados y seguir su progreso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}