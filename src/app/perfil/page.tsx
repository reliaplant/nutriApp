'use client'

import React, { useState, useEffect } from 'react';
import { authService, db, storage } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/app/shared/useTranslation';

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
        useRealSignature: userData.useRealSignature ?? false
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
              <div className="relative w-full h-32 rounded" style={{ backgroundColor: '#FAF9F7', border: '1px dashed #E8E5DE' }}>
                {profile.signatureUrl ? (
                  <div className="relative w-full h-full group">
                    <img src={profile.signatureUrl} alt="Firma" className="w-full h-full object-contain p-2" />
                    {isEditing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm">
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature')} />
                        <span className="text-white text-[11px]">{t('profile.change')}</span>
                      </label>
                    )}
                  </div>
                ) : isEditing ? (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="mt-1 text-[11px] text-gray-400">{t('profile.uploadSignature')}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature')} />
                  </label>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="mt-1 text-[11px] text-gray-300">{t('profile.noSignature')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}