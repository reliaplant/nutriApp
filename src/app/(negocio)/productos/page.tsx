"use client";
import { useState, useEffect } from "react";
import { Producto } from "./producto.interface";
import { paodequeijoService } from "./paodequeijo.service";
import { Image as ImageIcon, Upload, X } from 'lucide-react';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState<Omit<Producto, "id">>({
    nombre: "",
    precio: 0,
    costo: 0,
    notas: "",
    foto: "",
    descripcion: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [editandoProducto, setEditandoProducto] = useState<Producto | null>(null);

  useEffect(() => {
    paodequeijoService.getAll().then(setProductos);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUpload(file);
    setIsUploading(true);
    try {
      const storageRef = (await import("firebase/storage")).ref;
      const uploadBytesResumable = (await import("firebase/storage")).uploadBytesResumable;
      const getDownloadURL = (await import("firebase/storage")).getDownloadURL;
      const { getStorage } = await import("firebase/storage");
      const storage = getStorage();
      const fileRef = storageRef(storage, `productos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTask.on('state_changed', (snapshot) => {
        setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      });
      await uploadTask;
      const url = await getDownloadURL(fileRef);
      setNuevoProducto((prev) => ({ ...prev, foto: url }));
    } catch (err) {
      // Manejo de error opcional
    } finally {
      setIsUploading(false);
    }
  };

  // Para abrir el modal en modo edición
  const handleEditarProducto = (producto: Producto) => {
    setEditandoProducto(producto);
    setNuevoProducto({ ...producto });
    setShowModal(true);
    setImageUpload(null);
    setUploadProgress(0);
  };

  // Guardar cambios (crear o editar)
  const handleGuardarProducto = async () => {
    if (editandoProducto) {
      // Editar producto existente
      await paodequeijoService.update(editandoProducto.id, {
        ...nuevoProducto,
        precio: Number(nuevoProducto.precio),
        costo: Number(nuevoProducto.costo),
      });
      setProductos((prev) => prev.map((p) =>
        p.id === editandoProducto.id
          ? { ...editandoProducto, ...nuevoProducto, precio: Number(nuevoProducto.precio), costo: Number(nuevoProducto.costo) }
          : p
      ));
    } else {
      // Crear producto nuevo
      const id = await paodequeijoService.add({ ...nuevoProducto, precio: Number(nuevoProducto.precio), costo: Number(nuevoProducto.costo) });
      setProductos((prev) => [
        { ...nuevoProducto, id, precio: Number(nuevoProducto.precio), costo: Number(nuevoProducto.costo) },
        ...prev,
      ]);
    }
    setShowModal(false);
    setNuevoProducto({ nombre: "", precio: 0, costo: 0, notas: "", foto: "", descripcion: "" });
    setEditandoProducto(null);
    setImageUpload(null);
    setUploadProgress(0);
  };

  return (
    <div className="bg-gray-100 min-h-screen enton">
      <div className="flex justify-between items-center p-2 px-4 bg-gray-100">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button
          className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700 transition"
          onClick={() => setShowModal(true)}
        >
          + Agregar Producto
        </button>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm overflow-hidden">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-gray-700 font-semibold text-sm rounded-tl-lg">Nombre</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Precio</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Costo</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Notas</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Descripción</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tr-lg">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-lg font-semibold bg-gray-50 rounded-b-lg">No hay productos aún.</td>
              </tr>
            ) : (
              productos.map((producto, idx) => (
                <tr
                  key={producto.id}
                  className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50/40 group`}
                >
                  <td className="px-4 py-2 text-xs text-gray-700 text-left font-medium">{producto.nombre}</td>
                  <td className="px-4 py-2 text-xs text-emerald-700 text-center font-bold">${producto.precio.toFixed(2)}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">${producto.costo.toFixed(2)}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{producto.notas}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{producto.descripcion}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="text-emerald-600 hover:underline opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleEditarProducto(producto)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal para agregar/editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">{editandoProducto ? 'Editar Producto' : 'Agregar Producto'}</h2>
            <div className="flex flex-row gap-6 mb-4 items-start">
              <div className="flex flex-col items-center min-w-[140px] w-1/3 relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del producto</label>
                <div
                  className="w-28 h-28 border border-gray-100 rounded overflow-hidden flex items-center justify-center bg-gray-50 relative cursor-pointer group"
                  onClick={() => document.getElementById('foto-upload')?.click()}
                >
                  {imageUpload ? (
                    <img src={URL.createObjectURL(imageUpload)} alt="Vista previa" className="object-cover w-full h-full" />
                  ) : nuevoProducto.foto ? (
                    <img src={nuevoProducto.foto} alt="Vista previa" className="object-cover w-full h-full" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <Upload className="h-6 w-6 mb-1 text-white" />
                    <span className="text-sm font-medium text-white">
                      {imageUpload ? 'Cambiar imagen' : nuevoProducto.foto ? 'Reemplazar imagen' : 'Subir imagen'}
                    </span>
                    <p className="text-xs text-gray-300 mt-2 text-center">JPG o PNG, máx 2MB</p>
                    {imageUpload && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setImageUpload(null); }}
                        className="mt-2 px-2 py-1 bg-red-600 bg-opacity-70 hover:bg-opacity-100 rounded-full text-white text-xs flex items-center transition-colors"
                      >
                        <X className="h-3 w-3 mr-1" />Cancelar
                      </button>
                    )}
                    {isUploading && (
                      <div className="w-4/5 bg-gray-200 rounded-full h-1.5 mt-3">
                        <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                  <input
                    id="foto-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={nuevoProducto.nombre}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div className="mb-3 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                    <input
                      type="number"
                      name="precio"
                      value={nuevoProducto.precio}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
                    <input
                      type="number"
                      name="costo"
                      value={nuevoProducto.costo}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={nuevoProducto.descripcion}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    name="notas"
                    value={nuevoProducto.notas}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                onClick={() => {
                  setShowModal(false);
                  setEditandoProducto(null);
                  setNuevoProducto({ nombre: "", precio: 0, costo: 0, notas: "", foto: "", descripcion: "" });
                  setImageUpload(null);
                  setUploadProgress(0);
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                onClick={handleGuardarProducto}
                disabled={isUploading}
              >
                {editandoProducto ? 'Guardar Cambios' : 'Agregar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
