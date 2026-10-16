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
- `wishes.html` is the public guestbook, written from Aya's point of view in casual Indonesian with English headings. It has a more compact phone layout, optional photo uploads, photo zoom, and displays Aya's replies. The guestbook list appears after a visitor sends a wish (or returns in the same browser after having sent one before).
- `firebase-core.js` and `firebase-integration.js` share the Firestore config and APIs. Photos are resized, JPEG-compressed, Base64-encoded in the browser, and written directly to Firestore documents. Firebase Storage is not used.

## 4. Photo sizes

The picker rejects non-image files and originals over 12 MB, then downsizes an image to at most 1000 px on its longest side and compresses it until the Base64 data URL is around 240,000 characters or less. This keeps photo data comfortably below Firestore's 1 MiB document limit. These are small keepsake photos, not full-resolution backups.

## 5. Security caveat — read before sharing

The password gate in `index.html` is a **front-end gate**, not strong authentication: the static page's JavaScript can be inspected, and the answer is not secret from a technically savvy visitor. The Firestore rules allow public reads so that the static guestbook can query messages, meaning the “post before you peek” rule is enforced by the UI, not by Firestore itself.

The reply/hide controls are also client-side controls. The included rules validate that an update only touches a wish's reply/visibility metadata, but they cannot prove that the person making that update is Aya. With the current static-only setup, another visitor who knows how to call Firestore directly could edit those metadata fields. For production-grade admin access, add Firebase Authentication with a dedicated Aya admin account (or a trusted backend/Cloud Function) and change the update rule to require that authenticated admin identity. Do not treat `dishwasher` as a secure database credential.

The guestbook currently has no rate-limiting or spam filter. Before posting the public link widely, consider enabling Firebase App Check and a trusted moderation path.

## 6. Cat image

The original archive did not include Dishwasher's real photo. `media/dishwasher-cat.svg` is a temporary illustrated placeholder. Replace it with the real image when available and update the `.cat-gate-art` `src` in `index.html`.
