'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { useTranslation } from '@/app/shared/useTranslation';
import { setLang as setLangStored, type Lang } from '@/app/shared/i18n';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

type PracticeType = 'clinic' | 'private' | 'online';
type PatientLoad = '0' | '1-10' | '11-30' | '30+';

const COUNTRIES = [
  { code: 'MX', flag: '🇲🇽', name: 'México' },
  { code: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: 'ES', flag: '🇪🇸', name: 'España' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: 'DO', flag: '🇩🇴', name: 'República Dominicana' },
  { code: 'US', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: 'OTHER', flag: '🌎', name: 'Otro' },
];

const SPECIALTY_KEYS = [
  'specClinical', 'specSports', 'specPediatric', 'specOncology',
  'specPregnancy', 'specVegan', 'specWeightLoss', 'specDiabetes',
] as const;

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, userData, refreshUserData, loading } = useAuth();
  const { t, ti, lang } = useTranslation();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [chosenLang, setChosenLang] = useState<Lang>(lang);
  const [fullName, setFullName] = useState('');
  const [credential, setCredential] = useState('');
  const [country, setCountry] = useState('');
  const [practiceType, setPracticeType] = useState<PracticeType[]>([]);
  const [patientLoad, setPatientLoad] = useState<PatientLoad | ''>('');
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Prefill from existing userData
  useEffect(() => {
    if (!userData) return;
    if (userData.displayName) setFullName(userData.displayName);
    if (userData.credentials) setCredential(userData.credentials);
    if (userData.country) setCountry(userData.country);
    if (userData.practiceType) setPracticeType(userData.practiceType);
    if (userData.patientLoad) setPatientLoad(userData.patientLoad);
    if (userData.specialties) setSpecialties(userData.specialties);
    if (userData.language) setChosenLang(userData.language);
  }, [userData]);

  const togglePractice = (p: PracticeType) => {
    setPracticeType((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };
  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const canContinue = useMemo(() => {
    if (step === 1) return !!chosenLang;
    if (step === 2) return fullName.trim().length > 1 && !!country;
    if (step === 3) return true;
    return false;
  }, [step, chosenLang, fullName, country]);

  const persistStep = async (nextStep: number, finish = false) => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};

      if (step === 1) {
        payload.language = chosenLang;
        setLangStored(chosenLang); // refresca i18n inmediatamente
      }
      if (step === 2) {
        payload.displayName = fullName.trim();
        payload.credentials = credential.trim() || null;
        payload.country = country;
      }
      if (step === 3) {
        payload.practiceType = practiceType;
        payload.patientLoad = patientLoad || null;
        payload.specialties = specialties;
      }
      if (finish) {
        payload.onboardingCompletedAt = serverTimestamp();
      }

      if (Object.keys(payload).length > 0) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), payload as Record<string, any>);
        await refreshUserData();
      }

      if (finish) {
        router.replace('/pacientes');
      } else {
        setStep(nextStep);
      }
    } catch (e) {
      console.error('Onboarding error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) persistStep(step + 1);
    else persistStep(step, true);
  };

  const handleSkip = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        onboardingCompletedAt: serverTimestamp(),
        ...(step === 1 ? { language: chosenLang } : {}),
      });
      if (step === 1) setLangStored(chosenLang);
      await refreshUserData();
      router.replace('/pacientes');
    } catch (e) {
      console.error('Skip error:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !firebaseUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream-pattern">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-pattern flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">
            {ti('onboarding.step', [step, TOTAL_STEPS])}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {step === 1 && t('onboarding.languageTitle')}
            {step === 2 && t('onboarding.profileTitle')}
            {step === 3 && t('onboarding.practiceTitle')}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1.5">
            {step === 1 && t('onboarding.languageSubtitle')}
            {step === 2 && t('onboarding.profileSubtitle')}
            {step === 3 && t('onboarding.practiceSubtitle')}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i + 1 === step ? 'w-6 bg-emerald-700' : i + 1 < step ? 'w-1.5 bg-emerald-700' : 'w-1.5 bg-gray-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-6 md:p-8" style={{ border: '1px solid #E8E5DE', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          {/* STEP 1 — Language */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {([
                { code: 'es' as Lang, flag: '🇪🇸', label: 'Español' },
                { code: 'pt' as Lang, flag: '🇧🇷', label: 'Português' },
              ]).map((l) => {
                const active = chosenLang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setChosenLang(l.code);
                      setLangStored(l.code); // cambia el idioma de la UI al instante
                    }}
                    className={`relative p-6 rounded-lg flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 ${active ? 'bg-emerald-50' : 'bg-white hover:bg-[#FAF9F7]'}`}
                    style={{ border: active ? '1.5px solid #047857' : '1px solid #E8E5DE' }}
                  >
                    {active && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-5xl leading-none">{l.flag}</span>
                    <span className={`text-sm font-semibold ${active ? 'text-emerald-800' : 'text-gray-900'}`}>{l.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2 — Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">{t('onboarding.fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('onboarding.fullNamePh')}
                  className="w-full px-3 py-2.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                  style={{ border: '1px solid #E8E5DE' }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">{t('onboarding.credential')}</label>
                <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder={t('onboarding.credentialPh')}
                  className="w-full px-3 py-2.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                  style={{ border: '1px solid #E8E5DE' }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">{t('onboarding.country')}</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                  style={{ border: '1px solid #E8E5DE' }}
                >
                  <option value="">{t('onboarding.countryPlaceholder')}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag}  {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3 — Practice */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-2">{t('onboarding.practiceTypeLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'clinic' as PracticeType,  label: t('onboarding.practiceClinic') },
                    { key: 'private' as PracticeType, label: t('onboarding.practicePrivate') },
                    { key: 'online' as PracticeType,  label: t('onboarding.practiceOnline') },
                  ]).map((opt) => {
                    const active = practiceType.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => togglePractice(opt.key)}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${active ? 'bg-emerald-700 text-white' : 'bg-white text-gray-700 hover:bg-[#FAF9F7]'}`}
                        style={{ border: active ? '1.5px solid #047857' : '1px solid #E8E5DE' }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-2">{t('onboarding.patientLoadLabel')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { key: '0' as PatientLoad,      label: t('onboarding.patientLoad0') },
                    { key: '1-10' as PatientLoad,   label: t('onboarding.patientLoad1_10') },
                    { key: '11-30' as PatientLoad,  label: t('onboarding.patientLoad11_30') },
                    { key: '30+' as PatientLoad,    label: t('onboarding.patientLoad30plus') },
                  ]).map((opt) => {
                    const active = patientLoad === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setPatientLoad(opt.key)}
                        className={`px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-gray-700 hover:bg-[#FAF9F7]'}`}
                        style={{ border: active ? '1.5px solid #047857' : '1px solid #E8E5DE' }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-2">{t('onboarding.specialtiesLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_KEYS.map((sk) => {
                    const label = t(`onboarding.${sk}`) as string;
                    const active = specialties.includes(sk);
                    return (
                      <button
                        key={sk}
                        onClick={() => toggleSpecialty(sk)}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${active ? 'bg-emerald-700 text-white' : 'bg-white text-gray-700 hover:bg-[#FAF9F7]'}`}
                        style={{ border: active ? '1.5px solid #047857' : '1px solid #E8E5DE' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="text-[12px] text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            {t('onboarding.skip')}
          </button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={saving}
                className="px-3 py-2 text-[12px] font-semibold rounded-md bg-white text-gray-700 hover:bg-[#FAF9F7] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                style={{ border: '1px solid #E8E5DE' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                {t('onboarding.back')}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canContinue || saving}
              className="px-4 py-2 text-[12px] font-semibold rounded-md bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {saving ? t('onboarding.saving') : step === TOTAL_STEPS ? t('onboarding.finish') : t('onboarding.next')}
              {!saving && <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
