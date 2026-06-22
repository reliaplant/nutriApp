'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { authService, db, storage, SIGNATURE_FONTS, DEFAULT_SIGNATURE_FONT } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/app/shared/useTranslation';

// Vista previa de firma que escala el texto para no desbordar el contenedor.
function SignaturePreview({ text, font, size }: { text: string; font: string; size: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const box = boxRef.current, span = spanRef.current;
    if (!box || !span) return;
    const cw = box.clientWidth - 8;
    const sw = span.scrollWidth;
    setScale(sw > cw && sw > 0 ? Math.min(1, cw / sw) : 1);
  }, [text, font, size]);
  return (
    <div ref={boxRef} className="w-full flex items-center justify-center overflow-hidden">
      <span ref={spanRef} style={{ fontFamily: `'${font}', cursive`, fontSize: size, color: '#2D2B28', whiteSpace: 'nowrap', transform: `scale(${scale})`, transformOrigin: 'center' }}>{text}</span>
    </div>
  );
}

interface NutritionistProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'nutritionist';
  phone?: string;
  whatsapp?: string;
  showWhatsapp?: boolean;
  bio?: string;
  specialization?: string;
  credentials?: string;
  logoUrl?: string;
  avatarUrl?: string;
  businessHours?: string;
  website?: string;
  officeAddress?: string;
  professionalId?: string;
  language?: 'es' | 'pt';
  signatureUrl?: string;
  textSignature?: string;
  useRealSignature?: boolean;
  signatureFont?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<NutritionistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<Partial<NutritionistProfile>>({});
  const { firebaseUser, loading: authLoading } = useAuth();

  // Eliminar cuenta
  const [showDelete, setShowDelete] = useState(false);
  const [delConfirm, setDelConfirm] = useState('');
  const [delPassword, setDelPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState('');
  const isPasswordProvider = authService.getAuthProvider() === 'password';
  const confirmWord = t('profile.danger.confirmWord');

  const handleDeleteAccount = async () => {
    setDelError('');
    setDeleting(true);
    try {
      await authService.deleteAccount(isPasswordProvider ? delPassword : undefined);
      router.push('/login');
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string })?.code || (err as { message?: string })?.message || '';
      if (code.includes('wrong-password') || code.includes('invalid-credential')) setDelError(t('profile.danger.wrongPassword'));
      else if (code.includes('requires-recent-login') || code === 'reauth-required') setDelError(t('profile.danger.reauthNeeded'));
      else setDelError(t('profile.danger.error'));
      console.error(err);
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!firebaseUser) {
      router.replace('/login');
      return;
    }
    
    loadProfile(firebaseUser.uid);
  }, [firebaseUser, authLoading, router]);

  const loadProfile = async (uid: string) => {
    try {
      const userData = await authService.getUserData(uid);
      if (!userData) {
        setError(t('profile.profileNotFound'));
        return;
      }
      setProfile(userData as NutritionistProfile);
      setFormData({
        displayName: userData.displayName || '',
        phone: userData.phone || '',
        whatsapp: userData.whatsapp || '',
        showWhatsapp: userData.showWhatsapp || false,
        bio: userData.bio || '',
        specialization: userData.specialization || '',
        credentials: userData.credentials || '',
        businessHours: userData.businessHours || '',
        website: userData.website || '',
        officeAddress: userData.officeAddress || '',
        language: userData.language || 'es',
        professionalId: userData.professionalId || '',
        signatureUrl: userData.signatureUrl || '',
        textSignature: userData.textSignature || '',
        useRealSignature: userData.useRealSignature ?? false,
        signatureFont: userData.signatureFont || DEFAULT_SIGNATURE_FONT
      });
    } catch (err) {
      setError(t('profile.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : value
    }));
  };

  const handleToggleChange = (field: keyof NutritionistProfile) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'logo' | 'signature') => {
    if (!profile?.uid) return;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `users/${profile.uid}/${type}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', profile.uid), {
        [`${type}Url`]: url,
      });
      setProfile(prev => (prev ? { ...prev, [`${type}Url`]: url } : null));
      setFormData(prev => ({ ...prev, [`${type}Url`]: url }));
    } catch (err) {
      setError(`${t('profile.uploadError')} ${type}`);
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.uid) return;
    try {
      const cleanedData = Object.entries(formData).reduce((acc, [key, val]) => {
        if (val !== '' && val !== undefined && val !== null) acc[key] = val;
        return acc;
      }, {} as Record<string, any>);
      await updateDoc(doc(db, 'users', profile.uid), cleanedData);
      setProfile(prev => (prev ? { ...prev, ...cleanedData } : null));
      setIsEditing(false);
    } catch (err) {
      setError(t('profile.saveError'));
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        {error || t('profile.cannotLoad')}
      </div>
    );
  }

  return (
    <div className="bg-cream-pattern px-6 py-5 max-w-[1600px] mx-auto" style={{ minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h1 className="text-base font-semibold text-gray-800 mr-1">{t('profile.title')}</h1>
          <span className="text-[11px] text-gray-400">{profile.email}</span>
          <div className="ml-auto">
            {isEditing ? (
              <div className="flex gap-2">
                <button onClick={() => { setIsEditing(false); loadProfile(profile.uid); }}
                  className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-colors" disabled={uploadingImage}>
                  {t('profile.cancel')}
                </button>
                <button onClick={handleSave}
                  className="text-xs px-3 py-1.5 rounded font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors" disabled={uploadingImage}>
                  {uploadingImage ? t('profile.saving') : t('profile.save')}
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)}
                className="text-xs px-3 py-1.5 rounded font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                {t('profile.edit')}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded text-xs mb-4">{error}</div>
        )}

        <div className="space-y-3">
        {/* Header card: Avatar + Nombre */}
        <div className="bg-white rounded-md p-5" style={{ border: '1px solid #E8E5DE' }}>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#FAF9F7', border: '1px solid #E8E5DE' }}>
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt="perfil"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 cursor-pointer flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{t('profile.nutritionist')}</p>
              <h2 className="text-base font-semibold text-gray-800 truncate mt-0.5">{profile.displayName || t('profile.noName')}</h2>
              <p className="text-xs text-gray-500 mt-1">{profile.specialization || t('profile.noSpecialization')}</p>
            </div>
          </div>
        </div>

        {/* Información personal */}
        <div className="bg-white rounded-md" style={{ border: '1px solid #E8E5DE' }}>
          <div className="px-5 py-2.5" style={{ borderBottom: '1px solid #F0EDE8' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('profile.sections.personal')}</p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.name')}</label>
              {isEditing ? (
                <input type="text" name="displayName" value={formData.displayName || ''} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
              ) : (
                <p className="text-xs text-gray-700">{profile.displayName || t('profile.noName')}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.specialization')}</label>
              {isEditing ? (
                <input type="text" name="specialization" value={formData.specialization || ''} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
              ) : (
                <p className="text-xs text-gray-700">{profile.specialization || t('profile.empty.notSpecifiedF')}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.professionalId')}</label>
              {isEditing ? (
                <input type="text" name="professionalId" value={formData.professionalId || ''} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
              ) : (
                <p className="text-xs text-gray-700">{profile.professionalId || t('profile.empty.notSpecifiedF')}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.language')}</label>
              {isEditing ? (
                <select name="language" value={formData.language || 'es'} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800">
                  <option value="es">Español</option>
                  <option value="pt">Português</option>
                </select>
              ) : (
                <p className="text-xs text-gray-700">{profile.language === 'pt' ? 'Português' : 'Español'}</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.bio')}</label>
              {isEditing ? (
                <textarea name="bio" rows={3} value={formData.bio || ''} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 resize-none" />
              ) : (
                <p className="text-xs text-gray-700 whitespace-pre-line">{profile.bio || t('profile.empty.bio')}</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.credentials')}</label>
              {isEditing ? (
                <textarea name="credentials" rows={2} value={formData.credentials || ''} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 resize-none" />
              ) : (
                <p className="text-xs text-gray-700 whitespace-pre-line">{profile.credentials || t('profile.empty.credentials')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-md" style={{ border: '1px solid #E8E5DE' }}>
          <div className="px-5 py-2.5" style={{ borderBottom: '1px solid #F0EDE8' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('profile.sections.contact')}</p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.email')}</label>
              <p className="text-xs text-gray-700">{profile.email}</p>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.phone')}</label>
              {isEditing ? (
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
              ) : (
                <p className="text-xs text-gray-700">{profile.phone || t('profile.empty.notSpecified')}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.whatsapp')}</label>
              {isEditing ? (
                <div className="space-y-1.5">
                  <input type="tel" name="whatsapp" value={formData.whatsapp || ''} onChange={handleInputChange}
                    className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <input type="checkbox" name="showWhatsapp" checked={formData.showWhatsapp || false} onChange={handleInputChange}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600" />
                    {t('profile.showInPublic')}
                  </label>
                </div>
              ) : (
                <p className="text-xs text-gray-700">{profile.whatsapp || t('profile.empty.notSpecified')}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.website')}</label>
              {isEditing ? (
                <input type="url" name="website" value={formData.website || ''} onChange={handleInputChange} placeholder="https://..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
              ) : profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">{profile.website}</a>
              ) : (
                <p className="text-xs text-gray-700">{t('profile.empty.notSpecified')}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.businessHours')}</label>
              {isEditing ? (
                <input type="text" name="businessHours" value={formData.businessHours || ''} onChange={handleInputChange} placeholder={t('profile.placeholders.businessHours')}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
              ) : (
                <p className="text-xs text-gray-700">{profile.businessHours || t('profile.empty.notSpecified')}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{t('profile.fields.officeAddress')}</label>
              {isEditing ? (
                <input type="text" name="officeAddress" value={formData.officeAddress || ''} onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800" />
              ) : (
                <p className="text-xs text-gray-700">{profile.officeAddress || t('profile.empty.notSpecifiedF')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Logo y Firma */}
        <div className="grid grid-cols-2 gap-3">
          {/* Logo */}
          <div className="bg-white rounded-md" style={{ border: '1px solid #E8E5DE' }}>
            <div className="px-5 py-2.5" style={{ borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('profile.sections.logo')}</p>
            </div>
            <div className="p-5">
              <div className="relative w-full h-32 rounded" style={{ backgroundColor: '#FAF9F7', border: '1px dashed #E8E5DE' }}>
                {profile.logoUrl ? (
                  <div className="relative w-full h-full group">
                    <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    {isEditing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm">
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} />
                        <span className="text-white text-[11px]">{t('profile.change')}</span>
                      </label>
                    )}
                  </div>
                ) : isEditing ? (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mt-1 text-[11px] text-gray-400">{t('profile.uploadLogo')}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} />
                  </label>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mt-1 text-[11px] text-gray-300">{t('profile.noLogo')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Firma */}
          <div className="bg-white rounded-md" style={{ border: '1px solid #E8E5DE' }}>
            <div className="px-5 py-2.5" style={{ borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('profile.sections.signature')}</p>
            </div>
            <div className="p-5">
              {(() => {
                const useReal = !!formData.useRealSignature && !!profile.signatureUrl;
                const sigText = (formData.textSignature && formData.textSignature.trim()) || profile.displayName || '';
                const sigFont = formData.signatureFont || DEFAULT_SIGNATURE_FONT;
                const Radio = ({ on }: { on: boolean }) => (
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${on ? 'border-emerald-600' : 'border-gray-300'}`}>
                    {on && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                  </span>
                );

                // Vista (no edición): solo la firma activa
                if (!isEditing) {
                  return (
                    <div className="h-24 rounded flex items-center justify-center overflow-hidden px-3" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                      {useReal ? (
                        <img src={profile.signatureUrl} alt="Firma" className="max-h-full max-w-full object-contain" />
                      ) : sigText ? (
                        <SignaturePreview text={sigText} font={sigFont} size={30} />
                      ) : (
                        <span className="text-[11px] text-gray-300">{t('profile.noSignature')}</span>
                      )}
                    </div>
                  );
                }

                // Edición: dos opciones seleccionables, apiladas
                return (
                  <div className="space-y-2.5">
                    {/* Opción: firma digital */}
                    <div
                      onClick={() => setFormData(prev => ({ ...prev, useRealSignature: false }))}
                      className={`rounded-md border p-3 cursor-pointer transition-colors ${!useReal ? 'border-emerald-400 ring-1 ring-emerald-200 bg-emerald-50/30' : 'border-[#E8E5DE] hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Radio on={!useReal} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{t('profile.digitalSignature')}</span>
                      </div>
                      <div className="h-12 rounded flex items-center justify-center overflow-hidden bg-white px-2" style={{ border: '1px solid #F0EDE8' }}>
                        <SignaturePreview text={sigText || t('profile.digitalSignaturePh')} font={sigFont} size={20} />
                      </div>
                      <input
                        type="text" name="textSignature" value={formData.textSignature || ''} onChange={handleInputChange}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={profile.displayName || t('profile.digitalSignaturePh')}
                        className="mt-2 w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                      />
                      {/* Selector de fuente de firma */}
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {SIGNATURE_FONTS.map(f => {
                          const on = sigFont === f.id;
                          return (
                            <button
                              key={f.id} type="button"
                              onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, signatureFont: f.id, useRealSignature: false })); }}
                              className={`rounded-sm px-1 py-1.5 border transition-colors flex items-center justify-center overflow-hidden ${on ? 'border-emerald-400 ring-1 ring-emerald-200 bg-white' : 'border-[#E8E5DE] bg-white hover:border-gray-300'}`}
                              title={f.label}
                            >
                              <span style={{ fontFamily: `'${f.id}', cursive`, fontSize: 17, color: '#2D2B28', whiteSpace: 'nowrap' }}>{(sigText.split(' ')[0]) || 'Abc'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Opción: firma cargada */}
                    <div
                      onClick={() => { if (profile.signatureUrl) setFormData(prev => ({ ...prev, useRealSignature: true })); }}
                      className={`rounded-md border p-3 transition-colors ${profile.signatureUrl ? 'cursor-pointer' : ''} ${useReal ? 'border-emerald-400 ring-1 ring-emerald-200 bg-emerald-50/30' : 'border-[#E8E5DE] hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Radio on={useReal} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{t('profile.uploadedSignature')}</span>
                      </div>
                      {profile.signatureUrl ? (
                        <div className="h-12 rounded flex items-center justify-center overflow-hidden bg-white" style={{ border: '1px solid #F0EDE8' }}>
                          <img src={profile.signatureUrl} alt="Firma" className="max-h-full max-w-full object-contain p-1" />
                        </div>
                      ) : (
                        <div className="h-12 rounded flex items-center justify-center bg-[#FAF9F7] text-[11px] text-gray-300" style={{ border: '1px dashed #E8E5DE' }}>{t('profile.noSignature')}</div>
                      )}
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-sm border border-dashed border-[#CCC9C3] text-[11px] text-gray-500 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        {profile.signatureUrl ? t('profile.change') : t('profile.uploadSignatureImage')}
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature')} />
                      </label>
                    </div>

                    <p className="text-[10px] text-gray-400">{t('profile.signatureHelp')}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Zona de peligro */}
        <div className="bg-white rounded-md mt-4" style={{ border: '1px solid #FCA5A5' }}>
          <div className="px-5 py-2.5" style={{ borderBottom: '1px solid #FEE2E2' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">{t('profile.danger.title')}</p>
          </div>
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-500 max-w-xl">{t('profile.danger.deleteDesc')}</p>
            <button
              onClick={() => { setShowDelete(true); setDelConfirm(''); setDelPassword(''); setDelError(''); }}
              className="flex-shrink-0 self-start sm:self-auto text-xs px-3 py-1.5 rounded font-semibold text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
            >
              {t('profile.danger.deleteBtn')}
            </button>
          </div>
        </div>

        </div>
      </div>

      {/* Modal: eliminar cuenta */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setShowDelete(false)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{t('profile.danger.confirmTitle')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('profile.danger.confirmWarn')}</p>
              </div>
            </div>
            <div className="px-5 pb-2 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('profile.danger.typeToConfirm').replace('{word}', confirmWord)}</label>
                <input
                  type="text" value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} autoFocus
                  className="w-full px-3 py-2 text-sm rounded-sm bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 text-gray-800"
                />
              </div>
              {isPasswordProvider && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('profile.danger.passwordLabel')}</label>
                  <input
                    type="password" value={delPassword} onChange={(e) => setDelPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-sm bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 text-gray-800"
                  />
                </div>
              )}
              {delError && <p className="text-[11px] text-red-600">{delError}</p>}
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setShowDelete(false)} disabled={deleting} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50">{t('profile.danger.cancel')}</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || delConfirm.trim().toUpperCase() !== confirmWord.toUpperCase() || (isPasswordProvider && !delPassword)}
                className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {deleting ? t('profile.danger.deleting') : t('profile.danger.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}