'use client'

import React, { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp,
  where, serverTimestamp, increment
} from 'firebase/firestore';
import { db, authService } from '@/app/service/firebase';
import { Pencil, Trash2, Search, Filter, ArrowDown, ArrowUp, X, Save, AlertCircle } from 'lucide-react';
import { MealOption } from '@/app/consulta/components/meals';

// Definición de interfaz para comidas guardadas
interface SavedMeal {
  id: string;
  name: string;
  category: string;
  mealOption: MealOption;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: any;
  usageCount: number;
  lastUsedDate: any;
}

// Categorías disponibles para las comidas
const categoryLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snack: 'Snack',
  postre: 'Postre',
  bebida: 'Bebida',
  general: 'General',
};

export default function SavedMealsPage() {
  // Estados
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<SavedMeal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Cargar comidas guardadas al inicio
  useEffect(() => {
    async function initLoad() {
      // Asegurarse que la autenticación esté lista antes de cargar datos
      await authService.getAuthStatePromise();
      loadSavedMeals();
    }
    
    initLoad();
  }, []);
  
  // Función para cargar comidas guardadas
  const loadSavedMeals = async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Necesitas iniciar sesión para ver tus comidas guardadas');
        setLoading(false);
        return;
      }
      
      const q = query(
        collection(db, `users/${user.uid}/savedMealOptions`), 
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setSavedMeals([]);
        setLoading(false);
        return;
      }
      
      const meals: SavedMeal[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        meals.push({ 
          id: doc.id, 
          ...data,
          usageCount: data.usageCount || 0,
          lastUsedDate: data.lastUsedDate || data.createdAt
        } as SavedMeal);
      });
      
      setSavedMeals(meals);
    } catch (err) {
      console.error('Error al cargar opciones guardadas:', err);
      setError('Error al cargar opciones guardadas');
    } finally {
      setLoading(false);
    }
  };
  
  // Calcular puntuación de relevancia
  const calculateRelevanceScore = (meal: SavedMeal) => {
    const usageScore = meal.usageCount || 0;
    
    // Recencia (0-1)
    let recencyScore = 0;
    if (meal.lastUsedDate) {
      const now = new Date().getTime();
      const lastUsed = meal.lastUsedDate.toDate().getTime();
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
      recencyScore = Math.max(0, 1 - (now - lastUsed) / oneMonthMs);
    }
    
    // Ponderación igual para uso y recencia
    return (usageScore * 0.5) + (recencyScore * 0.5);
  };
  
  // Ordenar comidas
  const sortedMeals = [...savedMeals].sort((a, b) => {
    switch(sortBy) {
      case 'name':
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'calories':
        return sortDirection === 'asc'
          ? a.totalNutrition.calories - b.totalNutrition.calories
          : b.totalNutrition.calories - a.totalNutrition.calories;
      case 'usageCount':
        return sortDirection === 'asc'
          ? (a.usageCount || 0) - (b.usageCount || 0)
          : (b.usageCount || 0) - (a.usageCount || 0);
      case 'lastUsed':
        const dateA = a.lastUsedDate ? a.lastUsedDate.toDate().getTime() : 0;
        const dateB = b.lastUsedDate ? b.lastUsedDate.toDate().getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      default: // relevance
        return sortDirection === 'asc'
          ? calculateRelevanceScore(a) - calculateRelevanceScore(b)
          : calculateRelevanceScore(b) - calculateRelevanceScore(a);
    }
  });
  
  // Filtrar comidas
  const filteredMeals = sortedMeals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? meal.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });
  
  // Manejar cambio de ordenamiento
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortDirection('desc'); // Por defecto, orden descendente al cambiar criterio
    }
  };
  
  // Eliminar una comida
  const deleteSavedMeal = async (id: string) => {
    setIsDeleting(true);
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Debes iniciar sesión para eliminar comidas');
        return;
      }
      
      await deleteDoc(doc(db, `users/${user.uid}/savedMealOptions`, id));
      
      setSavedMeals(prev => prev.filter(meal => meal.id !== id));
      setIsDeleteModalOpen(false);
      setMealToDelete(null);
    } catch (err) {
      console.error('Error al eliminar comida guardada:', err);
      setError('Error al eliminar comida');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Guardar cambios en comida editada
  const saveEditedMeal = async () => {
    if (!editingMeal) return;
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Debes iniciar sesión para actualizar comidas');
        return;
      }
      
      const mealRef = doc(db, `users/${user.uid}/savedMealOptions`, editingMeal.id);
      await updateDoc(mealRef, {
        name: editingMeal.name,
        category: editingMeal.category,
        mealOption: {
          content: editingMeal.mealOption.content,
          instructions: editingMeal.mealOption.instructions,
          ingredients: editingMeal.mealOption.ingredients,
          isSelectedForSummary: editingMeal.mealOption.isSelectedForSummary
        }
      });
      
      // Actualizar estado local
      setSavedMeals(prev => prev.map(meal => 
        meal.id === editingMeal.id ? editingMeal : meal
      ));
      
      setIsEditModalOpen(false);
      setEditingMeal(null);
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      setError('Error al guardar cambios');
    }
  };
  
  // Obtener categorías únicas
  const categories = Array.from(new Set(savedMeals.map(meal => meal.category)))
    .filter(Boolean); // Filtrar valores nulos o undefined

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mi biblioteca de comidas</h1>
      
      {/* Búsqueda y filtros */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 py-2.5 pr-4 border border-gray-300 rounded-lg w-full"
          />
        </div>
        
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                selectedCategory === null
                  ? 'bg-green-100 text-green-800 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  selectedCategory === cat
                    ? 'bg-green-100 text-green-800 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Opciones de ordenamiento */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {filteredMeals.length} {filteredMeals.length === 1 ? 'comida' : 'comidas'}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-1">Ordenar:</span>
          
          {[
            { key: 'relevance', label: 'Relevancia' },
            { key: 'usageCount', label: 'Uso' },
            { key: 'lastUsed', label: 'Fecha' },
            { key: 'calories', label: 'Calorías' }
          ].map(option => (
            <button 
              key={option.key}
              onClick={() => handleSort(option.key)}
              className={`px-2 py-1 text-xs rounded ${
                sortBy === option.key 
                  ? 'bg-green-100 text-green-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {option.label}
              {sortBy === option.key && (
                sortDirection === 'desc' ? 
                  <ArrowDown className="w-3 h-3 inline-block ml-1" /> : 
                  <ArrowUp className="w-3 h-3 inline-block ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Listado de comidas */}
      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-gray-400">
            {searchTerm || selectedCategory 
              ? "No se encontraron comidas para tu búsqueda" 
              : "No tienes comidas guardadas aún"}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map(meal => (
            <div 
              key={meal.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-all"
            >
              <div className="p-3 border-b flex justify-between items-center">
                <h3 className="font-medium text-gray-800 line-clamp-1">{meal.name}</h3>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => {
                      setEditingMeal(meal);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setMealToDelete(meal);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-3">
                <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {meal.mealOption.content || 'Sin descripción'}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {categoryLabels[meal.category] || meal.category || 'General'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{Math.round(meal.totalNutrition.calories)} kcal</div>
                    <div className="text-xs text-gray-500">
                      Usada {meal.usageCount || 0} {(meal.usageCount || 0) === 1 ? 'vez' : 'veces'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de edición */}
      {isEditModalOpen && editingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-50/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Editar opción de comida</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Nombre */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editingMeal.name}
                  onChange={(e) => setEditingMeal({...editingMeal, name: e.target.value})}
                />
              </div>
              
              {/* Categoría */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editingMeal.category}
                  onChange={(e) => setEditingMeal({...editingMeal, category: e.target.value})}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              {/* Descripción */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editingMeal.mealOption.content}
                  onChange={(e) => setEditingMeal({
                    ...editingMeal, 
                    mealOption: {...editingMeal.mealOption, content: e.target.value}
                  })}
                  rows={4}
                />
              </div>
              
              {/* Instrucciones */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editingMeal.mealOption.instructions || ''}
                  onChange={(e) => setEditingMeal({
                    ...editingMeal, 
                    mealOption: {...editingMeal.mealOption, instructions: e.target.value}
                  })}
                  rows={4}
                />
              </div>
              
              {/* Estadísticas */}
              <div className="border rounded-lg p-3 bg-gray-50 mb-4">
                <h4 className="text-sm font-medium mb-2 text-gray-700">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Veces usada</span>
                    <p className="font-medium">{editingMeal.usageCount || 0}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Última vez usada</span>
                    <p className="font-medium">
                      {editingMeal.lastUsedDate ? 
                        editingMeal.lastUsedDate.toDate().toLocaleDateString() : 
                        'Nunca'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedMeal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && mealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center text-red-500 mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar <strong>"{mealToDelete.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteSavedMeal(mealToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}