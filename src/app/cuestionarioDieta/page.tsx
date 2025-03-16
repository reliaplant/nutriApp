'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Definición de tipos
interface FormData {
    // Datos personales
    nombre: string;
    edad: string;
    genero: string;
    email: string;
    telefono: string;

    // Datos antropométricos
    peso: string;
    altura: string;

    // Objetivos y antecedentes
    objetivoPrincipal: string;
    plazoPrevisto: string;
    intentosPrevios: string;

    // Historial médico
    condicionesMedicas: string[];
    otrasCondiciones: string;
    medicamentos: string;
    alergias: string;
    intolerancias: string;

    // Actividad física
    nivelActividad: string;
    tipoEjercicio: string[];
    otroEjercicio: string;
    frecuenciaEjercicio: string;
    duracionEjercicio: string;

    // Hábitos alimentarios
    comidasDiarias: string;
    horariosComidas: string;
    lugarComidas: string;
    apetito: string;
    comidasFuera: string;
    comidaFavorita: string;
    alimentosDisgusto: string;
    snacks: string;
    bebidas: string;
    alcohol: string;
    desayunoTipico: string;
    almuerzoTipico: string;
    cenaTipico: string;

    // Preferencias y restricciones
    dietaEspecial: string;
    restricciones: string[];
    otrasRestricciones: string;
    suplementos: string;

    // Estilo de vida
    ocupacion: string;
    horasSueno: string;
    nivelEstres: string;

    // Adicionales
    informacionAdicional: string;
}

export default function CuestionarioDieta() {
    const router = useRouter();

    // Estado inicial del formulario
    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        edad: '',
        genero: '',
        email: '',
        telefono: '',
        peso: '',
        altura: '',
        objetivoPrincipal: '',
        plazoPrevisto: '',
        intentosPrevios: '',
        condicionesMedicas: [],
        otrasCondiciones: '',
        medicamentos: '',
        alergias: '',
        intolerancias: '',
        nivelActividad: '',
        tipoEjercicio: [],
        otroEjercicio: '',
        frecuenciaEjercicio: '',
        duracionEjercicio: '',
        comidasDiarias: '',
        horariosComidas: '',
        lugarComidas: '',
        apetito: '',
        comidasFuera: '',
        comidaFavorita: '',
        alimentosDisgusto: '',
        snacks: '',
        bebidas: '',
        alcohol: '',
        desayunoTipico: '',
        almuerzoTipico: '',
        cenaTipico: '',
        dietaEspecial: '',
        restricciones: [],
        otrasRestricciones: '',
        suplementos: '',
        ocupacion: '',
        horasSueno: '',
        nivelEstres: '',
        informacionAdicional: ''
    });

    // Estado para el paso actual del formulario
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;

    // Estado para el envío exitoso
    const [submitted, setSubmitted] = useState(false);

    // Manejar cambios en los campos de texto, número, etc.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Manejar cambios en checkboxes (selección múltiple)
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const currentValues = [...(prev[field as keyof FormData] as string[])];

            if (checked) {
                return { ...prev, [field]: [...currentValues, value] };
            } else {
                return { ...prev, [field]: currentValues.filter(v => v !== value) };
            }
        });
    };

    // Navegar al siguiente paso
    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    // Navegar al paso anterior
    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    // Enviar el formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Aquí normalmente enviarías los datos a tu backend
            console.log("Datos del formulario:", formData);

            // Simular una petición exitosa
            setTimeout(() => {
                setSubmitted(true);
                window.scrollTo(0, 0);
            }, 1000);

        } catch (error) {
            console.error("Error al enviar el formulario:", error);
        }
    };

    // Si el formulario fue enviado con éxito, mostrar mensaje de confirmación
    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
                    <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">¡Cuestionario enviado con éxito!</h2>
                        <p className="text-gray-600 mb-6">
                            Gracias por completar el cuestionario nutricional. Analizaremos tus respuestas y te prepararemos un plan nutricional personalizado.
                        </p>
                        <p className="text-gray-600 mb-6">
                            Nos pondremos en contacto contigo en los próximos días para brindarte tu plan nutricional y resolver cualquier duda adicional.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-2">Cuestionario Nutricional Inicial</h1>
                <p className="text-gray-600 mb-6">
                    Este cuestionario nos permitirá diseñar un plan nutricional personalizado para ti. Por favor, proporciona información precisa y detallada.
                </p>

                {/* Indicador de progreso */}
                <div className="mb-8">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Paso {currentStep} de {totalSteps}</span>
                        <span className="text-sm font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Paso 1: Información Personal */}
                    {currentStep === 1 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Información Personal</h2>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre completo *
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edad" className="block text-sm font-medium text-gray-700 mb-1">
                                            Edad *
                                        </label>
                                        <input
                                            type="number"
                                            id="edad"
                                            name="edad"
                                            value={formData.edad}
                                            onChange={handleChange}
                                            required
                                            min="1"
                                            max="120"
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-1">
                                            Género *
                                        </label>
                                        <select
                                            id="genero"
                                            name="genero"
                                            value={formData.genero}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="masculino">Masculino</option>
                                            <option value="femenino">Femenino</option>
                                            <option value="otro">Otro</option>
                                            <option value="prefiero_no_decir">Prefiero no decir</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            id="telefono"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="peso" className="block text-sm font-medium text-gray-700 mb-1">
                                            Peso actual (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            id="peso"
                                            name="peso"
                                            value={formData.peso}
                                            onChange={handleChange}
                                            required
                                            step="0.1"
                                            min="30"
                                            max="300"
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="altura" className="block text-sm font-medium text-gray-700 mb-1">
                                            Altura (cm) *
                                        </label>
                                        <input
                                            type="number"
                                            id="altura"
                                            name="altura"
                                            value={formData.altura}
                                            onChange={handleChange}
                                            required
                                            min="100"
                                            max="250"
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

          // Añade estos componentes después del paso 1 y antes de los botones de navegación

                    {/* Paso 2: Objetivos y antecedentes */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Objetivos y Antecedentes</h2>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <label htmlFor="objetivoPrincipal" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Cuál es tu objetivo principal? *
                                    </label>
                                    <select
                                        id="objetivoPrincipal"
                                        name="objetivoPrincipal"
                                        value={formData.objetivoPrincipal}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="perdida_peso">Pérdida de peso</option>
                                        <option value="ganancia_muscular">Ganancia de masa muscular</option>
                                        <option value="mejora_rendimiento">Mejora del rendimiento deportivo</option>
                                        <option value="salud_general">Mejorar salud general</option>
                                        <option value="mantenimiento">Mantenimiento</option>
                                        <option value="otros">Otros</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="plazoPrevisto" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿En qué plazo te gustaría lograr este objetivo?
                                    </label>
                                    <select
                                        id="plazoPrevisto"
                                        name="plazoPrevisto"
                                        value={formData.plazoPrevisto}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="1_mes">1 mes</option>
                                        <option value="3_meses">3 meses</option>
                                        <option value="6_meses">6 meses</option>
                                        <option value="1_ano">1 año</option>
                                        <option value="largo_plazo">A largo plazo / Mantenimiento</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="intentosPrevios" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Has realizado intentos previos para lograr este objetivo? Describe brevemente.
                                    </label>
                                    <textarea
                                        id="intentosPrevios"
                                        name="intentosPrevios"
                                        value={formData.intentosPrevios}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Historial Médico */}
                    {currentStep === 3 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Historial Médico</h2>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ¿Tienes alguna de las siguientes condiciones médicas? (Selecciona todas las que apliquen)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {['Diabetes', 'Hipertensión', 'Colesterol alto', 'Enfermedad cardiovascular', 'Hipotiroidismo', 'Hipertiroidismo', 'Síndrome del intestino irritable', 'Enfermedad celíaca', 'Problemas renales', 'Problemas hepáticos'].map(condition => (
                                            <div key={condition} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`condicion-${condition}`}
                                                    value={condition}
                                                    checked={formData.condicionesMedicas.includes(condition)}
                                                    onChange={(e) => handleCheckboxChange(e, 'condicionesMedicas')}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`condicion-${condition}`} className="ml-2 text-sm text-gray-700">
                                                    {condition}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="otrasCondiciones" className="block text-sm font-medium text-gray-700 mb-1">
                                        Otras condiciones médicas o detalles relevantes sobre tu salud:
                                    </label>
                                    <textarea
                                        id="otrasCondiciones"
                                        name="otrasCondiciones"
                                        value={formData.otrasCondiciones}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label htmlFor="medicamentos" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Tomas algún medicamento o suplemento regularmente?
                                    </label>
                                    <textarea
                                        id="medicamentos"
                                        name="medicamentos"
                                        value={formData.medicamentos}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nombre del medicamento, dosis, frecuencia..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label htmlFor="alergias" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Tienes alergias alimentarias?
                                    </label>
                                    <textarea
                                        id="alergias"
                                        name="alergias"
                                        value={formData.alergias}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label htmlFor="intolerancias" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Tienes intolerancias alimentarias?
                                    </label>
                                    <textarea
                                        id="intolerancias"
                                        name="intolerancias"
                                        value={formData.intolerancias}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 4: Actividad Física */}
                    {currentStep === 4 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Actividad Física</h2>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <label htmlFor="nivelActividad" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Cómo describirías tu nivel de actividad física diaria? *
                                    </label>
                                    <select
                                        id="nivelActividad"
                                        name="nivelActividad"
                                        value={formData.nivelActividad}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="sedentario">Sedentario (poco o ningún ejercicio)</option>
                                        <option value="ligero">Ligeramente activo (ejercicio ligero 1-3 días/semana)</option>
                                        <option value="moderado">Moderadamente activo (ejercicio moderado 3-5 días/semana)</option>
                                        <option value="activo">Muy activo (ejercicio intenso 6-7 días/semana)</option>
                                        <option value="extremo">Extremadamente activo (ejercicio muy intenso o trabajo físico)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ¿Qué tipo de ejercicio realizas? (Selecciona todos los que apliquen)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {['Caminar', 'Correr', 'Ciclismo', 'Natación', 'Entrenamiento con pesas', 'Yoga', 'Pilates', 'Crossfit', 'Deportes de equipo', 'HIIT'].map(exercise => (
                                            <div key={exercise} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`ejercicio-${exercise}`}
                                                    value={exercise}
                                                    checked={formData.tipoEjercicio.includes(exercise)}
                                                    onChange={(e) => handleCheckboxChange(e, 'tipoEjercicio')}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`ejercicio-${exercise}`} className="ml-2 text-sm text-gray-700">
                                                    {exercise}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="otroEjercicio" className="block text-sm font-medium text-gray-700 mb-1">
                                        Otros tipos de ejercicio:
                                    </label>
                                    <input
                                        type="text"
                                        id="otroEjercicio"
                                        name="otroEjercicio"
                                        value={formData.otroEjercicio}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="frecuenciaEjercicio" className="block text-sm font-medium text-gray-700 mb-1">
                                            ¿Con qué frecuencia haces ejercicio?
                                        </label>
                                        <select
                                            id="frecuenciaEjercicio"
                                            name="frecuenciaEjercicio"
                                            value={formData.frecuenciaEjercicio}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="nunca">Nunca</option>
                                            <option value="1_vez_semana">1 vez a la semana</option>
                                            <option value="2_3_semana">2-3 veces a la semana</option>
                                            <option value="4_5_semana">4-5 veces a la semana</option>
                                            <option value="diario">Diariamente</option>
                                            <option value="2_veces_dia">Más de una vez al día</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="duracionEjercicio" className="block text-sm font-medium text-gray-700 mb-1">
                                            Duración promedio por sesión:
                                        </label>
                                        <select
                                            id="duracionEjercicio"
                                            name="duracionEjercicio"
                                            value={formData.duracionEjercicio}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="menos_30min">Menos de 30 minutos</option>
                                            <option value="30_45min">30-45 minutos</option>
                                            <option value="45_60min">45-60 minutos</option>
                                            <option value="60_90min">60-90 minutos</option>
                                            <option value="mas_90min">Más de 90 minutos</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 5: Hábitos Alimentarios */}
                    {currentStep === 5 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Hábitos Alimentarios</h2>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <label htmlFor="comidasDiarias" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Cuántas comidas realizas al día? *
                                    </label>
                                    <select
                                        id="comidasDiarias"
                                        name="comidasDiarias"
                                        value={formData.comidasDiarias}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="1_2">1-2 comidas</option>
                                        <option value="3">3 comidas</option>
                                        <option value="4_5">4-5 comidas</option>
                                        <option value="mas_5">Más de 5 comidas</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="horariosComidas" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Tus horarios de comida son regulares?
                                    </label>
                                    <select
                                        id="horariosComidas"
                                        name="horariosComidas"
                                        value={formData.horariosComidas}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="muy_regulares">Sí, muy regulares</option>
                                        <option value="bastante_regulares">Bastante regulares</option>
                                        <option value="variables">Variables</option>
                                        <option value="irregulares">No, son bastante irregulares</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="comidasFuera" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Con qué frecuencia comes fuera de casa?
                                    </label>
                                    <select
                                        id="comidasFuera"
                                        name="comidasFuera"
                                        value={formData.comidasFuera}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="nunca">Nunca</option>
                                        <option value="1_2_semana">1-2 veces por semana</option>
                                        <option value="3_5_semana">3-5 veces por semana</option>
                                        <option value="diario">A diario</option>
                                        <option value="casi_siempre">Casi todas las comidas</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="comidaFavorita" className="block text-sm font-medium text-gray-700 mb-1">
                                            Comidas/platos favoritos:
                                        </label>
                                        <textarea
                                            id="comidaFavorita"
                                            name="comidaFavorita"
                                            value={formData.comidaFavorita}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label htmlFor="alimentosDisgusto" className="block text-sm font-medium text-gray-700 mb-1">
                                            Alimentos que no te gustan:
                                        </label>
                                        <textarea
                                            id="alimentosDisgusto"
                                            name="alimentosDisgusto"
                                            value={formData.alimentosDisgusto}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        ></textarea>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="desayunoTipico" className="block text-sm font-medium text-gray-700 mb-1">
                                        Describe tu desayuno típico:
                                    </label>
                                    <textarea
                                        id="desayunoTipico"
                                        name="desayunoTipico"
                                        value={formData.desayunoTipico}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label htmlFor="almuerzoTipico" className="block text-sm font-medium text-gray-700 mb-1">
                                        Describe tu almuerzo/comida típica:
                                    </label>
                                    <textarea
                                        id="almuerzoTipico"
                                        name="almuerzoTipico"
                                        value={formData.almuerzoTipico}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label htmlFor="cenaTipico" className="block text-sm font-medium text-gray-700 mb-1">
                                        Describe tu cena típica:
                                    </label>
                                    <textarea
                                        id="cenaTipico"
                                        name="cenaTipico"
                                        value={formData.cenaTipico}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 6: Preferencias y Estilo de Vida */}
                    {currentStep === 6 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Preferencias y Estilo de Vida</h2>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <label htmlFor="dietaEspecial" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Sigues algún tipo de dieta especial?
                                    </label>
                                    <select
                                        id="dietaEspecial"
                                        name="dietaEspecial"
                                        value={formData.dietaEspecial}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="no">No</option>
                                        <option value="vegetariano">Vegetariana</option>
                                        <option value="vegano">Vegana</option>
                                        <option value="pescetariano">Pescetariana</option>
                                        <option value="keto">Cetogénica/Keto</option>
                                        <option value="paleo">Paleo</option>
                                        <option value="mediterranea">Mediterránea</option>
                                        <option value="otra">Otra</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Restricciones dietéticas (Selecciona todas las que apliquen):
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {['Sin gluten', 'Sin lactosa', 'Sin frutos secos', 'Sin huevo', 'Sin mariscos', 'Bajo en sodio', 'Bajo en azúcar', 'Baja en grasas'].map(restriction => (
                                            <div key={restriction} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`restriccion-${restriction}`}
                                                    value={restriction}
                                                    checked={formData.restricciones.includes(restriction)}
                                                    onChange={(e) => handleCheckboxChange(e, 'restricciones')}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`restriccion-${restriction}`} className="ml-2 text-sm text-gray-700">
                                                    {restriction}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="ocupacion" className="block text-sm font-medium text-gray-700 mb-1">
                                            Ocupación/Profesión:
                                        </label>
                                        <input
                                            type="text"
                                            id="ocupacion"
                                            name="ocupacion"
                                            value={formData.ocupacion}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="horasSueno" className="block text-sm font-medium text-gray-700 mb-1">
                                            ¿Cuántas horas duermes por noche en promedio?
                                        </label>
                                        <select
                                            id="horasSueno"
                                            name="horasSueno"
                                            value={formData.horasSueno}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="menos_5">Menos de 5 horas</option>
                                            <option value="5_6">5-6 horas</option>
                                            <option value="7_8">7-8 horas</option>
                                            <option value="mas_8">Más de 8 horas</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="nivelEstres" className="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Cómo valorarías tu nivel de estrés habitual?
                                    </label>
                                    <select
                                        id="nivelEstres"
                                        name="nivelEstres"
                                        value={formData.nivelEstres}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="muy_bajo">Muy bajo</option>
                                        <option value="bajo">Bajo</option>
                                        <option value="moderado">Moderado</option>
                                        <option value="alto">Alto</option>
                                        <option value="muy_alto">Muy alto</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="informacionAdicional" className="block text-sm font-medium text-gray-700 mb-1">
                                        Información adicional que quieras compartir:
                                    </label>
                                    <textarea
                                        id="informacionAdicional"
                                        name="informacionAdicional"
                                        value={formData.informacionAdicional}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Cualquier otra información relevante para tu plan nutricional..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botones de navegación */}
                    <div className="flex justify-between mt-6">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Anterior
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < totalSteps ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                Siguiente
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                            >
                                Enviar cuestionario
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}