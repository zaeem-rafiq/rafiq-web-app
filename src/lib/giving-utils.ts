import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type GivingType = "zakat" | "khums" | "sadaqah" | "fitr" | "tatheer";

export interface GivingRecord {
  amount: number;
  type: GivingType;
  recipient: string;
  date: string; // ISO date string
  notes: string;
  createdAt: any;
}

export async function addGivingRecord(
  uid: string,
  record: Omit<GivingRecord, "createdAt">
) {
  return addDoc(collection(db, `users/${uid}/givingRecords`), {
    ...record,
    userId: uid,
    createdAt: serverTimestamp(),
  });
}

export async function getGivingRecords(
  uid: string,
  maxRecords: number = 50
): Promise<(GivingRecord & { id: string })[]> {
  const q = query(
    collection(db, `users/${uid}/givingRecords`),
    orderBy("createdAt", "desc"),
    firestoreLimit(maxRecords)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GivingRecord & { id: string }));
}

// Ramadan 2026: Feb 18 – Mar 19 (30 days)
const RAMADAN_START = new Date("2026-02-18");
const RAMADAN_END = new Date("2026-03-20"); // exclusive (day after last day)

export function getRamadanInfo(): {
  isRamadan: boolean;
  dayOfRamadan: number;
  totalDays: number;
  isLast10: boolean;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today < RAMADAN_START || today >= RAMADAN_END) {
    return { isRamadan: false, dayOfRamadan: 0, totalDays: 30, isLast10: false };
  }

  const dayOfRamadan =
    Math.floor((today.getTime() - RAMADAN_START.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    isRamadan: true,
    dayOfRamadan,
    totalDays: 30,
    isLast10: dayOfRamadan >= 21,
  };
}
