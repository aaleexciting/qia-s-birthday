# Set up Aya's birthday guestbook

## 1. Publish the Firestore rules

Open Firebase Console → project `qia-sbirthday` → **Firestore Database** → **Rules**. Paste the contents of `firestore.rules` and publish. The `birthdayWishes` collection is created automatically when the first wish is sent.

The rules validate message and photo sizes, permit creating wishes, and limit updates to reply/visibility metadata. See the security note below before using the admin controls publicly.

## 2. Host the project

Upload the entire `our-little-rewind` folder to a static host over HTTPS. Keep all files alongside `index.html` and preserve the `media/` directory. Do not open the pages with `file://`; browser module imports and Firestore need an HTTP(S) origin.

## 3. What changed

- `index.html` keeps the existing rewind design. The onboarding gate now uses the rewind's soft scrapbook palette and asks for Dishwasher's name; the answer is `dishwasher` (case-insensitive).
- A **WISHES** shortcut is in the navbar. The sparkle sound-effects button has been removed to free up space; the music toggle remains.
- Your personal birthday letter comes before the final public-guestbook chapter. The new chapter has a wine-red/gold treatment, shows live messages, provides **Copy wishes link**, lets Aya reply as Aya or hide/unhide a wish, and opens attached photos in a larger viewer.
- `wishes.html` is the public guestbook, written from Aya's point of view in casual Indonesian with English headings. The wish feed is visible immediately and does not require visitors to post first or have cookies/local storage. Mobile portrait framing and typography have been polished; guests can attach a photo and save/share any wish as a framed birthday PNG. The same page includes an owner panel using the existing `dishwasher` answer, with reply and hide/restore controls.
- `firebase-core.js` and `firebase-integration.js` share the Firestore config and APIs. Photos are resized, JPEG-compressed, Base64-encoded in the browser, and written directly to Firestore documents. Firebase Storage is not used.

## 4. Photo sizes

The picker rejects non-image files and originals over 12 MB, then downsizes an image to at most 1000 px on its longest side and compresses it until the Base64 data URL is around 240,000 characters or less. This keeps photo data comfortably below Firestore's 1 MiB document limit. These are small keepsake photos, not full-resolution backups.

## 5. Security caveat — read before sharing

The owner gate on `wishes.html` and the password gate in `index.html` are **front-end gates**, not strong authentication: static JavaScript can be inspected. Firestore reads are intentionally public because visitors can browse wishes without posting first. Current rules also allow reply/visibility metadata updates without proving that the editor is Aya.

The reply/hide controls are also client-side controls. The included rules validate that an update only touches a wish's reply/visibility metadata, but they cannot prove that the person making that update is Aya. With the current static-only setup, another visitor who knows how to call Firestore directly could edit those metadata fields. For production-grade admin access, add Firebase Authentication with a dedicated Aya admin account (or a trusted backend/Cloud Function) and change the update rule to require that authenticated admin identity. Do not treat `dishwasher` as a secure database credential.

The guestbook currently has no rate-limiting or spam filter. Before posting the public link widely, consider enabling Firebase App Check and a trusted moderation path.

## 6. Existing media files

The supplied ZIP did not contain a `media/` directory, even though the pages reference Aya’s portrait, Dishwasher’s image, and numerous rewind photos/videos within it. Keep the existing deployed `media/` directory when updating the code files; the new ZIP cannot restore media assets that were not included in the input archive.
