// Browser bridge for the existing non-module rewind app.
import { createWish, updateWish, watchWishes } from "./firebase-core.js";
window.BirthdayGuestbook = Object.freeze({ createWish, updateWish, watchWishes });
document.dispatchEvent(new Event("birthdayguestbook-ready"));
