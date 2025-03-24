'use client'

import React, { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, getDocs, doc, Timestamp
} from 'firebase/firestore';
import { db, authService } from '@/app/service/firebase';
import { Search, ArrowDown, ArrowUp, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { MealOption } from '@/app/consulta/components/meals';
import MealsBiblioteca from './components/mealsBiblioteca';
import { Merienda } from 'next/font/google';

// Definición de interfaz para comidas guardadas
export interface SavedMeal {
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
  imageUrl?: string;
}

// Categorías disponibles para las comidas
export const categoryLabels: Record<string, string> = {
  general: 'General',
  desayuno: 'Desayuno',
  mediaManana: 'Media Mañana',
  almuerzo: 'Almuerzo',
  lunchTarde: 'Lunch de Tarde',
  cena: 'Cena',
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
  const [mealToEdit, setMealToEdit] = useState<SavedMeal | null>(null);
  const [mealToDelete, setMealToDelete] = useState<SavedMeal | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
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
  
  // Añade esta función auxiliar para manejar diferentes tipos de fechas
  const getTimestamp = (dateField: any): number => {
    if (!dateField) return 0;
    
    // Si es un Timestamp de Firestore con método toDate()
    if (dateField && typeof dateField.toDate === 'function') {
      return dateField.toDate().getTime();
    }
    
    // Si ya es un Date
    if (dateField instanceof Date) {
      return dateField.getTime();
    }
    
    // Si es un número (unix timestamp)
    if (typeof dateField === 'number') {
      return dateField;
    }
    
    // Si es un string, intentar convertirlo
    if (typeof dateField === 'string') {
      return new Date(dateField).getTime();
    }
    
    // Si no pudimos procesarlo, devolver 0
    return 0;
  };

  // Calcular puntuación de relevancia
  const calculateRelevanceScore = (meal: SavedMeal) => {
    const usageScore = meal.usageCount || 0;
    
    // Recencia (0-1)
    let recencyScore = 0;
    if (meal.lastUsedDate) {
      const now = new Date().getTime();
      const lastUsed = getTimestamp(meal.lastUsedDate);
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
        const dateA = getTimestamp(a.lastUsedDate);
        const dateB = getTimestamp(b.lastUsedDate);
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
  
  // Actualizar la lista de comidas después de editar o eliminar
  const onMealsUpdated = (updatedMeals: SavedMeal[]) => {
    setSavedMeals(updatedMeals);
    // Cerrar modales después de actualizar
    setIsEditorOpen(false);
    setIsDeleteConfirmOpen(false);
    setIsCreateModalOpen(false);
    setMealToEdit(null);
    setMealToDelete(null);
  };
  
  // Obtener categorías únicas
  const categories = Array.from(new Set(savedMeals.map(meal => meal.category)))
    .filter(Boolean); // Filtrar valores nulos o undefined

  // Funciones para manejar edición/eliminación que abrirán el componente hijo
  const handleEditMeal = (meal: SavedMeal) => {
    setMealToEdit(meal);
    setIsEditorOpen(true);
  };

  const handleDeleteMeal = (meal: SavedMeal) => {
    setMealToDelete(meal);
    setIsDeleteConfirmOpen(true);
  };

  // Nueva función para abrir modal de creación
  const handleCreateMeal = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="p-8">
      {/* Header y controles - Todo en una sola fila */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Título y botón de crear */}
        <div className="flex items-center gap-4 mr-8">
          <h1 className="text-xl font-bold">Tus comidas</h1>
          
          <button
            onClick={handleCreateMeal}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center text-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            Crear
          </button>
        </div>
        
        {/* Búsqueda */}
        <div className="relative w-48 md:w-60">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 py-1.5 pr-2 border border-gray-300 rounded-lg w-full text-sm"
          />
        </div>
        
        {/* Filtro de categorías */}
        <div className="flex items-center flex-wrap gap-1">
            <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2 py-1 rounded-full text-xs ${
              selectedCategory === null 
              ? 'bg-green-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            >
            Todas
            </button>

          {/* Mostrar todas las categorías disponibles en vez de solo las existentes */}
          {Object.entries(categoryLabels).map(([value, label]) => {
            const categoryColors = {
              desayuno: 'bg-red-100 text-red-900',
              mediaManana: 'bg-yellow-100 text-yellow-900', 
              almuerzo: 'bg-blue-100 text-blue-900',
              lunchTarde: 'bg-green-100 text-green-900',
              cena: 'bg-purple-100 text-purple-900',
              general: 'bg-gray-600 text-gray-200'
            };

            return (
              <button
          key={value}
          onClick={() => setSelectedCategory(value)}
          className={`px-2 py-1 rounded-full text-xs ${
            selectedCategory === value
              ? categoryColors[value as keyof typeof categoryColors]
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
              >
          {label}
              </button>
            );
          })}
          

        </div>
        
        {/* Contador y opciones de ordenamiento */}
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-gray-500 whitespace-nowrap">
            {filteredMeals.length} {filteredMeals.length === 1 ? 'comida' : 'comidas'}
          </span>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-500 mr-1">Ordenar:</span>
            
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
      </div>
      
      {/* Contenido principal - sin cambios */}
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
          {!searchTerm && !selectedCategory && (
            <button
              onClick={handleCreateMeal}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Crear tu primera comida
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map(meal => (
            <div 
              key={meal.id}
              className="rounded border shadow-sm border-gray-300 overflow-hidden hover:shadow-md transition-all flex flex-col h-full"
            >
              <div className="flex">
                {/* Imagen de la comida a la izquierda (cuadrada) */}
                <div className="w-36 h-36 overflow-hidden shrink-0">
                  {meal.imageUrl ? (
                    <img 
                      src={meal.imageUrl} 
                      alt={meal.name}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Sin imagen</span>
                    </div>
                  )}
                </div>
                
                {/* Contenido principal a la derecha */}
                <div className="flex-1 p-3 flex flex-col">
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-800 line-clamp-1 mb-1">{meal.name || 'Sin nombre'}</h3>
                    <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {meal.mealOption.content || 'Sin descripción'}
                    </div>
                  </div>
                  
                  {/* Fila con categoría, calorías y botones de acción - siempre al final */}
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center space-x-3">
                      {/* Categoría con colores personalizados */}
                      {(() => {
                        // Colores para cada categoría
                        const categoryColors: Record<string, {bg: string, text: string}> = {
                          general: {bg: 'bg-gray-100', text: 'text-gray-600'},
                          desayuno: {bg: 'bg-red-100', text: 'text-red-800'}, 
                          mediaManana: {bg: 'bg-yellow-100', text: 'text-yellow-800'},
                          almuerzo: {bg: 'bg-blue-100', text: 'text-blue-800'},
                          lunchTarde: {bg: 'bg-green-100', text: 'text-green-800'},
                          cena: {bg: 'bg-purple-100', text: 'text-purple-800'}
                        };
                        const { bg, text } = categoryColors[meal.category] || categoryColors.general;
                        
                        return (
                          <span className={`text-xs ${bg} ${text} px-2 py-0.5 rounded`}>
                            {categoryLabels[meal.category] || meal.category || 'General'}
                          </span>
                        );
                      })()}
                      
                      {/* Calorías */}
                      <div className="text-xs font-bold text-gray-700">{Math.round(meal.totalNutrition.calories)} kcal</div>
                    </div>
                    
                    {/* Botones de acción */}
                      <div className="flex items-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                        onClick={() => handleEditMeal(meal)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        title="Editar"
                        >
                        <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                        onClick={() => handleDeleteMeal(meal)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        title="Eliminar"
                        >
                        <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Componente hijo para manejo de modales de edición/eliminación/creación */}
      {(isEditorOpen || isDeleteConfirmOpen || isCreateModalOpen) && (
        <MealsBiblioteca 
          meals={savedMeals}
          loading={false}
          error=""
          onMealsUpdated={onMealsUpdated}
          searchTerm=""
          selectedCategory={null}
          editingMeal={mealToEdit}
          mealToDelete={mealToDelete}
          isEditModalOpen={isEditorOpen}
          isDeleteModalOpen={isDeleteConfirmOpen}
          isCreateModalOpen={isCreateModalOpen}
          onCloseEditModal={() => {
            setIsEditorOpen(false);
            setMealToEdit(null);
          }}
          onCloseDeleteModal={() => {
            setIsDeleteConfirmOpen(false);
            setMealToDelete(null);
          }}
          onCloseCreateModal={() => {
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}