import { createWish, watchWishes } from "./firebase-core.js";

const form = document.getElementById("wishForm");
const nameInput = document.getElementById("wishName");
const messageInput = document.getElementById("wishMessage");
const messageCount = document.getElementById("messageCount");
const photoInput = document.getElementById("wishPhoto");
const previewPanel = document.getElementById("photoPreview");
const previewImage = document.getElementById("photoPreviewImage");
const previewName = document.getElementById("photoFileName");
const previewHint = document.getElementById("photoSizeHint");
const removePhotoButton = document.getElementById("removePhoto");
const submitButton = document.getElementById("submitWish");
const formStatus = document.getElementById("formStatus");
const guestbookWall = document.getElementById("guestbookWall");
const wishesList = document.getElementById("wishesList");
const wallCount = document.getElementById("wallCount");
const STORAGE_KEY = "qiaBirthdayGuestbookPosted";
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_DATA_URL_CHARS = 240000;
let selectedPhoto = null;
let previewObjectUrl = "";
let unsubscribeWishes = null;
let lightbox = null;

function setStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.classList.toggle("is-error", type === "error");
  formStatus.classList.toggle("is-success", type === "success");
}

function safePhotoData(value) {
  return typeof value === "string" && value.length <= 300000 && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : "";
}

function formatDate(timestamp) {
  if (!timestamp) return "baru saja";
  try {
    const date = timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return "baru saja";
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  } catch (_) { return "baru saja"; }
}

function makeLightbox() {
  if (lightbox) return lightbox;
  lightbox = document.createElement("div");
  lightbox.className = "photo-lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Photo preview");
  const close = document.createElement("button");
  close.className = "photo-lightbox-close";
  close.type = "button";
  close.setAttribute("aria-label", "Tutup foto");
  close.textContent = "×";
  const image = document.createElement("img");
  image.alt = "Foto dari birthday guestbook";
  lightbox.append(close, image);
  document.body.append(lightbox);
  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox(); });
  return lightbox;
}

function openLightbox(src, alt = "Foto dari birthday guestbook") {
  if (!src) return;
  const layer = makeLightbox();
  const image = layer.querySelector("img");
  image.src = src;
  image.alt = alt;
  layer.hidden = false;
  document.body.classList.add("lightbox-open");
  layer.querySelector("button").focus({ preventScroll: true });
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  lightbox.querySelector("img").removeAttribute("src");
  document.body.classList.remove("lightbox-open");
}

function renderWishes(allWishes) {
  const wishes = allWishes.filter(wish => wish.hidden !== true);
  wallCount.textContent = String(wishes.length);
  wishesList.replaceChildren();
  if (!wishes.length) {
    const empty = document.createElement("div"); empty.className = "wall-empty";
    const icon = document.createElement("span"); icon.textContent = "✦";
    const message = document.createElement("p"); message.textContent = "Belum ada pesan lain nih. Mungkin kamu yang pertama!";
    empty.append(icon, message); wishesList.append(empty); return;
  }
  for (const wish of wishes) {
    const card = document.createElement("article"); card.className = "wish-card";
    const header = document.createElement("div"); header.className = "wish-card-head";
    const mark = document.createElement("span"); mark.className = "wish-card-heart"; mark.textContent = "✦"; mark.setAttribute("aria-hidden", "true");
    const person = document.createElement("div"); person.className = "wish-card-person";
    const name = document.createElement("strong"); name.textContent = String(wish.name || "Teman Aya").slice(0, 48);
    const time = document.createElement("time"); time.textContent = formatDate(wish.createdAt);
    person.append(name, time); header.append(mark, person);
    const body = document.createElement("p"); body.className = "wish-card-message"; body.textContent = String(wish.message || "").slice(0, 900);
    card.append(header, body);
    const photoData = safePhotoData(wish.photoData);
    if (photoData) {
      const photoButton = document.createElement("button"); photoButton.type = "button"; photoButton.className = "wish-photo-open";
      photoButton.setAttribute("aria-label", `Perbesar foto dari ${String(wish.name || "teman Aya").slice(0, 48)}`);
      const image = document.createElement("img"); image.className = "wish-card-photo"; image.src = photoData; image.alt = `Foto yang dibagikan oleh ${String(wish.name || "teman Aya").slice(0, 48)}`; image.loading = "lazy";
      photoButton.append(image); card.append(photoButton);
    }
    const reply = String(wish.reply || "").trim();
    if (reply) {
      const replyBox = document.createElement("div"); replyBox.className = "wish-reply";
      const label = document.createElement("strong"); label.textContent = "Aya replied ✦";
      const replyText = document.createElement("p"); replyText.textContent = reply.slice(0, 900);
      replyBox.append(label, replyText); card.append(replyBox);
    }
    wishesList.append(card);
  }
}

function openGuestbook() {
  guestbookWall.hidden = false;
  guestbookWall.setAttribute("aria-hidden", "false");
  if (unsubscribeWishes) return;
  wishesList.innerHTML = '<div class="wall-empty"><span>✦</span><p>Lagi ambil pesan-pesannya…</p></div>';
  unsubscribeWishes = watchWishes(renderWishes, error => {
    console.error("Could not load birthday wishes", error);
    wishesList.innerHTML = '<p class="wall-error">Guestbook-nya belum bisa dibuka. Coba refresh sebentar lagi, ya.</p>';
  });
}

function clearPhoto() {
  selectedPhoto = null;
  photoInput.value = "";
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
  previewImage.removeAttribute("src");
  previewPanel.hidden = true;
  previewName.textContent = "Foto pilihanmu";
  previewHint.textContent = "Foto akan otomatis dikecilkan sebelum disimpan.";
}

function loadImageSource(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Foto ini nggak bisa dibuka. Coba pilih foto lain, ya.")); };
    image.src = objectUrl;
  });
}

async function compressImageToBase64(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Pilih file foto, ya.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Ukuran foto maksimal 12 MB. Coba pilih file yang lebih kecil.");
  let source;
  let originalWidth;
  let originalHeight;
  if ("createImageBitmap" in window) {
    try { source = await createImageBitmap(file); originalWidth = source.width; originalHeight = source.height; }
    catch (_) { source = await loadImageSource(file); originalWidth = source.naturalWidth; originalHeight = source.naturalHeight; }
  } else { source = await loadImageSource(file); originalWidth = source.naturalWidth; originalHeight = source.naturalHeight; }
  if (!originalWidth || !originalHeight) throw new Error("Foto ini kelihatannya kosong. Coba foto lain, ya.");
  let scale = Math.min(1, 1000 / Math.max(originalWidth, originalHeight));
  let quality = 0.82;
  let dataUrl = "";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Browser kamu belum bisa memproses foto ini.");
  for (let attempt = 0; attempt < 10; attempt++) {
    canvas.width = Math.max(1, Math.round(originalWidth * scale));
    canvas.height = Math.max(1, Math.round(originalHeight * scale));
    context.fillStyle = "#fffaf2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_CHARS) break;
    if (attempt % 2 === 1) quality = Math.max(0.52, quality - 0.08);
    scale *= 0.84;
  }
  if (source && typeof source.close === "function") source.close();
  if (!dataUrl || dataUrl.length > MAX_DATA_URL_CHARS) throw new Error("Foto ini susah dikecilkan. Coba pilih foto yang lebih simpel atau kecil.");
  return dataUrl;
}

messageInput.addEventListener("input", () => { messageCount.textContent = `${messageInput.value.length} / 900`; });
photoInput.addEventListener("change", () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { clearPhoto(); setStatus("Pilih file gambar, ya. Video belum bisa masuk guestbook hehe.", "error"); return; }
  if (file.size > MAX_FILE_BYTES) { clearPhoto(); setStatus("Ukuran foto maksimal 12 MB. Coba pilih foto yang lebih kecil.", "error"); return; }
  selectedPhoto = file;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  previewImage.src = previewObjectUrl;
  previewName.textContent = file.name;
  previewHint.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · otomatis dikompres`;
  previewPanel.hidden = false;
  setStatus("");
});
removePhotoButton.addEventListener("click", clearPhoto);
wishesList.addEventListener("click", event => {
  const button = event.target.closest(".wish-photo-open");
  if (!button) return;
  const image = button.querySelector("img");
  if (image) openLightbox(image.src, image.alt);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = selectedPhoto ? "Lagi kompres foto…" : "Lagi kirim pesan…";
  setStatus("Sebentar ya, pesanmu lagi disiapkan.");
  try {
    let photoData = "";
    if (selectedPhoto) {
      photoData = await compressImageToBase64(selectedPhoto);
      previewHint.textContent = `Siap disimpan · ${(photoData.length / 1024).toFixed(0)} KB`;
    }
    submitButton.querySelector("span").textContent = "Mengirim…";
    const documentId = await createWish({ name: nameInput.value, message: messageInput.value, photoData, photoType: photoData ? "image/jpeg" : "" });
    localStorage.setItem(STORAGE_KEY, documentId);
    form.reset(); messageCount.textContent = "0 / 900"; clearPhoto();
    setStatus("Makasih udah mampir! Pesanmu masuk. Sekarang boleh intip pesan yang lain juga ✦", "success");
    openGuestbook();
    guestbookWall.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  } catch (error) {
    console.error("Could not save the birthday wish", error);
    setStatus(error && error.message && !/permission|Missing or insufficient permissions/i.test(error.message)
      ? error.message
      : "Pesanmu belum berhasil dikirim. Coba lagi sebentar, ya. Kalau tetap gagal, Firestore rules mungkin belum dipublish.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Kirim Pesan";
  }
});

if (localStorage.getItem(STORAGE_KEY)) {
  openGuestbook();
  setStatus("Kamu sudah pernah kirim pesan, jadi guestbook-nya kebuka lagi. Silakan intip pesan yang lain ✦", "success");
}
