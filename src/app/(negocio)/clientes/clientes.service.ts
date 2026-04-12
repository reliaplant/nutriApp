import { db } from "@/app/shared/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Cliente } from "./cliente.interface";

const CLIENTES_COLLECTION = "clientes";

export const clientesService = {
  async getAll(): Promise<Cliente[]> {
    const snapshot = await getDocs(collection(db, CLIENTES_COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Cliente));
  },

  async add(cliente: Omit<Cliente, "id" | "cantPedidos" | "totalVentas" | "interes">): Promise<string> {
    const docRef = await addDoc(collection(db, CLIENTES_COLLECTION), {
      ...cliente,
      cantPedidos: 0,
      totalVentas: 0,
      interes: [],
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Cliente>) {
    await updateDoc(doc(db, CLIENTES_COLLECTION, id), data);
  },

  async remove(id: string) {
    await deleteDoc(doc(db, CLIENTES_COLLECTION, id));
  },
};
