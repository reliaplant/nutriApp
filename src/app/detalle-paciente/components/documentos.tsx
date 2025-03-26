'use client'

import { useState, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc as firestoreDoc,
  getFirestore 
} from 'firebase/firestore';
import { app } from '@/app/shared/firebase';

// Definir una interfaz para los documentos
export interface PatientDocument {
  id: string;
  name: string;
  fileName: string;
  uploadDate: string;
  fileSize: number;
  fileType: string;
  url: string;
  storagePath?: string; // Añadir para poder eliminar fácilmente
}

interface DocumentosProps {
  patientId: string;
  initialDocuments?: PatientDocument[];
  onDocumentAdded?: (doc: PatientDocument) => void;
  onDocumentDeleted?: (id: string) => void;
}

const Documentos = ({ 
  patientId, 
  initialDocuments = [], 
  onDocumentAdded,
  onDocumentDeleted 
}: DocumentosProps) => {
  // Estados para la sección de documentos
  const [documents, setDocuments] = useState<PatientDocument[]>(initialDocuments);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para el modal de eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const db = getFirestore(app);

  // Función para cargar documentos desde Firestore y Storage
  const fetchDocuments = async () => {
    if (!patientId) {
      console.log("No hay ID de paciente, no se pueden cargar documentos");
      return;
    }
    
    console.log("Iniciando carga de documentos para paciente:", patientId);
    setIsLoading(true);
    try {
      // 1. Obtenemos los documentos de Firestore
      const q = query(
        collection(db, "patientDocuments"), 
        where("patientId", "==", patientId)
      );
      
      console.log("Ejecutando consulta en Firestore...");
      const querySnapshot = await getDocs(q);
      console.log(`Se encontraron ${querySnapshot.docs.length} documentos en Firestore`);
      
      const fetchedDocs: PatientDocument[] = [];
      
      // 2. Procesamos cada documento
      for (const doc of querySnapshot.docs) {
        const data = doc.data() as PatientDocument & { patientId: string };
        console.log("Documento encontrado:", doc.id, data);
        fetchedDocs.push({
          id: doc.id,
          name: data.name,
          fileName: data.fileName,
          uploadDate: data.uploadDate,
          fileSize: data.fileSize,
          fileType: data.fileType,
          url: data.url,
          storagePath: data.storagePath
        });
      }
      
      // 3. Ordenamos por fecha (más reciente primero)
      fetchedDocs.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
      
      console.log("Documentos ordenados y procesados:", fetchedDocs.length);
      setDocuments(fetchedDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar documentos al montar el componente o cambiar el ID del paciente
  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  // Función para manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Auto-completar el nombre del documento si está vacío
      if (!newDocumentName.trim()) {
        // Usar el nombre del archivo sin la extensión
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setNewDocumentName(fileName);
      }
    }
  };

  // Función para subir el archivo a Firebase Storage
  const uploadFileToFirebase = async () => {
    if (!selectedFile || !newDocumentName.trim()) {
      setUploadError('Se requiere un archivo y un nombre para el documento');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    try {
      const storage = getStorage(app);
      
      // Crear una referencia única para el archivo
      const fileExtension = selectedFile.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${patientId.substring(0, 8)}.${fileExtension}`;
      
      // Crear una referencia en la ruta deseada
      const storagePath = `pacientes/${patientId}/documentos/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Iniciar la carga con seguimiento del progreso
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      
      // Configurar el listener para el progreso de carga
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Actualizar el progreso
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          // Manejar errores
          console.error('Error uploading file:', error);
          setUploadError('Error al subir el archivo. Por favor, intenta de nuevo.');
          setIsUploading(false);
        },
        async () => {
          // Carga completada exitosamente
          // Obtener la URL del archivo subido
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Crear el objeto del documento
          const newDocument: PatientDocument = {
            id: `doc-${Date.now()}`,
            name: newDocumentName.trim(),
            fileName: selectedFile.name,
            uploadDate: new Date().toISOString(),
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            url: downloadURL,
            storagePath: storagePath // Guardar la ruta para eliminar después
          };
          
          // Guardar metadatos en Firestore
          try {
            const docRef = await addDoc(collection(db, "patientDocuments"), {
              ...newDocument,
              patientId: patientId // Añadir el ID del paciente para consultas
            });
            
            // Actualizar el ID con el de Firestore
            newDocument.id = docRef.id;
            
          } catch (err) {
            console.error("Error saving document metadata:", err);
            // Si falla al guardar metadatos, seguimos porque el archivo ya se subió
          }
          
          // Actualizar el estado local
          setDocuments(prevDocs => [newDocument, ...prevDocs]);
          
          // Notificar al componente padre
          if (onDocumentAdded) {
            onDocumentAdded(newDocument);
          }
          
          // Resetear el formulario
          setNewDocumentName('');
          setSelectedFile(null);
          setUploadProgress(0);
          setIsUploading(false);
          setShowUploadModal(false);
          
          // También podríamos resetear el input de archivo
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      );
    } catch (err) {
      console.error('Error starting upload:', err);
      setUploadError('Error al iniciar la carga. Por favor, intenta de nuevo.');
      setIsUploading(false);
    }
  };

  // Función para iniciar el proceso de eliminación (muestra el modal)
  const handleDeleteDocument = (id: string) => {
    setDocumentToDelete(id);
    setShowDeleteModal(true);
  };

  // Función para confirmar y realizar la eliminación
  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const documentToRemove = documents.find(doc => doc.id === documentToDelete);
      
      if (documentToRemove) {
        // 1. Eliminar el archivo de Firebase Storage si hay ruta
        if (documentToRemove.storagePath) {
          const storage = getStorage(app);
          const fileRef = ref(storage, documentToRemove.storagePath);
          
          await deleteObject(fileRef);
        }
        
        // 2. Eliminar los metadatos de Firestore
        await deleteDoc(firestoreDoc(db, "patientDocuments", documentToDelete));
        
        // 3. Actualizar el estado local
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentToDelete));
        
        // 4. Notificar al componente padre
        if (onDocumentDeleted) {
          onDocumentDeleted(documentToDelete);
        }
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento. Por favor, inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  // Formatear el tamaño del archivo para mostrar
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Mensaje de depuración
  console.log("Estado actual:", { 
    patientId, 
    documents: documents.length, 
    isLoading, 
    initialDocuments: initialDocuments?.length || 0 
  });

  return (
    <div className="bg-white p-6 border border-gray-300 radius shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Documentos</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-emerald-600 text-white px-3 py-1 text-sm rounded hover:bg-emerald-700 transition flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Subir documento
        </button>
      </div>

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  {/* Icono basado en tipo de archivo */}
                  <div className="mr-3 text-gray-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{doc.name}</h4>
                    <div className="text-xs text-gray-500 flex items-center">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span className="mx-1">•</span>
                      <span>{format(parseISO(doc.uploadDate), "d MMM yyyy", { locale: es })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 hover:bg-gray-200"
                >
                  Ver
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-xs bg-red-50 px-2 py-1 rounded text-red-700 hover:bg-red-100"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay documentos subidos
        </div>
      )}

      {/* Modal de subida de documentos */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-green-50/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow relative">
            <button 
              onClick={() => {
                if (!isUploading) setShowUploadModal(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={isUploading}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subir nuevo documento</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del documento
                </label>
                <input
                  id="documentName"
                  type="text"
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Análisis de sangre"
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <label htmlFor="documentFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo
                </label>
                <input
                  id="documentFile"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  disabled={isUploading}
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-gray-500">
                    Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              
              {/* Barra de progreso para la carga */}
              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-emerald-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(uploadProgress)}% completado</p>
                </div>
              )}
              
              {/* Mensaje de error */}
              {uploadError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {uploadError}
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!isUploading) setShowUploadModal(false);
                  }}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={uploadFileToFirebase}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? 'Subiendo...' : 'Subir documento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal minimalista de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-green-50/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow relative">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Confirmar eliminación</h3>
            
            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteDocument}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentos;