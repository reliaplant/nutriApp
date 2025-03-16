import React, { useState } from 'react';
import { X, Save, Check } from 'lucide-react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, authService } from '@/app/service/firebase';
import { MealOption } from '@/app/consulta/components/meals';

interface SaveMealOptionProps {
  mealName: string;
  option: MealOption;
  onSaveSuccess?: () => void;
}

const SaveMealOption: React.FC<SaveMealOptionProps> = ({ mealName, option, onSaveSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedName, setSavedName] = useState(option.content || `${mealName || 'Comida'} - ${new Date().toLocaleDateString()}`);
  const [category, setCategory] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Cálculo de totales nutricionales
  const totalNutrition = {
    calories: option.ingredients.reduce((sum, ing) => sum + (ing.calories || 0), 0),
    protein: option.ingredients.reduce((sum, ing) => sum + (ing.protein || 0), 0),
    carbs: option.ingredients.reduce((sum, ing) => sum + (ing.carbs || 0), 0),
    fat: option.ingredients.reduce((sum, ing) => sum + (ing.fat || 0), 0)
  };

  const categories = [
    { id: 'desayuno', name: 'Desayuno' },
    { id: 'almuerzo', name: 'Almuerzo' },
    { id: 'cena', name: 'Cena' },
    { id: 'snack', name: 'Snack' },
    { id: 'postre', name: 'Postre' },
    { id: 'bebida', name: 'Bebida' },
    { id: 'general', name: 'General' },
  ];

  const handleSave = async () => {
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
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
                <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}
              
              {/* Nombre de la opción */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={savedName}
                  onChange={(e) => setSavedName(e.target.value)}
                  placeholder="Nombre para guardar esta opción"
                />
              </div>
              
              {/* Categoría - Ahora usando chips/pills en lugar de select */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        category === cat.id 
                          ? 'bg-green-100 text-green-800 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {category === cat.id && <Check className="inline w-3.5 h-3.5 mr-1" />}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Contenido a guardar */}
              <div className="border rounded-xl overflow-hidden shadow-sm">
                {/* Encabezado con valores nutricionales */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-4 flex justify-between items-center">
                  <h4 className="font-medium text-green-800">Resumen nutricional</h4>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div className="bg-white bg-opacity-70 px-3 py-1.5 rounded-lg text-center">
                      <span className="block text-xs text-gray-500">Calorías</span>
                      <span className="font-bold">{Math.round(totalNutrition.calories)}</span>
                    </div>
                    <div className="bg-white bg-opacity-70 px-3 py-1.5 rounded-lg text-center">
                      <span className="block text-xs text-gray-500">Proteína</span>
                      <span className="font-bold">{totalNutrition.protein.toFixed(1)}g</span>
                    </div>
                    <div className="bg-white bg-opacity-70 px-3 py-1.5 rounded-lg text-center">
                      <span className="block text-xs text-gray-500">Carbos</span>
                      <span className="font-bold">{totalNutrition.carbs.toFixed(1)}g</span>
                    </div>
                    <div className="bg-white bg-opacity-70 px-3 py-1.5 rounded-lg text-center">
                      <span className="block text-xs text-gray-500">Grasas</span>
                      <span className="font-bold">{totalNutrition.fat.toFixed(1)}g</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-5">
                  {/* Descripción */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="text-xs font-medium uppercase text-green-700 mb-1">Descripción</h5>
                    <p className="text-sm">{option.content || 'Sin descripción'}</p>
                  </div>
                  
                  {/* Layout de 2 columnas para ingredientes e instrucciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ingredientes */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="text-xs font-medium uppercase text-green-700 mb-2">
                        Ingredientes ({option.ingredients.length})
                      </h5>
                      <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar text-sm">
                        <table className="w-full border-collapse">
                          <tbody>
                            {option.ingredients.map((ing, idx) => (
                              <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className="py-1.5 font-medium">{ing.name}</td>
                                <td className="py-1.5 text-right">{ing.quantity}g</td>
                                <td className="py-1.5 text-right text-gray-600">{ing.calories} kcal</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Instrucciones */}
                    {option.instructions ? (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-xs font-medium uppercase text-green-700 mb-2">Instrucciones</h5>
                        <div className="text-sm max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          <p className="whitespace-pre-wrap">{option.instructions}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                        No hay instrucciones
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Botones */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all shadow-sm flex items-center"
                  onClick={handleSave}
                  disabled={isSaving || !savedName.trim()}
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar opción
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