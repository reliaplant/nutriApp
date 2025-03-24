'use client'

import React, { useState, useEffect } from 'react';
import { 
  doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp
} from 'firebase/firestore';
import { db, authService } from '@/app/service/firebase';
import { 
  TrashCan, 
  Strawberry, 
  ArrowUpRight,
  Save 
} from '@carbon/icons-react';
import { ChevronDown, X, AlertCircle } from 'lucide-react';
import { SavedMeal, categoryLabels } from '../page';
import IngredientTypeahead, { Ingredient } from '@/app/consulta/components/IngredientTypeahead';
import { MealOption } from '@/app/consulta/components/meals';
import { 
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { COMMON_INGREDIENTS } from '@/app/consulta/components/ingredientsData';

type IngredientNumericField = 'quantity' | 'calories' | 'protein' | 'carbs' | 'fat';

interface MealsBibliotecaProps {
  meals: SavedMeal[];
  loading: boolean;
  error: string;
  onMealsUpdated: (meals: SavedMeal[]) => void;
  searchTerm: string;
  selectedCategory: string | null;
  // Props adicionales para manejo de modales
  editingMeal: SavedMeal | null;
  mealToDelete: SavedMeal | null;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isCreateModalOpen: boolean;
  onCloseEditModal: () => void;
  onCloseDeleteModal: () => void;
  onCloseCreateModal: () => void;
}

const MealsBiblioteca: React.FC<MealsBibliotecaProps> = ({ 
  meals, 
  onMealsUpdated,
  editingMeal: initialEditingMeal,
  mealToDelete,
  isEditModalOpen,
  isDeleteModalOpen,
  isCreateModalOpen,
  onCloseEditModal,
  onCloseDeleteModal,
  onCloseCreateModal
}) => {
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(initialEditingMeal);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Estado para nuevo meal en caso de creación
  const [newMeal, setNewMeal] = useState<SavedMeal>({
    id: '',
    name: '',
    category: 'general',
    mealOption: {
      content: '',
      ingredients: [],
      isSelectedForSummary: true,
      instructions: ''
    },
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    createdAt: null,
    usageCount: 0,
    lastUsedDate: null
  });
  
  // Estado para ingredientes
  const [commonIngredients] = useState<Ingredient[]>(COMMON_INGREDIENTS);
  
  // Estado para upload
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Actualizar editingMeal si cambia desde props
  useEffect(() => {
    setEditingMeal(initialEditingMeal);
  }, [initialEditingMeal]);

  // Eliminar una comida
  const deleteSavedMeal = async (id: string) => {
    setIsDeleting(true);
    setActionError('');
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setActionError('Debes iniciar sesión para eliminar comidas');
        return;
      }
      
      // Obtener la comida para ver si tiene imagen
      const mealToDelete = meals.find(meal => meal.id === id);
      
      // Eliminar la imagen si existe
      if (mealToDelete?.imageUrl) {
        try {
          const storage = getStorage();
          const imageRef = storageRef(storage, mealToDelete.imageUrl);
          await deleteObject(imageRef);
        } catch (imgErr) {
          console.error('Error al eliminar imagen:', imgErr);
          // Continuamos con la eliminación de la comida aunque falle la eliminación de la imagen
        }
      }
      
      await deleteDoc(doc(db, `users/${user.uid}/savedMealOptions`, id));
      
      // Actualizar estado local y parent
      const updatedMeals = meals.filter(meal => meal.id !== id);
      onMealsUpdated(updatedMeals);
    } catch (err) {
      console.error('Error al eliminar comida guardada:', err);
      setActionError('Error al eliminar comida');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Guardar cambios en comida editada
  const saveEditedMeal = async () => {
    if (!editingMeal) return;
    setIsSaving(true);
    setActionError('');
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setActionError('Debes iniciar sesión para actualizar comidas');
        return;
      }
      
      // Calcular totales nutricionales
      const totalNutrition = calculateNutrition(editingMeal.mealOption.ingredients || []);
      
      // Subir imagen si hay una nueva
      let imageUrl = editingMeal.imageUrl;
      if (imageUpload) {
        imageUrl = await uploadImage();
      }
      
      const mealRef = doc(db, `users/${user.uid}/savedMealOptions`, editingMeal.id);
      await updateDoc(mealRef, {
        name: editingMeal.name,
        category: editingMeal.category,
        imageUrl,
        mealOption: {
          content: editingMeal.mealOption.content,
          instructions: editingMeal.mealOption.instructions,
          ingredients: editingMeal.mealOption.ingredients,
          isSelectedForSummary: editingMeal.mealOption.isSelectedForSummary
        },
        totalNutrition
      });
      
      // Actualizar estado local y parent
      const updatedMeals = meals.map(meal => 
        meal.id === editingMeal.id ? {...editingMeal, totalNutrition, imageUrl} : meal
      );
      onMealsUpdated(updatedMeals);
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      setActionError('Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Crear nueva comida
  const createNewMeal = async () => {
    setIsSaving(true);
    setActionError('');
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setActionError('Debes iniciar sesión para crear comidas');
        return;
      }
      
      // Calcular totales nutricionales
      const totalNutrition = calculateNutrition(newMeal.mealOption.ingredients || []);
      
      // Subir imagen si hay una
      let imageUrl = null;
      if (imageUpload) {
        imageUrl = await uploadImage();
      }
      
      const newMealData = {
        name: newMeal.name,
        category: newMeal.category,
        imageUrl,
        mealOption: {
          content: newMeal.mealOption.content,
          instructions: newMeal.mealOption.instructions,
          ingredients: newMeal.mealOption.ingredients,
          isSelectedForSummary: newMeal.mealOption.isSelectedForSummary
        },
        totalNutrition,
        createdAt: serverTimestamp(),
        usageCount: 0,
        lastUsedDate: serverTimestamp()
      };
      
      const docRef = await addDoc(
        collection(db, `users/${user.uid}/savedMealOptions`), 
        newMealData
      );
      
      // Actualizar estado local y parent
      const createdMeal: SavedMeal = {
        ...newMeal,
        id: docRef.id,
        imageUrl,
        totalNutrition,
        createdAt: newMealData.createdAt,
        lastUsedDate: newMealData.lastUsedDate
      };
      
      const updatedMeals = [...meals, createdMeal];
      onMealsUpdated(updatedMeals);
      
      // Limpiar el formulario
      setNewMeal({
        id: '',
        name: '',
        category: 'general',
        mealOption: {
          content: '',
          ingredients: [],
          isSelectedForSummary: true,
          instructions: ''
        },
        totalNutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        },
        createdAt: null,
        usageCount: 0,
        lastUsedDate: null
      });
      setImageUpload(null);
    } catch (err) {
      console.error('Error al crear comida:', err);
      setActionError('Error al crear comida');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Calcular totales de nutrición
  const calculateNutrition = (ingredients: Ingredient[]) => {
    const calories = ingredients.reduce((sum, i) => sum + (Number(i.calories) * Number(i.quantity) / 100 || 0), 0);
    const protein = ingredients.reduce((sum, i) => sum + (Number(i.protein) * Number(i.quantity) / 100 || 0), 0);
    const carbs = ingredients.reduce((sum, i) => sum + (Number(i.carbs) * Number(i.quantity) / 100 || 0), 0);
    const fat = ingredients.reduce((sum, i) => sum + (Number(i.fat) * Number(i.quantity) / 100 || 0), 0);
    
    return { calories, protein, carbs, fat };
  };

  // Funciones para manejar cambios en ingredientes para edición
  const addIngredient = () => {
    if (isEditModalOpen && editingMeal) {
      setEditingMeal({
        ...editingMeal,
        mealOption: {
          ...editingMeal.mealOption,
          ingredients: [
            ...(editingMeal.mealOption.ingredients || []),
            { name: '', quantity: 100, calories: 0, protein: 0, carbs: 0, fat: 0 }
          ]
        }
      });
    } else if (isCreateModalOpen) {
      setNewMeal({
        ...newMeal,
        mealOption: {
          ...newMeal.mealOption,
          ingredients: [
            ...(newMeal.mealOption.ingredients || []),
            { name: '', quantity: 100, calories: 0, protein: 0, carbs: 0, fat: 0 }
          ]
        }
      });
    }
  };

  const removeIngredient = (ingredientIndex: number) => {
    if (isEditModalOpen && editingMeal) {
      const updatedIngredients = [...(editingMeal.mealOption.ingredients || [])];
      updatedIngredients.splice(ingredientIndex, 1);
      
      setEditingMeal({
        ...editingMeal,
        mealOption: {
          ...editingMeal.mealOption,
          ingredients: updatedIngredients
        }
      });
    } else if (isCreateModalOpen) {
      const updatedIngredients = [...(newMeal.mealOption.ingredients || [])];
      updatedIngredients.splice(ingredientIndex, 1);
      
      setNewMeal({
        ...newMeal,
        mealOption: {
          ...newMeal.mealOption,
          ingredients: updatedIngredients
        }
      });
    }
  };

  const handleIngredientNameChange = (ingredientIndex: number, value: string) => {
    if (isEditModalOpen && editingMeal) {
      const updatedIngredients = [...(editingMeal.mealOption.ingredients || [])];
      updatedIngredients[ingredientIndex] = {
        ...updatedIngredients[ingredientIndex],
        name: value
      };
      
      setEditingMeal({
        ...editingMeal,
        mealOption: {
          ...editingMeal.mealOption,
          ingredients: updatedIngredients
        }
      });
    } else if (isCreateModalOpen) {
      const updatedIngredients = [...(newMeal.mealOption.ingredients || [])];
      updatedIngredients[ingredientIndex] = {
        ...updatedIngredients[ingredientIndex],
        name: value
      };
      
      setNewMeal({
        ...newMeal,
        mealOption: {
          ...newMeal.mealOption,
          ingredients: updatedIngredients
        }
      });
    }
  };

  const handleSelectIngredient = (ingredientIndex: number, selectedIngredient: Ingredient) => {
    // Crear una copia completa del ingrediente seleccionado
    const selectedIngredientCopy = {
      name: selectedIngredient.name,
      quantity: 100, // Usar un valor predeterminado de 100g
      calories: Number(selectedIngredient.calories) || 0,
      protein: Number(selectedIngredient.protein) || 0,
      carbs: Number(selectedIngredient.carbs) || 0,
      fat: Number(selectedIngredient.fat) || 0
    };
    
    console.log('Ingrediente seleccionado (copia):', selectedIngredientCopy);
    
    if (isEditModalOpen && editingMeal) {
      // Crear una copia completa del arreglo de ingredientes
      const updatedIngredients = [...(editingMeal.mealOption.ingredients || [])];
      
      // Si ya existe un ingrediente, preservar su cantidad
      if (updatedIngredients[ingredientIndex]) {
        selectedIngredientCopy.quantity = updatedIngredients[ingredientIndex].quantity || 100;
      }
      
      // Reemplazar el ingrediente en el arreglo
      updatedIngredients[ingredientIndex] = selectedIngredientCopy;
      
      console.log('Ingredientes actualizados (edit):', updatedIngredients);
      
      // Actualizar el estado con la copia completa
      setEditingMeal(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          mealOption: {
            ...prevState.mealOption,
            ingredients: updatedIngredients
          }
        };
      });
      
      // Verificación del estado actualizado
      setTimeout(() => {
        console.log('Estado después de actualizar:', editingMeal?.mealOption?.ingredients);
      }, 0);
    } else if (isCreateModalOpen) {
      // Crear una copia completa del arreglo de ingredientes
      const updatedIngredients = [...(newMeal.mealOption.ingredients || [])];
      
      // Si ya existe un ingrediente, preservar su cantidad
      if (updatedIngredients[ingredientIndex]) {
        selectedIngredientCopy.quantity = updatedIngredients[ingredientIndex].quantity || 100;
      }
      
      // Reemplazar el ingrediente en el arreglo
      updatedIngredients[ingredientIndex] = selectedIngredientCopy;
      
      console.log('Ingredientes actualizados (create):', updatedIngredients);
      
      // Actualizar el estado con la copia completa
      setNewMeal(prevState => ({
        ...prevState,
        mealOption: {
          ...prevState.mealOption,
          ingredients: updatedIngredients
        }
      }));
    }
  };

  const handleIngredientChange = (
    ingredientIndex: number,
    field: IngredientNumericField,
    value: number
  ) => {
    if (isEditModalOpen && editingMeal) {
      const updatedIngredients = [...(editingMeal.mealOption.ingredients || [])];
      updatedIngredients[ingredientIndex] = {
        ...updatedIngredients[ingredientIndex],
        [field]: value
      };
      
      setEditingMeal({
        ...editingMeal,
        mealOption: {
          ...editingMeal.mealOption,
          ingredients: updatedIngredients
        }
      });
    } else if (isCreateModalOpen) {
      const updatedIngredients = [...(newMeal.mealOption.ingredients || [])];
      updatedIngredients[ingredientIndex] = {
        ...updatedIngredients[ingredientIndex],
        [field]: value
      };
      
      setNewMeal({
        ...newMeal,
        mealOption: {
          ...newMeal.mealOption,
          ingredients: updatedIngredients
        }
      });
    }
  };

  // Manejar cambio en la descripción
  const handleContentChange = (content: string) => {
    if (isEditModalOpen && editingMeal) {
      setEditingMeal({
        ...editingMeal,
        mealOption: {
          ...editingMeal.mealOption,
          content
        }
      });
    } else if (isCreateModalOpen) {
      setNewMeal({
        ...newMeal,
        mealOption: {
          ...newMeal.mealOption,
          content
        }
      });
    }
  };

  // Manejar cambio en las instrucciones
  const handleInstructionsChange = (instructions: string) => {
    if (isEditModalOpen && editingMeal) {
      setEditingMeal({
        ...editingMeal,
        mealOption: {
          ...editingMeal.mealOption,
          instructions
        }
      });
    } else if (isCreateModalOpen) {
      setNewMeal({
        ...newMeal,
        mealOption: {
          ...newMeal.mealOption,
          instructions
        }
      });
    }
  };

  // Obtener título y meal activo según el modo
  const getModalTitle = () => {
    if (isEditModalOpen && editingMeal) {
      return `Editar comida: ${editingMeal.name}`;
    } else if (isCreateModalOpen) {
      return "Crear nueva comida";
    }
    return "";
  };

  const getActiveMeal = () => {
    if (isEditModalOpen && editingMeal) {
      return editingMeal;
    } else if (isCreateModalOpen) {
      return newMeal;
    }
    return null;
  };

  const handleSave = () => {
    if (isEditModalOpen && editingMeal) {
      saveEditedMeal();
    } else if (isCreateModalOpen) {
      createNewMeal();
    }
  };

  const handleClose = () => {
    if (isEditModalOpen) {
      onCloseEditModal();
    } else if (isCreateModalOpen) {
      onCloseCreateModal();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageUpload(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!imageUpload) return null;
    
    setIsUploading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setActionError('Debes iniciar sesión para subir imágenes');
        return null;
      }
      
      const storage = getStorage();
      const imageId = `meal_${Date.now()}`;
      const mealImageRef = storageRef(storage, `users/${user.uid}/mealImages/${imageId}`);
      
      await uploadBytes(mealImageRef, imageUpload);
      const downloadURL = await getDownloadURL(mealImageRef);
      
      setImageUpload(null);
      return downloadURL;
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setActionError('Error al subir imagen');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Add this function to your component
  const generateTableFromAI = async () => {
    if (!activeMeal?.mealOption.content) return;

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: activeMeal.mealOption.content
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const ingredients = await response.json();
      
      if (isEditModalOpen && editingMeal) {
        setEditingMeal({
          ...editingMeal,
          mealOption: {
            ...editingMeal.mealOption,
            ingredients: ingredients
          }
        });
      } else if (isCreateModalOpen) {
        setNewMeal({
          ...newMeal,
          mealOption: {
            ...newMeal.mealOption,
            ingredients: ingredients
          }
        });
      }
    } catch (error) {
      console.error('Error generating table:', error);
      // Here you could add toast notification for error
    }
  };

  const activeMeal = getActiveMeal();

  return (
    <>
      {/* Error de acción */}
      {actionError && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 p-3 rounded-lg shadow-lg z-50">
          {actionError}
        </div>
      )}
      
      {/* Modal de edición/creación */}
      {(isEditModalOpen || isCreateModalOpen) && activeMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto relative">

            
            <div className="p-6">
              {/* Contenido del meal */}
              <div className="space-y-6">
                {/* Información básica con imagen a la izquierda */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Imagen a la izquierda */}
                  <div className="w-full md:w-1/4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (opcional)</label>
                    <div 
                      className="w-full h-40 border border-gray-100 rounded overflow-hidden flex items-center justify-center bg-gray-50 relative cursor-pointer group"
                      onClick={() => document.getElementById('meal-image-upload')?.click()}
                    >
                      {imageUpload ? (
                        <img 
                          src={URL.createObjectURL(imageUpload)} 
                          alt="Vista previa" 
                          className="object-cover w-full h-full"
                        />
                      ) : activeMeal?.imageUrl ? (
                        <img 
                          src={activeMeal.imageUrl} 
                          alt={activeMeal.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-gray-300" />
                      )}
                      
                      {/* Overlay con todos los elementos */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        <div className="text-white flex flex-col items-center p-2">
                          {/* Botón de eliminar en la esquina */}
                          {activeMeal?.imageUrl && !imageUpload && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditModalOpen && editingMeal) {
                                  setEditingMeal({...editingMeal, imageUrl: null});
                                } else if (isCreateModalOpen) {
                                  setNewMeal({...newMeal, imageUrl: null});
                                }
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-500 rounded-full text-white transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-sm font-medium">
                            {imageUpload ? 'Cambiar imagen' : activeMeal?.imageUrl ? 'Reemplazar imagen' : 'Subir imagen'}
                          </span>
                          
                          {/* Texto de recomendación */}
                          <p className="text-xs text-gray-300 mt-2 text-center mt-2">
                            Recomendado: JPG o PNG, máximo 2MB
                          </p>
                          
                          {/* Botón de cancelar */}
                          {imageUpload && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageUpload(null);
                              }} 
                              className="mt-2 px-2 py-1 bg-red-600 bg-opacity-70 hover:bg-opacity-100 rounded-full text-white text-xs flex items-center transition-colors"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </button>
                          )}
                          
                          {/* Barra de progreso */}
                          {isUploading && (
                            <div className="w-4/5 bg-gray-200 rounded-full h-1.5 mt-3">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <input 
                        id="meal-image-upload"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageSelect}
                      />
                    </div>
                  </div>

                  {/* Nombre y categoría a la derecha, en la misma fila */}
                  <div className="w-full md:w-3/4 space-y-4">
                    <div className="flex gap-3 items-start">
                      <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la comida</label>
                        <input
                          className="w-full p-2 h-10 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-500"
                          placeholder="Nombre de la comida"
                          value={activeMeal.name}
                          onChange={(e) => {
                            if (isEditModalOpen && editingMeal) {
                              setEditingMeal({...editingMeal, name: e.target.value});
                            } else if (isCreateModalOpen) {
                              setNewMeal({...newMeal, name: e.target.value});
                            }
                          }}
                        />
                      </div>
                      <div className="w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <div className="relative">
                          {/* Estilo de chip para la categoría */}
                          <select
                            className="w-full p-2 h-10 pl-8 appearance-none rounded-full shadow-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50"
                            value={activeMeal.category}
                            onChange={(e) => {
                              if (isEditModalOpen && editingMeal) {
                                setEditingMeal({...editingMeal, category: e.target.value});
                              } else if (isCreateModalOpen) {
                                setNewMeal({...newMeal, category: e.target.value});
                              }
                            }}
                            style={{
                              backgroundColor: 
                              activeMeal.category === 'desayuno' ? '#FEE2E2' : // Light red
                              activeMeal.category === 'mediaManana' ? '#FEF3C7' : // Light yellow
                              activeMeal.category === 'almuerzo' ? '#DBEAFE' : // Light blue  
                              activeMeal.category === 'lunchTarde' ? '#D1FAE5' : // Light green
                              activeMeal.category === 'cena' ? '#EDE9FE' : // Light purple
                              '#F3F4F6', // Light gray for general
                              color:
                              activeMeal.category === 'desayuno' ? '#991B1B' : // Dark red
                              activeMeal.category === 'mediaManana' ? '#92400E' : // Dark yellow
                              activeMeal.category === 'almuerzo' ? '#1E40AF' : // Dark blue
                              activeMeal.category === 'lunchTarde' ? '#065F46' : // Dark green  
                              activeMeal.category === 'cena' ? '#5B21B6' : // Dark purple
                              '#4B5563' // Dark gray for general
                            }}
                            >
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <option 
                                key={value} 
                                value={value}
                                style={{
                                  backgroundColor: 
                                    value === 'desayuno' ? '#FEE2E2' : // Light red
                                    value === 'mediaManana' ? '#FEF3C7' : // Light yellow
                                    value === 'almuerzo' ? '#DBEAFE' : // Light blue
                                    value === 'lunchTarde' ? '#D1FAE5' : // Light green
                                    value === 'cena' ? '#EDE9FE' : // Light purple
                                    '#F3F4F6', // Light gray
                                  color: 
                                    value === 'desayuno' ? '#991B1B' : // Dark red
                                    value === 'mediaManana' ? '#92400E' : // Dark yellow
                                    value === 'almuerzo' ? '#1E40AF' : // Dark blue
                                    value === 'lunchTarde' ? '#065F46' : // Dark green
                                    value === 'cena' ? '#5B21B6' : // Dark purple
                                    '#4B5563' // Dark gray
                                }}
                              >
                                {label}
                              </option>
                            ))}
                          </select>
                            <div 
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                              activeMeal.category === 'desayuno' ? '#991B1B' : // Dark red
                              activeMeal.category === 'mediaManana' ? '#92400E' : // Dark yellow 
                              activeMeal.category === 'almuerzo' ? '#1E40AF' : // Dark blue
                              activeMeal.category === 'lunchTarde' ? '#065F46' : // Dark green
                              activeMeal.category === 'cena' ? '#5B21B6' : // Dark purple
                              '#4B5563' // Dark gray
                            }}
                            ></div>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <ChevronDown 
                              className="h-4 w-4" 
                              style={{
                                color: 
                                  activeMeal.category === 'desayuno' ? '#991B1B' : // Dark red
                                  activeMeal.category === 'mediaManana' ? '#92400E' : // Dark yellow
                                  activeMeal.category === 'almuerzo' ? '#1E40AF' : // Dark blue
                                  activeMeal.category === 'lunchTarde' ? '#065F46' : // Dark green
                                  activeMeal.category === 'cena' ? '#5B21B6' : // Dark purple
                                  '#4B5563' // Dark gray for general
                              }} 
                            />
                          </div>
                        </div>
                        
                      </div>
                      
                    </div>
                     {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Descripción</label>
                  <textarea
                    className="w-full p-3 border border-gray-200 rounder"
                    placeholder="Describe los alimentos que componen esta comida"
                    value={activeMeal.mealOption.content || ''}
                    onChange={(e) => handleContentChange(e.target.value)}
                    rows={2}
                  />
                </div>

                  </div>
                </div>

               
                {/* Instrucciones */}
                <div>
                  <div 
                    className="flex items-center cursor-pointer text-green-600 hover:text-green-700 mb-2" 
                    onClick={() => setShowInstructions(!showInstructions)}
                  >
                    <h3 className="text-sm font-medium mr-2">Instrucciones de preparación</h3>
                    {showInstructions ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ArrowUpRight className="h-4 w-4" />
                    }
                  </div>
                  
                  {showInstructions && (
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-500"
                      placeholder="Añade instrucciones de preparación para esta comida"
                      value={activeMeal.mealOption.instructions || ''}
                      onChange={(e) => handleInstructionsChange(e.target.value)}
                      rows={4}
                    />
                  )}
                </div>

                {/* Ingredientes */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Ingredientes</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={addIngredient}
                        className="bg-green-50 hover:bg-green-100 text-green-700 text-sm px-3 py-1 rounded-lg flex items-center"
                      >
                        <Strawberry size={16} className="mr-2" />
                        Añadir ingrediente
                      </button>
                    <button 
                        onClick={generateTableFromAI}
                        className={`
                            text-sm px-3 py-1 rounded-lg flex items-center relative group
                            ${activeMeal?.mealOption.content 
                                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                        `}
                        disabled={!activeMeal?.mealOption.content}
                    >
                        {/* Icon */}
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            className="w-4 h-4 mr-2"
                        >
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                        </svg>
                        Crear tabla con IA
                        
                        {/* Tooltip */}
                        {!activeMeal?.mealOption.content && (
                          <div className={`
                            absolute bottom-full right-0 mb-2 
                            w-60 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg 
                            transition-opacity duration-200 pointer-events-none
                            opacity-0 group-hover:opacity-100
                          `}>
                            La descripción no puede estar vacia 
                            <div className="absolute top-full right-4 border-[6px] border-transparent border-t-gray-800" />
                          </div>
                        )}
                    </button>
                    </div>
                  </div>

                  {/* Tabla de ingredientes */}
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 relative">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Ingrediente", "Cant(g)", "Cal", "Prot(g)", "Carbs(g)", "Grasas(g)", ""].map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(activeMeal?.mealOption?.ingredients || []).map((ingredient, ingredientIndex) => {
                          // Debug para ver lo que estamos renderizando
                          console.log(`Renderizando ingrediente ${ingredientIndex}:`, ingredient);
                          
                          return (
                            <tr key={ingredientIndex} className="hover:bg-gray-50">
                              <td className="py-2 px-3 min-w-[180px] relative w-1/2" style={{ position: 'static' }}>
                                <div className="relative">
                                  <IngredientTypeahead
                                    value={ingredient.name || ''}
                                    onChange={(value) => handleIngredientNameChange(ingredientIndex, value)}
                                    onSelectIngredient={(selectedIngredient) =>
                                      handleSelectIngredient(ingredientIndex, selectedIngredient)
                                    }
                                    ingredients={commonIngredients}
                                  />
                                </div>
                              </td>
                              
                                {/* Cantidad (editable) */}
                                <td className="px-3 py-2">
                                <input
                                  className="w-16 p-1 border border-gray-200 rounded text-center"
                                  type="number"
                                  value={ingredient.quantity === 0 ? '' : ingredient.quantity || ''}
                                  onChange={(e) => {
                                  const value = e.target.value;
                                  // Use undefined for empty value to allow clearing the field
                                  const numValue = value === '' ? 0 : Number(value);
                                  handleIngredientChange(
                                    ingredientIndex,
                                    'quantity',
                                    numValue
                                  );
                                  }}
                                  step="1"
                                  min="0"
                                />
                                </td>
                              
                              {/* Valores calculados según la cantidad - USANDO VALORES DE COMMON_INGREDIENTS */}
                              <td className="px-3 py-2 text-center">
                                {(() => {
                                  // Buscar el ingrediente en la base de datos por nombre
                                  const originalIngredient = COMMON_INGREDIENTS.find(i => 
                                    i.name.toLowerCase() === ingredient.name.toLowerCase()
                                  );
                                  
                                  // Usar valores originales si se encuentra, o valores del estado como fallback
                                  const calories = originalIngredient ? originalIngredient.calories : (ingredient.calories || 0);
                                  const quantity = ingredient.quantity || 0;
                                  
                                  return Math.round(calories * quantity / 100);
                                })()}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {(() => {
                                  // Buscar el ingrediente en la base de datos por nombre
                                  const originalIngredient = COMMON_INGREDIENTS.find(i => 
                                    i.name.toLowerCase() === ingredient.name.toLowerCase()
                                  );
                                  
                                  // Usar valores originales si se encuentra, o valores del estado como fallback
                                  const protein = originalIngredient ? originalIngredient.protein : (ingredient.protein || 0);
                                  const quantity = ingredient.quantity || 0;
                                  
                                  return (protein * quantity / 100).toFixed(1);
                                })()}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {(() => {
                                  // Buscar el ingrediente en la base de datos por nombre
                                  const originalIngredient = COMMON_INGREDIENTS.find(i => 
                                    i.name.toLowerCase() === ingredient.name.toLowerCase()
                                  );
                                  
                                  // Usar valores originales si se encuentra, o valores del estado como fallback
                                  const carbs = originalIngredient ? originalIngredient.carbs : (ingredient.carbs || 0);
                                  const quantity = ingredient.quantity || 0;
                                  
                                  return (carbs * quantity / 100).toFixed(1);
                                })()}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {(() => {
                                  // Buscar el ingrediente en la base de datos por nombre
                                  const originalIngredient = COMMON_INGREDIENTS.find(i => 
                                    i.name.toLowerCase() === ingredient.name.toLowerCase()
                                  );
                                  
                                  // Usar valores originales si se encuentra, o valores del estado como fallback
                                  const fat = originalIngredient ? originalIngredient.fat : (ingredient.fat || 0);
                                  const quantity = ingredient.quantity || 0;
                                  
                                  return (fat * quantity / 100).toFixed(1);
                                })()}
                              </td>
                              
                              {/* Botón eliminar */}
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => removeIngredient(ingredientIndex)} 
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                >
                                  <TrashCan size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {(activeMeal?.mealOption?.ingredients?.length || 0) === 0 && (
                          <tr>
                            <td colSpan={7} className="px-3 py-4 text-center text-gray-500 text-sm">
                              No hay ingredientes. Añade uno para comenzar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      
                      {/* Total de nutrientes */}
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td className="px-3 py-2 font-medium" colSpan={2}>Total:</td>
                          <td className="px-3 py-2 font-medium text-center">
                            {Math.round((activeMeal?.mealOption?.ingredients || [])
                              .reduce((sum, i) => sum + (Number(i.calories || 0) * Number(i.quantity || 0) / 100), 0))}
                          </td>
                          <td className="px-3 py-2 font-medium text-center">
                            {(activeMeal?.mealOption?.ingredients || [])
                              .reduce((sum, i) => sum + (Number(i.protein || 0) * Number(i.quantity || 0) / 100), 0)
                              .toFixed(1)}g
                          </td>
                          <td className="px-3 py-2 font-medium text-center">
                            {(activeMeal?.mealOption?.ingredients || [])
                              .reduce((sum, i) => sum + (Number(i.carbs || 0) * Number(i.quantity || 0) / 100), 0)
                              .toFixed(1)}g
                          </td>
                          <td className="px-3 py-2 font-medium text-center">
                            {(activeMeal?.mealOption?.ingredients || [])
                              .reduce((sum, i) => sum + (Number(i.fat || 0) * Number(i.quantity || 0) / 100), 0)
                              .toFixed(1)}g
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 flex justify-end space-x-3 bg-gray-50 sticky bottom-0">
              <button
                onClick={handleClose}
                className="px-4 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isEditModalOpen ? 'Guardando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {isEditModalOpen ? 'Guardar cambios' : 'Crear comida'}
                  </>
                )}
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
                onClick={onCloseDeleteModal}
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
                    <TrashCan size={16} className="mr-2" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MealsBiblioteca;