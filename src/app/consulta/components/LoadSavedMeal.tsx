import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, Inbox } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, authService } from '@/app/shared/firebase';
import { MealOption } from './meals';
import { categoryIcons, MealCategory, normalizeCategory } from '@/app/comidas/constants';
import { useTranslation } from '@/app/shared/useTranslation';
import { getCountry } from '@/app/shared/countries';

interface SavedMealOption {
  id: string;
  name: string;
  category: MealCategory;
  country?: string | null;
  mealOption: MealOption;
  totalNutrition: { calories: number; protein: number; carbs: number; fat: number };
  createdAt: any;
}

interface LoadSavedMealProps {
  onSelect: (option: MealOption) => void;
}

const LoadSavedMeal: React.FC<LoadSavedMealProps> = ({ onSelect }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [savedOptions, setSavedOptions] = useState<SavedMealOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | 'all'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | 'all'>('all');

  const loadSavedOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const user = authService.getCurrentUser();
      if (!user) { setError(t('consultation.loadSaved.mustLogin')); setLoading(false); return; }
      const q = query(collection(db, `users/${user.uid}/savedMealOptions`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const options: SavedMealOption[] = [];
      snapshot.forEach(doc => options.push({ id: doc.id, ...doc.data() } as SavedMealOption));
      setSavedOptions(options);
    } catch (err) {
      console.error('Error al cargar opciones guardadas:', err);
      setError(t('consultation.loadSaved.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => { setIsOpen(true); setSearchTerm(''); setSelectedCategory('all'); setSelectedCountry('all'); loadSavedOptions(); };
  const handleSelect = (opt: SavedMealOption) => { onSelect({ ...opt.mealOption, name: opt.name }); setIsOpen(false); };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: savedOptions.length };
    savedOptions.forEach(o => { const c = normalizeCategory(o.category); counts[c] = (counts[c] || 0) + 1; });
    return counts;
  }, [savedOptions]);

  // Países presentes entre las comidas guardadas.
  const countryCodes = useMemo(() => {
    const set = new Set<string>();
    savedOptions.forEach(o => { if (o.country) set.add(o.country); });
    return Array.from(set);
  }, [savedOptions]);

  const filtered = useMemo(() => savedOptions.filter(o => {
    const matchCat = selectedCategory === 'all' || normalizeCategory(o.category) === selectedCategory;
    const matchCountry = selectedCountry === 'all' || o.country === selectedCountry;
    const s = searchTerm.trim().toLowerCase();
    const matchSearch = s === '' || o.name.toLowerCase().includes(s) ||
      o.mealOption.ingredients?.some(ing => ing.name.toLowerCase().includes(s));
    return matchCat && matchCountry && matchSearch;
  }), [savedOptions, selectedCategory, selectedCountry, searchTerm]);

  const cats: ('all' | MealCategory)[] = ['all', 'desayuno', 'almuerzo', 'cena', 'snack'];
  const visibleCats = cats.filter(c => c === 'all' || (categoryCounts[c] || 0) > 0);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors text-gray-600 bg-white hover:text-emerald-700 hover:bg-emerald-50"
        style={{ border: '1px solid #E8E5DE' }}
        title={t('consultation.loadSaved.btnTitle')}
      >
        <BookOpen className="w-3 h-3" />
        {t('consultation.loadSaved.btn')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
            style={{ border: '1px solid #E8E5DE', maxHeight: '82vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #F0EDE8' }}>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[13px] font-semibold text-gray-900">{t('consultation.loadSaved.title')}</span>
                <span className="text-[10px] text-gray-400">{savedOptions.length}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 p-0.5 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Búsqueda */}
            <div className="px-4 pt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('consultation.loadSaved.searchPh')}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Pills de categoría */}
            {visibleCats.length > 1 && (
              <div className="flex gap-1 px-4 pt-2 overflow-x-auto">
                {visibleCats.map(cat => {
                  const active = selectedCategory === cat;
                  const label = cat === 'all' ? t('consultation.loadSaved.all') : t(`meals.categories.${cat}`);
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                        active ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={!active ? { border: '1px solid #E8E5DE' } : undefined}
                    >
                      {cat !== 'all' && <img src={`/icons/${categoryIcons[cat as MealCategory]}.svg`} alt="" className="w-3 h-3" />}
                      {label}
                      <span className={active ? 'opacity-80' : 'text-gray-400'}>{categoryCounts[cat] || 0}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pills de país (solo si hay comidas con país) */}
            {countryCodes.length > 0 && (
              <div className="flex gap-1 px-4 pt-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCountry('all')}
                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    selectedCountry === 'all' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={selectedCountry !== 'all' ? { border: '1px solid #E8E5DE' } : undefined}
                >
                  🌎 Todos
                </button>
                {countryCodes.map(code => {
                  const c = getCountry(code);
                  if (!c) return null;
                  const active = selectedCountry === code;
                  return (
                    <button
                      key={code}
                      onClick={() => setSelectedCountry(code)}
                      className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                        active ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={!active ? { border: '1px solid #E8E5DE' } : undefined}
                    >
                      <span className="text-[13px] leading-none">{c.flag}</span>{c.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-2 py-2 mt-1">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-[12px]">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
                  {t('consultation.loadSaved.loading')}
                </div>
              ) : error ? (
                <div className="m-2 bg-red-50 border border-red-200 text-red-700 text-[12px] p-2.5 rounded">{error}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: '#F4F2EE' }}>
                    <Inbox className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-[12px] font-medium text-gray-700">
                    {savedOptions.length === 0 ? t('consultation.loadSaved.emptyTitle') : t('consultation.loadSaved.noResults')}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {savedOptions.length === 0 ? t('consultation.loadSaved.emptyMsg') : t('consultation.loadSaved.tryAnother')}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map(opt => {
                    const cals = Math.round(opt.totalNutrition?.calories || 0);
                    const ingCount = opt.mealOption?.ingredients?.length || 0;
                    const country = getCountry(opt.country);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelect(opt)}
                        className="group w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-medium text-gray-900 truncate group-hover:text-emerald-700">
                            {country && <span className="mr-1">{country.flag}</span>}{opt.name}
                          </div>
                          <div className="text-[10px] text-gray-400 tabular-nums truncate">
                            <span className="text-red-500">●</span> {Math.round(opt.totalNutrition?.protein || 0)}g
                            <span className="mx-1 text-amber-500">●</span>{Math.round(opt.totalNutrition?.carbs || 0)}g
                            <span className="mx-1 text-blue-500">●</span>{Math.round(opt.totalNutrition?.fat || 0)}g
                            {ingCount > 0 && <span className="text-gray-300"> · </span>}
                            {ingCount > 0 && `${ingCount} ${ingCount === 1 ? t('consultation.loadSaved.ingShortOne') : t('consultation.loadSaved.ingShortMany')}`}
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-[12px] font-semibold text-gray-800 tabular-nums">{cals}<span className="text-[9px] text-gray-400 ml-0.5">kcal</span></span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoadSavedMeal;
