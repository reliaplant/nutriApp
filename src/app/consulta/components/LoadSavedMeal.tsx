import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, BookOpen, Inbox, Plus, Clock } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, authService } from '@/app/shared/firebase';
import { MealOption } from './meals';
import { categoryLabels, categoryIcons, MealCategory } from '@/app/comidas/constants';

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
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | 'all'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const loadSavedOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Necesitas iniciar sesión para ver tus recetas guardadas');
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, `users/${user.uid}/savedMealOptions`),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const options: SavedMealOption[] = [];
      snapshot.forEach(doc => {
        options.push({ id: doc.id, ...doc.data() } as SavedMealOption);
      });
      setSavedOptions(options);
    } catch (err) {
      console.error('Error al cargar opciones guardadas:', err);
      setError('Error al cargar recetas guardadas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchTerm('');
    setSelectedCategory('all');
    loadSavedOptions();
  };

  const handleSelect = (opt: SavedMealOption) => {
    onSelect({ ...opt.mealOption, name: opt.name });
    setIsOpen(false);
  };

  // Counts por categoría (para sidebar)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: savedOptions.length };
    savedOptions.forEach(o => {
      counts[o.category] = (counts[o.category] || 0) + 1;
    });
    return counts;
  }, [savedOptions]);

  const filtered = useMemo(() => {
    return savedOptions.filter(o => {
      const matchCat = selectedCategory === 'all' || o.category === selectedCategory;
      const matchSearch = searchTerm.trim() === '' ||
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.mealOption.ingredients?.some(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [savedOptions, selectedCategory, searchTerm]);

  const formatDate = (ts: any): string => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays}d`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`;
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  };

  const sidebarCategories: ('all' | MealCategory)[] = ['all', 'desayuno', 'mediaManana', 'almuerzo', 'lunchTarde', 'cena', 'general'];

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors text-gray-600 bg-white hover:text-emerald-700 hover:bg-emerald-50"
        style={{ border: '1px solid #E8E5DE' }}
        title="Cargar receta guardada"
      >
        <BookOpen className="w-3 h-3" />
        Cargar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
            style={{ border: '1px solid #E8E5DE' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8E5DE' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight">Recetario</h3>
                  <p className="text-[10px] text-gray-500 leading-tight">{savedOptions.length} receta{savedOptions.length !== 1 ? 's' : ''} guardada{savedOptions.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar de categorías */}
              <aside className="w-44 flex-shrink-0 py-3 px-2 overflow-y-auto" style={{ backgroundColor: '#FAF9F7', borderRight: '1px solid #E8E5DE' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-2 mb-1.5">Categorías</div>
                <nav className="space-y-0.5">
                  {sidebarCategories.map(cat => {
                    const isActive = selectedCategory === cat;
                    const count = categoryCounts[cat] || 0;
                    const label = cat === 'all' ? 'Todas' : categoryLabels[cat as MealCategory];
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] font-medium transition-colors ${
                          isActive
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-gray-600 hover:bg-white hover:text-gray-900'
                        }`}
                        style={isActive ? { border: '1px solid #E8E5DE' } : undefined}
                      >
                        {cat === 'all' ? (
                          <Inbox className="w-3.5 h-3.5 opacity-70" />
                        ) : (
                          <img src={`/icons/${categoryIcons[cat as MealCategory]}.svg`} alt="" className="w-3.5 h-3.5" />
                        )}
                        <span className="flex-1 text-left">{label}</span>
                        <span className={`text-[10px] tabular-nums ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{count}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Main panel */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Search bar */}
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre o ingrediente…"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-gray-500 text-[12px]">
                      <span className="inline-block w-3.5 h-3.5 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
                      Cargando recetas…
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] p-3 rounded">
                      {error}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#F4F2EE' }}>
                        <Inbox className="w-5 h-5 text-gray-400" />
                      </div>
                      {savedOptions.length === 0 ? (
                        <>
                          <p className="text-[13px] font-medium text-gray-700">Aún no tienes recetas guardadas</p>
                          <p className="text-[11px] text-gray-500 mt-1 max-w-xs">Cuando guardes una opción de comida, aparecerá aquí para reutilizarla en otras consultas.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[13px] font-medium text-gray-700">Sin resultados</p>
                          <p className="text-[11px] text-gray-500 mt-1">Prueba con otro término o categoría.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {filtered.map(opt => {
                        const cals = Math.round(opt.totalNutrition?.calories || 0);
                        const ingCount = opt.mealOption?.ingredients?.length || 0;
                        const isHovered = hoveredId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSelect(opt)}
                            onMouseEnter={() => setHoveredId(opt.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className="group text-left bg-white rounded-md p-3 transition-all hover:shadow-md relative"
                            style={{
                              border: isHovered ? '1px solid #34D399' : '1px solid #E8E5DE',
                            }}
                          >
                            {/* Categoría chip */}
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <img src={`/icons/${categoryIcons[opt.category]}.svg`} alt="" className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider truncate">{categoryLabels[opt.category]}</span>
                              </div>
                              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 flex-shrink-0">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDate(opt.createdAt)}
                              </span>
                            </div>

                            {/* Nombre */}
                            <h4 className="text-[13px] font-semibold text-gray-900 leading-snug mb-2 line-clamp-2" style={{ minHeight: '2.4em' }}>
                              {opt.name}
                            </h4>

                            {/* Stats */}
                            <div className="flex items-baseline gap-3 mb-2">
                              <div>
                                <span className="text-base font-bold text-gray-900 tabular-nums">{cals}</span>
                                <span className="text-[10px] text-gray-500 ml-0.5">kcal</span>
                              </div>
                              <div className="flex gap-2 text-[10px] text-gray-500 tabular-nums">
                                <span><span className="text-red-500">●</span> {Math.round(opt.totalNutrition?.protein || 0)}g</span>
                                <span><span className="text-amber-500">●</span> {Math.round(opt.totalNutrition?.carbs || 0)}g</span>
                                <span><span className="text-blue-500">●</span> {Math.round(opt.totalNutrition?.fat || 0)}g</span>
                              </div>
                            </div>

                            {/* Ingredientes preview */}
                            <div className="text-[10px] text-gray-500 truncate" style={{ borderTop: '1px solid #F0EDE8', paddingTop: '6px' }}>
                              {ingCount} ingrediente{ingCount !== 1 ? 's' : ''}
                              {ingCount > 0 && ': '}
                              {opt.mealOption?.ingredients?.slice(0, 3).map(i => i.name).join(', ')}
                              {ingCount > 3 && '…'}
                            </div>

                            {/* Hover hint */}
                            <div className={`absolute inset-x-0 bottom-0 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center gap-1 rounded-b-md transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                              <Plus className="w-3 h-3" />
                              Usar esta receta
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50" style={{ borderTop: '1px solid #E8E5DE' }}>
              <span className="text-[10px] text-gray-500">
                {filtered.length === savedOptions.length
                  ? `${savedOptions.length} receta${savedOptions.length !== 1 ? 's' : ''}`
                  : `${filtered.length} de ${savedOptions.length}`}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-100 text-[12px] font-medium transition-colors"
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
