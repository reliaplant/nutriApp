"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PlusCircleIcon, TrashIcon, XCircleIcon } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';

// Importaciones correctas del servicio firebase
import { db, authService } from '@/app/service/firebase';

// Tipos
interface Ingredient {
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Constantes
const MAX_INGREDIENTS = 8000; // 80% del límite de 1MB
const INGREDIENTS_DOC_ID = 'all-ingredients';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    name: '',
    quantity: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar ingredientes
  useEffect(() => {
    async function loadIngredients() {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          toast.error('Debes iniciar sesión para ver los ingredientes');
          setLoading(false);
          return;
        }
        
        // Usar la colección 'ingredients' con el ID del usuario actual
        const ingredientsRef = doc(db, 'ingredients', `${currentUser.uid}_${INGREDIENTS_DOC_ID}`);
        const docSnap = await getDoc(ingredientsRef);
        
        if (docSnap.exists()) {
          setIngredients(docSnap.data().items || []);
        } else {
          // Crear documento si no existe
          await setDoc(ingredientsRef, { items: [] });
          setIngredients([]);
        }
      } catch (error) {
        console.error('Error al cargar ingredientes:', error);
        toast.error('Error al cargar ingredientes');
      } finally {
        setLoading(false);
      }
    }
    
    loadIngredients();
  }, []);

  // Guardar ingredientes
  const saveIngredients = async (updatedIngredients: Ingredient[]) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        toast.error('Debes iniciar sesión para guardar ingredientes');
        return;
      }
      
      const ingredientsRef = doc(db, 'ingredients', `${currentUser.uid}_${INGREDIENTS_DOC_ID}`);
      await setDoc(ingredientsRef, { items: updatedIngredients });
      toast.success('Ingredientes actualizados');
    } catch (error) {
      console.error('Error al guardar ingredientes:', error);
      toast.error('Error al guardar ingredientes');
    }
  };

  // Añadir ingrediente
  const addIngredient = async () => {
    if (!newIngredient.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    if (ingredients.length >= MAX_INGREDIENTS) {
      toast.error('Límite de ingredientes alcanzado');
      return;
    }

    if (ingredients.some(ing => ing.name.toLowerCase() === newIngredient.name.toLowerCase())) {
      toast.error('Este ingrediente ya existe');
      return;
    }
    
    const updatedIngredients = [...ingredients, newIngredient];
    setIngredients(updatedIngredients);
    await saveIngredients(updatedIngredients);
    
    // Reset form
    setNewIngredient({
      name: '',
      quantity: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
    
    setShowAddModal(false);
  };

  // Eliminar ingrediente
  const deleteIngredient = async (index: number) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(updatedIngredients);
    await saveIngredients(updatedIngredients);
  };

  // Filtrar ingredientes
  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Ingredientes</h1>
      
      {/* Estadísticas */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Total de ingredientes: {ingredients.length}</h2>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  ingredients.length > MAX_INGREDIENTS * 0.9 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${(ingredients.length / MAX_INGREDIENTS) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {Math.round((ingredients.length / MAX_INGREDIENTS) * 100)}% del límite
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            disabled={ingredients.length >= MAX_INGREDIENTS}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Añadir ingrediente
          </button>
        </div>
      </div>
      
      {/* Buscador */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar ingredientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Tabla de ingredientes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Cargando ingredientes...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calorías
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proteína
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carbohidratos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grasas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.map((ingredient, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{ingredient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ingredient.calories}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ingredient.protein}g</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ingredient.carbs}g</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ingredient.fat}g</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => deleteIngredient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron ingredientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal de añadir ingrediente */}
      {showAddModal && (
        <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-black opacity-30" />
            
            <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
              <div className="absolute top-4 right-4">
                <button onClick={() => setShowAddModal(false)}>
                  <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
                </button>
              </div>
              
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 mb-4">
                Añadir nuevo ingrediente
              </Dialog.Title>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (g)</label>
                  <input
                    type="number"
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({...newIngredient, quantity: +e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calorías</label>
                  <input
                    type="number"
                    value={newIngredient.calories}
                    onChange={(e) => setNewIngredient({...newIngredient, calories: +e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proteína (g)</label>
                    <input
                      type="number"
                      value={newIngredient.protein}
                      onChange={(e) => setNewIngredient({...newIngredient, protein: +e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbos (g)</label>
                    <input
                      type="number"
                      value={newIngredient.carbs}
                      onChange={(e) => setNewIngredient({...newIngredient, carbs: +e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grasas (g)</label>
                    <input
                      type="number"
                      value={newIngredient.fat}
                      onChange={(e) => setNewIngredient({...newIngredient, fat: +e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={addIngredient}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Guardar ingrediente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}