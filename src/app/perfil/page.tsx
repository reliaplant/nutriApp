// ...existing code...
export interface NutritionUser {
  uid: string;
  email: string;
  displayName?: string;
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
  professionalId?: string; // nuevo campo
  language?: 'es' | 'pt';   // nuevo campo
  signatureUrl?: string;    // para firma real
  textSignature?: string;   // para firma generada
  useRealSignature?: boolean; // toggle firma real o generada
  createdAt: Timestamp;
}
// ...existing code...

// filepath: /Users/andresmacbookair15/Desktop/Codigo/nutriApp/src/app/perfil/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { authService, db, storage } from '@/app/service/firebase';
import { Timestamp } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const [profile, setProfile] = useState<NutritionistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<Partial<NutritionistProfile>>({});

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Esperamos a que la autenticación esté lista
        const user = await authService.getAuthStatePromise();
        
        if (!isMounted) return;
        
        if (!user) {
          router.replace('/login');
          return;
        }
        
        await loadProfile(user.uid);
      } catch (err) {
        if (isMounted) {
          console.error("Error durante la inicialización:", err);
          setError('Error al inicializar la autenticación');
          setLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  const loadProfile = async (uid: string) => {
    try {
      const userData = await authService.getUserData(uid);
      if (!userData) {
        setError('No se encontró perfil de usuario');
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
      setError('Error al cargar el perfil');
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
      setError(`Error al subir ${type}`);
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
      setError('Error al guardar cambios');
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
        {error || 'No se pudo cargar el perfil'}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-6 py-16">
      <div className="max-w-5xl mx-auto py-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sección izquierda */}
          <div className="flex-1 space-y-6">
            {/* Foto de perfil */}
            <div>
                <div className="relative w-42 h-42 rounded-full overflow-hidden border-4 border-white bg-gray-100 ring-2 ring-emerald-500 ring-offset-2">

                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt="perfil"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/30 bg-opacity-40 cursor-pointer flex items-center justify-center text-white">
                    <span className="sr-only">Cambiar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
              </div>
            </div>
            
          </div>
          {/* Sección derecha */}
          <div className="flex-[2] space-y-6">
            {error && (
              <div className="p-4 bg-red-100 text-red-600 rounded">{error}</div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700">Perfil profesional</h2>
              {isEditing ? (
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile(profile.uid);
                    }}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                    disabled={uploadingImage}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Editar
                </button>
              )}
            </div>
            {/* Nombre, especialización, idioma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Tu nombre"
                    value={formData.displayName || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-700">{profile.displayName || 'Sin nombre'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Especialización</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="specialization"
                    placeholder="Tu especialización"
                    value={formData.specialization || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-700">{profile.specialization || 'Nutricionista'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Idioma</label>
                {isEditing ? (
                  <select
                    name="language"
                    value={formData.language || 'es'}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="es">Español</option>
                    <option value="pt">Português</option>
                  </select>
                ) : (
                  <p className="text-gray-700">
                    {profile.language === 'pt' ? 'Português' : 'Español'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cédula Profesional</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="professionalId"
                    value={formData.professionalId || ''}
                    onChange={handleInputChange}
                    placeholder="Tu cédula"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-700">{profile.professionalId || 'No especificada'}</p>
                )}
              </div>
            </div>
            {/* Rest of data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <p className="text-gray-700">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Teléfono profesional</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-700">{profile.phone || 'No especificado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">WhatsApp</label>
                {isEditing ? (
                  <>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 mb-1"
                    />
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        name="showWhatsapp"
                        checked={formData.showWhatsapp || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                      />
                      <span>Mostrar en perfil público</span>
                    </label>
                  </>
                ) : (
                  <p className="text-gray-700">{profile.whatsapp || 'No especificado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sitio web</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  />
                ) : profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <p className="text-gray-700">No especificado</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Biografía profesional</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  rows={4}
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              ) : (
                <p className="whitespace-pre-line text-gray-700">
                  {profile.bio || 'No has añadido información biográfica.'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Credenciales</label>
                {isEditing ? (
                  <textarea
                    name="credentials"
                    rows={2}
                    value={formData.credentials || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                ) : (
                  <p className="whitespace-pre-line text-gray-700">
                    {profile.credentials || 'No has añadido credenciales profesionales.'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Horario de atención</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="businessHours"
                    value={formData.businessHours || ''}
                    onChange={handleInputChange}
                    placeholder="Lunes a Viernes, 9am-5pm"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-700">{profile.businessHours || 'No especificado'}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Dirección de la consulta</label>
              {isEditing ? (
                <input
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-gray-700">{profile.officeAddress || 'No especificada'}</p>
              )}
            </div>
            {/* Logo Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Logo</label>
              <div className="relative w-full h-48 bg-white rounded-lg border-2  border-gray-300  transition-colors duration-200">
                {profile.logoUrl ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={profile.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {isEditing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                        <span className="sr-only">Cambiar Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                          disabled={uploadingImage}
                        />
                        <div className="text-white text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm">Cambiar logo</p>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-gray-500">
                      Subir logo
                    </span>
                    <span className="mt-1 block text-xs text-gray-400">
                      PNG, JPG (max. 2MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>
            {/* Signature Section */}
            <div className="space-y-2 mt-6">
              <label className="block text-sm font-medium text-gray-700">Firma</label>
              <div className="relative w-full h-48 bg-white rounded-lg border-2  border-gray-300  transition-colors duration-200">
                {profile.signatureUrl ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={profile.signatureUrl}
                      alt="Firma"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {isEditing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                        <span className="sr-only">Cambiar Firma</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature')}
                          disabled={uploadingImage}
                        />
                        <div className="text-white text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <p className="mt-2 text-sm">Cambiar firma</p>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-gray-500">
                      Subir firma
                    </span>
                    <span className="mt-1 block text-xs text-gray-400">
                      PNG, JPG (max. 2MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature')}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}