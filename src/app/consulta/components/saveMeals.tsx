import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Check, ChevronDown } from 'lucide-react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, authService } from '@/app/shared/firebase';
import { MealOption } from '@/app/consulta/components/meals';
import { categoryLabels, categoryColors, MealCategory } from '@/app/comidas/constants';

interface SaveMealOptionProps {
  mealName: string;
  option: MealOption;
  onSaveSuccess?: () => void;
}

const SaveMealOption: React.FC<SaveMealOptionProps> = ({ mealName, option, onSaveSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  // Usar el content como nombre inicial en lugar de combinarlo con la fecha
  const [savedName, setSavedName] = useState(option.content || 'Nueva opción');
  
  // Determinar categoría inicial basada en el nombre de la comida o la hora
  const getInitialCategory = (): MealCategory => {
    if (!mealName) return 'general';
    
    const lowerName = mealName.toLowerCase();
    
    if (lowerName.includes('desayun')) return 'desayuno';
    if (lowerName.includes('media mañana')) return 'mediaManana';
    if (lowerName.includes('almuerz')) return 'almuerzo';
    if (lowerName.includes('lunch') || lowerName.includes('meriend')) return 'lunchTarde';
    if (lowerName.includes('cena')) return 'cena';
    
    return 'general';
  };

  const [category, setCategory] = useState<MealCategory>(getInitialCategory());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Agregar ref para el menú desplegable
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cálculo de totales nutricionales
  const totalNutrition = {
    calories: option.ingredients.reduce((sum, ing) => sum + (ing.calories || 0), 0),
    protein: option.ingredients.reduce((sum, ing) => sum + (ing.protein || 0), 0),
    carbs: option.ingredients.reduce((sum, ing) => sum + (ing.carbs || 0), 0),
    fat: option.ingredients.reduce((sum, ing) => sum + (ing.fat || 0), 0)
  };

  const categories: { id: MealCategory; name: string }[] = Object.entries(categoryLabels).map(([id, name]) => ({
    id: id as MealCategory,
    name
  }));

  // Verificar si la opción es válida para guardar
  const hasValidIngredients = option.ingredients && 
    option.ingredients.length > 0 && 
    option.ingredients.every(ing => ing.name.trim() !== '');

  const getErrorMessage = () => {
    if (!option.ingredients || option.ingredients.length === 0) {
      return 'Debes agregar al menos un ingrediente';
    }
    if (!hasValidIngredients) {
      return 'Todos los ingredientes deben tener un nombre';
    }
    return '';
  };

  // Mostrar mensaje de error si no hay ingredientes o están vacíos
  const errorMessage = getErrorMessage();

  const handleSave = async () => {
    // Validación adicional antes de guardar
    if (!hasValidIngredients || !savedName.trim()) {
      setError('Debes agregar al menos un ingrediente antes de guardar');
      return;
    }

    setError('');
    setIsSaving(true);
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Debes iniciar sesión para guardar opciones de comida');
        setIsSaving(false);
        return;
      }
      
      const savedOptionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      await setDoc(doc(db, `users/${user.uid}/savedMealOptions`, savedOptionId), {
        name: savedName.trim(),
        category,
        mealOption: option,
        totalNutrition,
        createdAt: Timestamp.now()
      });
      
      setIsOpen(false);
      if (onSaveSuccess) onSaveSuccess();
      
    } catch (err) {
      console.error('Error al guardar opción de comida:', err);
      setError('Error al guardar. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasIngredients = option.ingredients && option.ingredients.length > 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-green-600 hover:text-green-700 flex items-center p-2 rounded-md hover:bg-green-50 text-xs"
        title="Guardar esta opción para usar después"
      >
        <Save className="w-4 h-4 mr-1" />
        Guardar opción
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-50/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            {/* Header con título y botón cerrar */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Guardar opción de comida</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center">
                  <span className="text-red-600 mr-2">⚠️</span>
                  {errorMessage}
                </div>
              )}
              
              {/* Nombre y Categoría en la misma línea */}
              <div className="flex gap-4 mb-6">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la receta</label>
                  <input
                    type="text"
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-lg"
                    value={savedName}
                    onChange={(e) => setSavedName(e.target.value)}
                    placeholder="Ej: Pollo con arroz y vegetales"
                  />
                </div>
                <div className="w-52 relative" ref={categoryMenuRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 
                      border border-gray-300 rounded-lg bg-white
                      hover:bg-gray-50 transition-colors
                      ${categoryColors[category].text}
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span 
                        className={`w-2 h-2 rounded-full ${categoryColors[category].bg}`}
                      />
                      {categoryLabels[category]}
                    </span>
                    <ChevronDown size={16} className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Menú desplegable mejorado */}
                  {isCategoryOpen && (
                    <div className="absolute z-50 w-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200">
                      {Object.entries(categoryLabels).map(([id, name]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setCategory(id as MealCategory);
                            setIsCategoryOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-2 px-3 py-2 text-sm
                            hover:bg-gray-50 transition-colors
                            ${category === id ? `${categoryColors[id as MealCategory].text} font-medium` : 'text-gray-700'}
                          `}
                        >
                          <span 
                            className={`
                              w-2 h-2 rounded-full
                              ${categoryColors[id as MealCategory].bg}
                            `}
                          />
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  value={option.content || ''}
                  rows={2}
                  readOnly
                  placeholder="Descripción detallada de los ingredientes y cantidades"
                />
              </div>

              {/* Resumen nutricional en tarjetas */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <span className="block text-xs text-gray-500 mb-1">Calorías</span>
                  <span className="text-lg font-bold text-gray-900">{Math.round(totalNutrition.calories)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <span className="block text-xs text-gray-500 mb-1">Proteína</span>
                  <span className="text-lg font-bold text-gray-900">{totalNutrition.protein.toFixed(1)}g</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <span className="block text-xs text-gray-500 mb-1">Carbos</span>
                  <span className="text-lg font-bold text-gray-900">{totalNutrition.carbs.toFixed(1)}g</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <span className="block text-xs text-gray-500 mb-1">Grasas</span>
                  <span className="text-lg font-bold text-gray-900">{totalNutrition.fat.toFixed(1)}g</span>
                </div>
              </div>

              {/* Información adicional colapsada */}
              <div className="text-xs text-gray-500 mb-6">
                {option.instructions && 'Incluye instrucciones de preparación'}
              </div>
              
              {/* Botones */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`
                    px-4 py-2 rounded-lg font-medium flex items-center
                    ${hasValidIngredients && savedName.trim()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  onClick={handleSave}
                  disabled={!hasValidIngredients || !savedName.trim() || isSaving}
                  title={errorMessage || (!savedName.trim() ? "Ingresa un nombre para la opción" : "")}
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveMealOption;