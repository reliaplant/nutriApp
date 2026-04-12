import { db } from "@/app/shared/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Gasto } from "./gasto.interface";

const GASTOS_COLLECTION = "gastos";

export const gastosService = {
  async getAll(): Promise<Gasto[]> {
    const snapshot = await getDocs(collection(db, GASTOS_COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Gasto));
  },

  async add(gasto: Omit<Gasto, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, GASTOS_COLLECTION), gasto);
    return docRef.id;
  },

  async update(id: string, data: Partial<Gasto>) {
    await updateDoc(doc(db, GASTOS_COLLECTION, id), data);
  },

  async remove(id: string) {
    await deleteDoc(doc(db, GASTOS_COLLECTION, id));
  },
};
