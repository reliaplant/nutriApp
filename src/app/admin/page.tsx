'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminService, type NutritionUser, type UserPlan } from '@/app/shared/firebase';
import { Patient } from '@/app/shared/interfaces';
import { Users, Crown, DollarSign, Search, X, ChevronDown, Check } from 'lucide-react';

// Precios estimados (ajusta cuando definas Stripe)
const PRICE_MONTHLY = 19; // USD/mes
const PRICE_ANNUAL = 190; // USD/año (≈ 15.83/mes)

type Row = NutritionUser & { patientCount?: number };

export default function AdminPage() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [editingPlanFor, setEditingPlanFor] = useState<string | null>(null);
  const [viewingPatientsOf, setViewingPatientsOf] = useState<NutritionUser | null>(null);
  const [patientsModal, setPatientsModal] = useState<Patient[] | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await adminService.getAllUsers();
        // Cargar conteo de pacientes en paralelo
        const withCounts = await Promise.all(
          list.map(async (u) => ({
            ...u,
            patientCount: await adminService.countPatientsByNutritionist(u.uid),
          }))
        );
        setUsers(withCounts);
      } catch (e) {
        console.error('Error al cargar usuarios:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const tier = u.plan?.tier || 'free';
      if (tierFilter !== 'all' && tier !== tierFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
      );
    });
  }, [users, search, tierFilter]);

  const metrics = useMemo(() => {
    const total = users.length;
    let premiumMonthly = 0;
    let premiumAnnual = 0;
    for (const u of users) {
      if (u.plan?.tier === 'premium') {
        if (u.plan.billing === 'annual') premiumAnnual++;
        else premiumMonthly++;
      }
    }
    const premium = premiumMonthly + premiumAnnual;
    const free = total - premium;
    const mrr = premiumMonthly * PRICE_MONTHLY + premiumAnnual * (PRICE_ANNUAL / 12);
    return { total, premium, free, mrr: Math.round(mrr) };
  }, [users]);

  const updatePlan = async (uid: string, plan: UserPlan) => {
    await adminService.updateUserPlan(uid, plan);
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, plan } : u)));
    setEditingPlanFor(null);
  };

  const openPatients = async (user: NutritionUser) => {
    setViewingPatientsOf(user);
    setLoadingPatients(true);
    try {
      const list = await adminService.getPatientsByNutritionist(user.uid);
      setPatientsModal(list);
    } catch (e) {
      console.error('Error al cargar pacientes:', e);
      setPatientsModal([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream-pattern">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-cream-pattern min-h-screen">
      <div className="sticky top-0 z-10 bg-white px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #E8E5DE' }}>
        <div className="flex items-center gap-2">
          <Link href="/pacientes" className="text-[11px] text-gray-600 hover:text-emerald-700">← Volver</Link>
          <span className="text-gray-300">›</span>
          <span className="text-xs font-semibold text-gray-800">Panel administrativo</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <MetricCard icon={<Users size={16} />} label="Usuarios totales" value={metrics.total} />
          <MetricCard icon={<Crown size={16} />} label="Premium" value={metrics.premium} accent="emerald" />
          <MetricCard icon={<Users size={16} />} label="Free" value={metrics.free} />
          <MetricCard icon={<DollarSign size={16} />} label="MRR estimado" value={`$${metrics.mrr}`} accent="emerald" />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-md p-3 mb-4 flex flex-wrap items-center gap-2" style={{ border: '1px solid #E8E5DE' }}>
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email, nombre o UID…"
              className="w-full pl-8 pr-2 py-1.5 text-[12px] bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'free', 'premium'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  tierFilter === t
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'free' ? 'Free' : 'Premium'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-3 py-2">Usuario</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Plan</th>
                <th className="text-left px-3 py-2">Rol</th>
                <th className="text-right px-3 py-2">Pacientes</th>
                <th className="text-left px-3 py-2">Registro</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-[11px]">
                    Sin resultados
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const tier = u.plan?.tier || 'free';
                const billing = u.plan?.billing;
                const created = u.createdAt && (u.createdAt as any).toDate ? (u.createdAt as any).toDate() : null;
                return (
                  <tr key={u.uid} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-semibold">
                            {(u.displayName || u.email || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{u.displayName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 tabular-nums">{u.email}</td>
                    <td className="px-3 py-2 relative">
                      <button
                        onClick={() => setEditingPlanFor(editingPlanFor === u.uid ? null : u.uid)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          tier === 'premium' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tier === 'premium' ? (
                          <>
                            <Crown size={10} /> Premium {billing === 'annual' ? 'anual' : 'mensual'}
                          </>
                        ) : (
                          'Free'
                        )}
                        <ChevronDown size={10} />
                      </button>
                      {editingPlanFor === u.uid && (
                        <div className="absolute z-20 mt-1 left-3 bg-white rounded-md shadow-lg py-1 text-[11px] min-w-[160px]" style={{ border: '1px solid #E8E5DE' }}>
                          <PlanOption label="Free" active={tier === 'free'} onClick={() => updatePlan(u.uid, { tier: 'free' })} />
                          <PlanOption label="Premium · mensual" active={tier === 'premium' && billing === 'monthly'} onClick={() => updatePlan(u.uid, { tier: 'premium', billing: 'monthly' })} />
                          <PlanOption label="Premium · anual" active={tier === 'premium' && billing === 'annual'} onClick={() => updatePlan(u.uid, { tier: 'premium', billing: 'annual' })} />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-medium ${u.role === 'admin' ? 'text-purple-700' : 'text-gray-600'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Nutricionista'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <button onClick={() => openPatients(u)} className="text-emerald-700 hover:underline">
                        {u.patientCount ?? 0}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-gray-500 tabular-nums text-[11px]">
                      {created ? created.toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/perfil?uid=${u.uid}`} className="text-[10px] text-gray-400 hover:text-emerald-700">ver</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pacientes */}
      {viewingPatientsOf && (
        <div className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center p-4" onClick={() => { setViewingPatientsOf(null); setPatientsModal(null); }}>
          <div className="bg-white rounded-md w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Pacientes de</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{viewingPatientsOf.displayName || viewingPatientsOf.email}</p>
              </div>
              <button onClick={() => { setViewingPatientsOf(null); setPatientsModal(null); }} className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4">
              {loadingPatients ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent" /></div>
              ) : !patientsModal || patientsModal.length === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-6">Este usuario no tiene pacientes</p>
              ) : (
                <ul className="space-y-1.5">
                  {patientsModal.map((p) => (
                    <li key={p.id} className="flex justify-between items-center text-[12px] py-1.5 px-2 rounded hover:bg-gray-50">
                      <span className="text-gray-800">{p.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'discharged' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: 'emerald' }) {
  return (
    <div className="bg-white rounded-md p-3" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent === 'emerald' ? 'text-emerald-700' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function PlanOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between">
      <span className={active ? 'text-emerald-700 font-medium' : 'text-gray-700'}>{label}</span>
      {active && <Check size={12} className="text-emerald-600" />}
    </button>
  );
}
