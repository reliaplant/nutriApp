import { db } from "@/app/shared/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Producto } from "./producto.interface";

const PRODUCTOS_COLLECTION = "productos";

export const productosService = {
  async getAll(): Promise<Producto[]> {
    const snapshot = await getDocs(collection(db, PRODUCTOS_COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Producto));
  },

  async add(producto: Omit<Producto, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, PRODUCTOS_COLLECTION), producto);
    return docRef.id;
  },

  async update(id: string, data: Partial<Producto>) {
    await updateDoc(doc(db, PRODUCTOS_COLLECTION, id), data);
  },

  async remove(id: string) {
    await deleteDoc(doc(db, PRODUCTOS_COLLECTION, id));
  },
};
