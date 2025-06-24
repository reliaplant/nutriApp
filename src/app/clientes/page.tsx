"use client";

import { useState, useEffect } from "react";
import { Cliente } from "./cliente.interface";
import { clientesService } from "./clientes.service";
import { getPedidosPagadosPorCliente } from "./pedidosPagadosPorCliente";
import { getUltimaFechaPedidoPorCliente } from "./ultimaFechaPedidoPorCliente";
import { pedidosService } from "../ventas/pedidos.service";
import { productosService } from "../productos/productos.service";
import { Pedido } from "../ventas/pedido.interface";
import { Producto } from "../productos/producto.interface";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState<Omit<Cliente, "id" | "cantPedidos" | "totalVentas" | "interes">>({
    nombre: "",
    dondeVive: "",
    telefono: "",
    correo: "",
    pais: "",
    origen: "feria zibata",
    nivel: "",
  });
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [errorNombre, setErrorNombre] = useState("");
  const [otroDondeVive, setOtroDondeVive] = useState("");
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([]);
  const [clientePedidos, setClientePedidos] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Cargar clientes al montar
  useEffect(() => {
    clientesService.getAll().then(async (clientes) => {
      const pedidosPagados = await getPedidosPagadosPorCliente();
      const ultimaFecha = await getUltimaFechaPedidoPorCliente();
      setClientes(
        clientes.map((c) => ({
          ...c,
          cantPedidosPagados: pedidosPagados[c.id] || 0,
          ultimaFechaPedido: ultimaFecha[c.id] || null,
        }))
      );
    });
    productosService.getAll().then(setProductos);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgregarCliente = async () => {
    const id = await clientesService.add(nuevoCliente);
    setClientes((prev) => [
      {
        ...nuevoCliente,
        id,
        cantPedidos: 0,
        totalVentas: 0,
        interes: [],
      },
      ...prev,
    ]);
    setShowModal(false);
    setNuevoCliente({
      nombre: "",
      dondeVive: "",
      telefono: "",
      correo: "",
      pais: "",
      origen: "feria zibata",
      nivel: "",
    });
  };

  const handleGuardarCliente = async () => {
    const dondeViveFinal = nuevoCliente.dondeVive === "otro" ? otroDondeVive : nuevoCliente.dondeVive;
    if (!nuevoCliente.nombre.trim()) {
      setErrorNombre("El nombre es obligatorio");
      return;
    }
    setErrorNombre("");
    if (editandoCliente) {
      await clientesService.update(editandoCliente.id, { ...nuevoCliente, dondeVive: dondeViveFinal });
      setClientes((prev) => prev.map((c) =>
        c.id === editandoCliente.id ? { ...c, ...nuevoCliente, dondeVive: dondeViveFinal } : c
      ));
    } else {
      const id = await clientesService.add({ ...nuevoCliente, dondeVive: dondeViveFinal });
      setClientes((prev) => [
        {
          ...nuevoCliente,
          dondeVive: dondeViveFinal,
          id,
          cantPedidos: 0,
          totalVentas: 0,
          interes: [],
        },
        ...prev,
      ]);
    }
    setShowModal(false);
    setNuevoCliente({
      nombre: "",
      dondeVive: "",
      telefono: "",
      correo: "",
      pais: "",
      origen: "feria zibata",
      nivel: "",
    });
    setOtroDondeVive("");
    setEditandoCliente(null);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setEditandoCliente(cliente);
    setNuevoCliente({
      nombre: cliente.nombre,
      dondeVive: ["zibata", "altozano", "zakia", "juriquilla"].includes(cliente.dondeVive) ? cliente.dondeVive : "otro",
      telefono: cliente.telefono,
      correo: cliente.correo,
      pais: cliente.pais,
      origen: cliente.origen || "",
      nivel: cliente.nivel,
    });
    setOtroDondeVive(["zibata", "altozano", "zakia", "juriquilla"].includes(cliente.dondeVive) ? "" : cliente.dondeVive);
    setShowModal(true);
  };

  // Mostrar pedidos del cliente en modal
  const handleVerPedidos = async (cliente: Cliente) => {
    setClientePedidos(cliente);
    const pedidos = await pedidosService.getAll();
    setPedidosCliente(pedidos.filter((p: any) => p.clienteId === cliente.id));
    setShowPedidosModal(true);
  };

  return (
    <div className="bg-gray-100 min-h-screen enton">
      <div className="flex justify-between items-center p-2 px-4 bg-gray-100">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button
          className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700 transition"
          onClick={() => setShowModal(true)}
        >
          + Agregar Cliente
        </button>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm overflow-hidden">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-gray-700 font-semibold text-sm rounded-tl-lg">Nombre</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">¿Dónde vive?</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Teléfono Whats</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Correo</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">País</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Origen</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Nivel</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Pedidos</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Días desde último pedido</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Total Ventas</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Interés</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-400 text-lg font-semibold bg-gray-50 rounded-b-lg">No hay clientes aún.</td>
              </tr>
            ) : (
              clientes.map((cliente, idx) => (
                <tr
                  key={cliente.id}
                  className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50/40`}
                >
                  <td className="px-4 py-2 text-xs text-gray-700 text-left font-medium cursor-pointer" onClick={() => handleEditarCliente(cliente)}>{cliente.nombre}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{cliente.dondeVive}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{cliente.telefono}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{cliente.correo}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{cliente.pais}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{cliente.origen}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{cliente.nivel}</td>
                  <td className="px-4 py-2 text-xs text-gray-700 text-center font-semibold cursor-pointer underline hover:text-emerald-700" onClick={() => handleVerPedidos(cliente)}>{cliente.cantPedidosPagados ?? 0}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{
                    cliente.ultimaFechaPedido
                      ? (() => {
                          const dias = Math.floor((Date.now() - new Date(cliente.ultimaFechaPedido).getTime()) / (1000 * 60 * 60 * 24));
                          return dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`;
                        })()
                      : '-'
                  }</td>
                  <td className="px-4 py-2 text-xs text-right text-center font-bold text-emerald-700">${cliente.totalVentas?.toFixed(2) ?? '0.00'}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{cliente.interes?.join(", ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal para agregar/editar cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editandoCliente ? 'Editar Cliente' : 'Agregar Cliente'}</h2>
            <div className="space-y-3">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                className={`w-full border rounded px-3 py-2 ${errorNombre ? 'border-red-500' : ''}`}
                value={nuevoCliente.nombre}
                onChange={handleInputChange}
              />
              {errorNombre && <p className="text-red-500 text-xs mt-1">{errorNombre}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Dónde vive?</label>
                <select
                  name="dondeVive"
                  className="w-full border rounded px-3 py-2"
                  value={nuevoCliente.dondeVive}
                  onChange={e => setNuevoCliente(prev => ({ ...prev, dondeVive: e.target.value }))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="zibata">Zibatá</option>
                  <option value="altozano">Altozano</option>
                  <option value="zakia">Zakia</option>
                  <option value="juriquilla">Juriquilla</option>
                  <option value="otro">Otro</option>
                </select>
                {nuevoCliente.dondeVive === "otro" && (
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 mt-2"
                    placeholder="Especifica dónde vive"
                    value={otroDondeVive}
                    onChange={e => setOtroDondeVive(e.target.value)}
                  />
                )}
              </div>
              <input
                type="text"
                name="telefono"
                placeholder="Teléfono WhatsApp"
                className="w-full border rounded px-3 py-2"
                value={nuevoCliente.telefono}
                onChange={handleInputChange}
              />
              <input
                type="email"
                name="correo"
                placeholder="Correo"
                className="w-full border rounded px-3 py-2"
                value={nuevoCliente.correo}
                onChange={handleInputChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <select
                  name="pais"
                  className="w-full border rounded px-3 py-2"
                  value={nuevoCliente.pais}
                  onChange={e => setNuevoCliente(prev => ({ ...prev, pais: e.target.value }))}
                >
                  <option value="">Selecciona un país</option>
                  <option value="mexico">México</option>
                  <option value="argentina">Argentina</option>
                  <option value="brasil">Brasil</option>
                  <option value="colombia">Colombia</option>
                  <option value="venezuela">Venezuela</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                <select
                  name="origen"
                  className="w-full border rounded px-3 py-2"
                  value={nuevoCliente.origen || ""}
                  onChange={e => setNuevoCliente(prev => ({ ...prev, origen: e.target.value as Cliente["origen"] }))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="feria zibata">Feria Zibatá</option>
                  <option value="feria altozano">Feria Altozano</option>
                  <option value="feria jurica">Feria Jurica</option>
                  <option value="feria juriquilla">Feria Juriquilla</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="publicaciones en grupos">Publicaciones en grupos</option>
                  <option value="indicacion">Indicación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                <select
                  name="nivel"
                  className="w-full border rounded px-3 py-2"
                  value={nuevoCliente.nivel}
                  onChange={e => setNuevoCliente(prev => ({ ...prev, nivel: e.target.value }))}
                >
                  <option value="">Selecciona un nivel</option>
                  <option value="degustador">Degustador</option>
                  <option value="fan">Fan</option>
                  <option value="estrella">Estrella</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setShowModal(false);
                  setNuevoCliente({
                    nombre: "",
                    dondeVive: "",
                    telefono: "",
                    correo: "",
                    pais: "",
                    origen: "feria zibata",
                    nivel: "",
                  });
                  setEditandoCliente(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleGuardarCliente}
              >
                {editandoCliente ? 'Guardar Cambios' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de pedidos del cliente */}
      {showPedidosModal && clientePedidos && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-emerald-700">Pedidos de {clientePedidos.nombre}</h2>
            <button className="absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowPedidosModal(false)}>&times;</button>
            {pedidosCliente.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No hay pedidos para este cliente.</div>
            ) : (
              <table className="min-w-full bg-white border border-gray-200 shadow-sm overflow-hidden text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-center">Productos</th>
                    <th className="px-4 py-2 text-center">Total</th>
                    <th className="px-4 py-2 text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosCliente.map((pedido: any) => (
                    <tr key={pedido.id} className="border-t hover:bg-emerald-50/40">
                      <td className="px-4 py-2">{new Date(pedido.fecha).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-center whitespace-pre-line">{pedido.productos.map((p: any) => {
                        const prod = productos.find((pr: any) => pr.id === p.productoId);
                        return prod ? `${prod.nombre} x${p.cantidad}\n` : '';
                      }).join('')}</td>
                      <td className="px-4 py-2 text-center font-bold text-emerald-700">${pedido.total.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${pedido.estatus === 'vendida' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>{pedido.estatus === 'vendida' ? 'Vendida' : 'Pendiente'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
