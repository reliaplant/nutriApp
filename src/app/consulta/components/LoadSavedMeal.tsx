import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Utensils } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, authService } from '@/app/shared/firebase';
import { MealOption } from './meals';
import { categoryLabels, categoryColors, MealCategory } from '@/app/comidas/constants';

interface SavedMealOption {
  id: string;
  name: string;
  category: MealCategory;
  mealOption: MealOption;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: any;
}

interface LoadSavedMealProps {
  onSelect: (option: MealOption) => void;
}

const LoadSavedMeal: React.FC<LoadSavedMealProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedOptions, setSavedOptions] = useState<SavedMealOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | null>(null);

  // Cargar las opciones guardadas
  const loadSavedOptions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Necesitas iniciar sesión para ver tus opciones guardadas');
        setLoading(false);
        return;
      }
      
      const q = query(
        collection(db, `users/${user.uid}/savedMealOptions`), 
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setSavedOptions([]);
        setLoading(false);
        return;
      }
      
      const options: SavedMealOption[] = [];
      snapshot.forEach(doc => {
        options.push({ 
          id: doc.id, 
          ...doc.data() 
        } as SavedMealOption);
      });
      
      setSavedOptions(options);
    } catch (err) {
      console.error('Error al cargar opciones guardadas:', err);
      setError('Error al cargar opciones guardadas');
    } finally {
      setLoading(false);
    }
  };

  // Abrir el modal y cargar datos
  const handleOpenModal = () => {
    setIsOpen(true);
    loadSavedOptions();
  };

  const handleSelectOption = (option: SavedMealOption) => {
    console.log('Preparando opción para cargar:', option);
    
    const mealOption: MealOption = {
      name: option.name, // Asegurarnos de pasar el nombre de la opción guardada
      content: option.mealOption.content || '',
      instructions: option.mealOption.instructions || '',
      isSelectedForSummary: option.mealOption.isSelectedForSummary || false,
      ingredients: option.mealOption.ingredients.map(ingredient => ({
        name: ingredient.name || '',
        quantity: Number(ingredient.quantity) || 0,
        calories: Number(ingredient.calories) || 0,
        protein: Number(ingredient.protein) || 0,
        carbs: Number(ingredient.carbs) || 0,
        fat: Number(ingredient.fat) || 0
      }))
    };

    console.log('Opción procesada para cargar:', mealOption);
    onSelect(mealOption);
    setIsOpen(false);
  };

  // Filtrar opciones según búsqueda y categoría
  const filteredOptions = savedOptions.filter(option => {
    const matchesSearch = option.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? option.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Usar las categorías definidas en constants
  const categories = Object.entries(categoryLabels).map(([id, name]) => ({
    id: id as MealCategory,
    name
  }));

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center rounded-lg border border-green-600 text-green-600 px-3 py-1 text-xs hover:bg-green-50 transition-colors"
      >
        <Utensils className="w-3.5 h-3.5 mr-1" />
        Cargar guardadas
      </button>
      
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-50/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header con título y botón cerrar */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-green-600" />
                Opciones guardadas
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search & Filters - Simplificados */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-grow min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 py-2 pr-4 border border-gray-300 rounded-lg w-full"
                    autoFocus
                  />
                </div>
                {categories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center text-sm text-gray-600">
                      <Filter className="w-4 h-4 mr-1" />
                    </span>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-2.5 py-1 rounded-full text-xs ${
                        selectedCategory === null
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Todos
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-full text-xs ${
                          selectedCategory === cat.id
                            ? `${categoryColors[cat.id].bg} ${categoryColors[cat.id].text}`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Contenido - Lista de opciones simplificada */}
            <div className="flex-grow overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                  {error}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  {savedOptions.length === 0 
                    ? "No tienes opciones de comida guardadas" 
                    : "No se encontraron resultados para tu búsqueda"}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredOptions.map((option) => (
                    <div 
                      key={option.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-green-200 transition-all cursor-pointer"
                      onClick={() => handleSelectOption(option)}
                    >
                      <div className="p-3 border-b flex justify-between items-start">
                        <h4 className="font-medium text-gray-800 line-clamp-1 flex-1">{option.name}</h4>
                        <div className="text-right">
                          <div className="text-sm font-bold ml-2 bg-green-50 px-2 py-0.5 rounded-lg">
                            {Math.round(option.totalNutrition.calories)} kcal
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {option.mealOption.content || 'Sin descripción'}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {option.mealOption.ingredients.length} ingredientes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer simplificado */}
            <div className="border-t p-3 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoadSavedMeal;