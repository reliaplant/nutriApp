import Image from "next/image";
import Link from "next/link";
import SimulacionPacientes from "./components/simulacionPacientes";
import Pricing from "./components/pricing"; // Add this import

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="absolute inset-0 opacity-10 pattern-bg"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Gestión integral para nutricionistas
              </h1>
              <p className="text-lg md:text-xl text-emerald-50">
                Simplifica tu práctica profesional con nuestra plataforma especializada para nutricionistas. Gestiona pacientes, consultas y planes nutricionales en un solo lugar.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link 
                  href="/login" 
                  className="bg-white text-emerald-600 hover:bg-emerald-50 transition-colors px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg"
                >
                  Iniciar sesión
                </Link>
                <Link 
                  href="/register" 
                  className="bg-emerald-700 text-white hover:bg-emerald-800 transition-colors px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg border border-emerald-600"
                >
                  Registrarse
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="relative w-full max-w-md h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/IMG_8465.JPG"
                  alt="Nutricionista trabajando"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Todo lo que necesitas para tu consulta</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nuestra plataforma está diseñada específicamente para profesionales de la nutrición, con todas las herramientas que necesitas para ofrecer un servicio de calidad.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Gestión de pacientes</h3>
              <p className="text-gray-600">
                Administra de forma eficiente los perfiles de tus pacientes, con su historial médico, consultas y evolución.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Planes nutricionales</h3>
              <p className="text-gray-600">
                Crea planes de alimentación personalizados, calculando automáticamente las necesidades calóricas y nutricionales.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Seguimiento y evolución</h3>
              <p className="text-gray-600">
                Visualiza el progreso de tus pacientes mediante gráficos interactivos y registros detallados de cada consulta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Add the SimulacionPacientes component here */}
      <SimulacionPacientes />

      {/* Testimonial/Image Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="relative rounded-xl overflow-hidden h-[400px] shadow-lg">
                <Image
                  src="/IMG_8524.JPG"
                  alt="Consulta nutricional"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Optimiza tu consulta, mejora los resultados</h2>
              <p className="text-gray-600 text-lg">
                Con NutriApp, podrás dedicar más tiempo a lo que realmente importa: el cuidado personalizado de tus pacientes.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Reduce el tiempo en tareas administrativas</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Accede a la información de tus pacientes desde cualquier lugar</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Mejora la experiencia y resultados de tus pacientes</span>
                </li>
              </ul>
              <div className="pt-4">
                <Link 
                  href="/register" 
                  className="inline-block bg-emerald-600 text-white hover:bg-emerald-700 transition-colors px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg"
                >
                  Empieza ahora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add the Pricing component here */}
      <Pricing />

      {/* CTA Section */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para transformar tu práctica profesional?</h2>
          <p className="text-lg text-emerald-50 mb-8 max-w-3xl mx-auto">
            Únete a cientos de nutricionistas que ya están optimizando su trabajo y mejorando los resultados de sus pacientes con NutriApp.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/register" 
              className="bg-white text-emerald-600 hover:bg-emerald-50 transition-colors px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl"
            >
              Crear cuenta
            </Link>
            <Link 
              href="/login" 
              className="bg-emerald-700 text-white hover:bg-emerald-800 transition-colors px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg border border-emerald-500"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                    <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zm-6.5-3.408v-3.748l1.97-.84-.471 4.147a1 1 0 01-.992.741h-.507z" />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-medium text-emerald-600">
                  NutriApp
                </span>
              </div>
              <p className="mt-4 text-gray-500 text-sm">
                Plataforma especializada para profesionales de la nutrición que simplifica la gestión de pacientes y consultas.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Plataforma</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/features" className="text-gray-500 hover:text-emerald-600 transition-colors">Características</Link></li>
                <li><Link href="/pricing" className="text-gray-500 hover:text-emerald-600 transition-colors">Precios</Link></li>
                <li><Link href="/support" className="text-gray-500 hover:text-emerald-600 transition-colors">Soporte</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/privacy" className="text-gray-500 hover:text-emerald-600 transition-colors">Política de privacidad</Link></li>
                <li><Link href="/terms" className="text-gray-500 hover:text-emerald-600 transition-colors">Términos de uso</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-center text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} NutriApp. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}