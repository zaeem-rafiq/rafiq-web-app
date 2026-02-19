import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addToWaitlist(email: string, source: string = "landing") {
  return addDoc(collection(db, "waitlist"), {
    email: email.toLowerCase().trim(),
    source,
    createdAt: serverTimestamp(),
  });
}

/** Save an email + question to the askRafiqEmails collection */
export async function saveAskRafiqEmail(email: string, question: string) {
  const normalizedEmail = email.toLowerCase().trim();
  // Save to askRafiqEmails for enforcement
  await addDoc(collection(db, "askRafiqEmails"), {
    email: normalizedEmail,
    question,
    createdAt: serverTimestamp(),
  });
  // Also add to waitlist for marketing
  await addToWaitlist(normalizedEmail, "ask-rafiq");
}

export { db };
