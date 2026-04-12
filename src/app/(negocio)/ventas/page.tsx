"use client";
import { useState, useEffect } from "react";
import { clientesService } from "@/app/(negocio)/clientes/clientes.service";
import { productosService } from "@/app/(negocio)/productos/productos.service";
import { pedidosService } from "./pedidos.service";
import { Pedido } from "./pedido.interface";
import { Cliente } from "@/app/(negocio)/clientes/cliente.interface";
import { Producto } from "@/app/(negocio)/productos/producto.interface";

export default function VentasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pedido, setPedido] = useState<
    Omit<Pedido, "id" | "total"> & { total?: number; fecha?: string }
  >({
    clienteId: "",
    productos: [],
    estatus: "pendiente",
    origen: "pedido por whats",
    fecha: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    clientesService.getAll().then(setClientes);
    productosService.getAll().then(setProductos);
    pedidosService.getAll().then(setPedidos);
  }, []);

  const handleAddProducto = (productoId: string) => {
    setPedido((prev) => {
      const existe = prev.productos.find((p) => p.productoId === productoId);
      if (existe) {
        return {
          ...prev,
          productos: prev.productos.map((p) =>
            p.productoId === productoId ? { ...p, cantidad: p.cantidad + 1 } : p
          ),
        };
      } else {
        const prod = productos.find((p) => p.id === productoId);
        return {
          ...prev,
          productos: [
            ...prev.productos,
            { productoId, cantidad: 1, precioUnitario: prod ? prod.precio : 0 },
          ],
        };
      }
    });
  };

  const handleRemoveProducto = (productoId: string) => {
    setPedido((prev) => ({
      ...prev,
      productos: prev.productos.filter((p) => p.productoId !== productoId),
    }));
  };

  const calcularTotal = () => {
    return pedido.productos.reduce(
      (acc, p) => acc + p.cantidad * p.precioUnitario,
      0
    );
  };

  const handleEditarPedido = (pedidoEdit: Pedido) => {
    setEditandoId(pedidoEdit.id);
    setPedido({
      clienteId: pedidoEdit.clienteId,
      productos: pedidoEdit.productos.map(p => ({ ...p })),
      estatus: pedidoEdit.estatus,
      origen: pedidoEdit.origen,
      total: pedidoEdit.total,
      fecha: pedidoEdit.fecha ? new Date(pedidoEdit.fecha).toISOString().slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleGuardarPedido = async () => {
    const total = calcularTotal();
    const fecha = editandoId ? pedidos.find(p => p.id === editandoId)?.fecha || new Date().toISOString() : new Date().toISOString();
    if (editandoId) {
      await pedidosService.update(editandoId, { ...pedido, total });
      setPedidos(prev => prev.map(p => p.id === editandoId ? { ...p, ...pedido, total } : p));
      setEditandoId(null);
    } else {
      const id = await pedidosService.add({ ...pedido, total, fecha });
      setPedidos((prev) => [
        { ...pedido, id, total, fecha },
        ...prev,
      ]);
    }
    setShowModal(false);
    setPedido({ clienteId: "", productos: [], estatus: "pendiente", origen: "pedido por whats", fecha: new Date().toISOString().slice(0, 10) });
  };

  const handleBorrarPedido = async (id: string) => {
    await pedidosService.remove(id);
    setPedidos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="bg-gray-100 min-h-screen enton">
      <div className="flex justify-between items-center p-2 px-4 bg-gray-100">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <button
          className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700 transition"
          onClick={() => setShowModal(true)}
        >
          + Nuevo Pedido
        </button>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-gray-700 font-semibold text-sm rounded-tl-lg">Fecha</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Cliente</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Productos</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Origen</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Total</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tr-lg">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-lg font-semibold bg-gray-50 rounded-b-lg">No hay pedidos aún.</td>
              </tr>
            ) : (
              pedidos.map((pedido, idx) => (
                <tr
                  key={pedido.id}
                  className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50/40 cursor-pointer`}
                  onClick={() => handleEditarPedido(pedido)}
                >
                  <td className="px-4 py-2 text-xs text-gray-500 text-left font-medium">
                    {(() => {
                      const fecha = new Date(pedido.fecha);
                      const hoy = new Date();
                      const diffMs = hoy.setHours(0,0,0,0) - fecha.setHours(0,0,0,0);
                      const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      return `${fecha.toLocaleDateString()}${!isNaN(dias) ? ` (${dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`})` : ''}`;
                    })()}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-gray-700">{clientes.find((c) => c.id === pedido.clienteId)?.nombre || "-"}</td>
                  <td className="px-4 py-2 whitespace-pre-line text-xs text-gray-600 text-center">
                    {pedido.productos.map((p) => {
                      const prod = productos.find((pr) => pr.id === p.productoId);
                      return prod ? `${prod.nombre} x${p.cantidad}\n` : '';
                    }).join('')}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{pedido.origen}</td>
                  <td className="px-4 py-2 text-right text-center font-bold text-emerald-700">${pedido.total.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border
                        ${pedido.estatus === 'vendida'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'}
                      `}
                    >
                      {pedido.estatus === 'vendida' ? 'Vendida' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal para nuevo pedido */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-emerald-700 tracking-tight">Nuevo Pedido</h2>
            <div className="mb-6 flex flex-row gap-8 items-start">
              <div className="flex-1 min-w-[220px] space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente</label>
                  <select
                    className="w-full border-none rounded-lg px-4 py-2 bg-gray-100 focus:ring-2 focus:ring-emerald-300 focus:bg-white transition"
                    value={pedido.clienteId}
                    onChange={e => setPedido(prev => ({ ...prev, clienteId: e.target.value }))}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.telefono ? `(${cliente.telefono})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Origen</label>
                  <select
                    className="w-full border-none rounded-lg px-4 py-2 bg-gray-100 focus:ring-2 focus:ring-emerald-300 focus:bg-white transition"
                    value={pedido.origen}
                    onChange={e => setPedido(prev => ({ ...prev, origen: e.target.value as Pedido["origen"] }))}
                  >
                    <option value="pedido por whats">Pedido por Whats</option>
                    <option value="feria zibata">Feria Zibatá</option>
                    <option value="feria altozano">Feria Altozano</option>
                    <option value="otra feria">Otra feria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estatus</label>
                  <select
                    className={`w-full border-none rounded-lg px-4 py-2 focus:ring-2 focus:bg-white transition ${pedido.estatus === 'vendida' ? 'bg-emerald-100 focus:ring-emerald-300' : 'bg-yellow-100 focus:ring-yellow-300'}`}
                    value={pedido.estatus}
                    onChange={e => setPedido(prev => ({ ...prev, estatus: e.target.value as 'pendiente' | 'vendida' }))}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="vendida">Vendida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    className="w-full border-none rounded-lg px-4 py-2 bg-gray-100 focus:ring-2 focus:ring-emerald-300 focus:bg-white transition"
                    value={pedido.fecha || ''}
                    onChange={e => setPedido(prev => ({ ...prev, fecha: e.target.value }))}
                    disabled={!editandoId}
                  />
                  {editandoId && <span className="text-xs text-gray-400">Solo editable al modificar una venta</span>}
                </div>
              </div>
              <div className="flex-[2]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Productos</label>
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-700">
                        <th className="px-3 py-2 text-left font-semibold">Producto</th>
                        <th className="px-3 py-2 text-center font-semibold">Cantidad</th>
                        <th className="px-3 py-2 text-right font-semibold">Precio</th>
                        <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-gray-300 bg-gray-50 font-semibold text-lg rounded-xl">
                            No hay productos disponibles.
                          </td>
                        </tr>
                      ) : (
                        productos.map(producto => {
                          const enPedido = pedido.productos.find(p => p.productoId === producto.id);
                          return (
                            <tr key={producto.id} className="border-b last:border-b-0 hover:bg-emerald-50/30">
                              <td className="px-3 py-2">{producto.nombre}</td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  className="w-16 border-none rounded-lg px-2 py-1 text-center bg-white focus:ring-2 focus:ring-emerald-300 transition"
                                  value={enPedido ? enPedido.cantidad : 0}
                                  onChange={e => {
                                    const cantidad = Math.max(0, Number(e.target.value));
                                    setPedido(prev => {
                                      const existe = prev.productos.find(p => p.productoId === producto.id);
                                      if (existe) {
                                        if (cantidad === 0) {
                                          return {
                                            ...prev,
                                            productos: prev.productos.filter(p => p.productoId !== producto.id),
                                          };
                                        }
                                        return {
                                          ...prev,
                                          productos: prev.productos.map(p =>
                                            p.productoId === producto.id ? { ...p, cantidad } : p
                                          ),
                                        };
                                      } else if (cantidad > 0) {
                                        return {
                                          ...prev,
                                          productos: [
                                            ...prev.productos,
                                            { productoId: producto.id, cantidad, precioUnitario: producto.precio },
                                          ],
                                        };
                                      }
                                      return prev;
                                    });
                                  }}
                                />
                              </td>
                              <td className="px-3 py-2 text-right">${producto.precio.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">
                                {enPedido ? `$${(enPedido.cantidad * producto.precio).toFixed(2)}` : <span className="text-gray-300">$0.00</span>}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="text-2xl font-bold text-emerald-700">${calcularTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <button
                className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition"
                onClick={() => {
                  setShowModal(false);
                  setPedido({ clienteId: "", productos: [], estatus: "pendiente", origen: "pedido por whats", fecha: new Date().toISOString().slice(0, 10) });
                  setEditandoId(null);
                }}
              >
                Cancelar
              </button>
              {editandoId && (
                <button
                  className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold shadow transition"
                  onClick={async () => {
                    if (window.confirm('¿Seguro que deseas borrar este pedido?')) {
                      await handleBorrarPedido(editandoId!);
                      setShowModal(false);
                      setEditandoId(null);
                    }
                  }}
                >
                  Borrar
                </button>
              )}
              <button
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow transition"
                onClick={handleGuardarPedido}
                disabled={!pedido.clienteId || pedido.productos.length === 0}
              >
                Guardar Pedido
                {editandoId && <span className="ml-2 text-xs text-gray-400">(Editando)</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
