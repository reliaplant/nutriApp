import { db } from "@/app/shared/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Pedido } from "./pedido.interface";

const PEDIDOS_COLLECTION = "pedidos";

export const pedidosService = {
  async getAll(): Promise<Pedido[]> {
    const snapshot = await getDocs(collection(db, PEDIDOS_COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Pedido));
  },

  async add(pedido: Omit<Pedido, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, PEDIDOS_COLLECTION), pedido);
    return docRef.id;
  },

  async update(id: string, data: Partial<Pedido>) {
    await updateDoc(doc(db, PEDIDOS_COLLECTION, id), data);
  },

  async remove(id: string) {
    await deleteDoc(doc(db, PEDIDOS_COLLECTION, id));
  },
};
