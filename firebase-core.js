// Shared Firestore service for the public birthday guestbook and private rewind.
// Firebase web config is public by design; protect data with Firestore rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  addDoc, collection, doc, getFirestore, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0b4EjiKR03BDsAnRDaqW6LFJfKxYOpIs",
  authDomain: "qia-sbirthday.firebaseapp.com",
  projectId: "qia-sbirthday",
  storageBucket: "qia-sbirthday.firebasestorage.app",
  messagingSenderId: "826839824926",
  appId: "1:826839824926:web:c94c3c2d0c5d44c76bcc0f",
  measurementId: "G-F7BX6CQVWM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const wishesCollection = collection(db, "birthdayWishes");

export function watchWishes(onWishes, onError) {
  const latestWishes = query(wishesCollection, orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(latestWishes, snapshot => {
    const entries = snapshot.docs.map(documentSnapshot => ({ id: documentSnapshot.id, ...documentSnapshot.data() }));
    onWishes(entries);
  }, error => {
    if (typeof onError === "function") onError(error);
  });
}

export async function createWish({ name, message, photoData = "", photoType = "" }) {
  const cleanName = String(name || "").trim().slice(0, 48);
  const cleanMessage = String(message || "").trim().slice(0, 900);
  if (!cleanName) throw new Error("Isi nama kamu dulu, ya.");
  if (!cleanMessage) throw new Error("Tulis ucapan dulu sebelum dikirim, ya.");
  if (photoData && (!/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(photoData) || photoData.length > 300000)) {
    throw new Error("Foto itu terlalu besar. Coba pilih gambar yang lebih kecil, ya.");
  }
  const saved = await addDoc(wishesCollection, {
    name: cleanName,
    message: cleanMessage,
    photoData: photoData || "",
    photoType: photoData ? String(photoType || "image/jpeg").slice(0, 30) : "",
    reply: "",
    replyUpdatedAt: null,
    hidden: false,
    createdAt: serverTimestamp()
  });
  return saved.id;
}

// Used by the password-gated rewind controls to moderate the guestbook.
// The UI gate is client-side; it is not a substitute for authenticated admin rules.
export async function updateWish(wishId, changes = {}) {
  const id = String(wishId || "").trim();
  if (!id || id.length > 150) throw new Error("That guestbook entry could not be identified.");
  const payload = {};
  if (Object.prototype.hasOwnProperty.call(changes, "reply")) {
    const reply = String(changes.reply || "").trim().slice(0, 900);
    payload.reply = reply;
    payload.replyUpdatedAt = reply ? serverTimestamp() : null;
  }
  if (Object.prototype.hasOwnProperty.call(changes, "hidden")) {
    if (typeof changes.hidden !== "boolean") throw new Error("Invalid guestbook visibility setting.");
    payload.hidden = changes.hidden;
  }
  if (!Object.keys(payload).length) return;
  payload.updatedAt = serverTimestamp();
  await updateDoc(doc(db, "birthdayWishes", id), payload);
}
