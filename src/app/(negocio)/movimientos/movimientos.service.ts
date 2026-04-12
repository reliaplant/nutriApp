import { db } from "@/app/shared/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Movimiento } from "./movimiento.interface";

const MOVIMIENTOS_COLLECTION = "movimientos";

export const movimientosService = {
  async getAll(): Promise<Movimiento[]> {
    const snapshot = await getDocs(collection(db, MOVIMIENTOS_COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Movimiento));
  },

  async add(movimiento: Omit<Movimiento, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, MOVIMIENTOS_COLLECTION), movimiento);
    return docRef.id;
  },

  async update(id: string, data: Partial<Movimiento>) {
    await updateDoc(doc(db, MOVIMIENTOS_COLLECTION, id), data);
  },

  async remove(id: string) {
    await deleteDoc(doc(db, MOVIMIENTOS_COLLECTION, id));
  },
};
