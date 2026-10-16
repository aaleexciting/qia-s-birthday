# Aya’s Birthday Rewind ♡

A romantic, playful birthday scrapbook made for Aya. It is designed mobile-first in a centered portrait frame on desktop, with a clickable memory map, looping background music, original synthesized interface sound effects, a live relationship clock, a WhatsApp chat recap, photo previews, a private birthday letter, and a public guestbook chapter.

## Preview

1. Extract the ZIP.
2. For reliable local audio and module-free asset paths, run the folder with a static local server (for example, VS Code Live Server) or publish it to a static host. You can also open `index.html` directly for a quick preview, though browser audio permissions may vary.
3. Add your soundtrack as `media/background-music.mp3`. It starts automatically after the first tap or key interaction and loops; the music-note button pauses or resumes it. Audio playback needs a user interaction in modern browsers.
4. Interface sound effects are synthesized by the Web Audio API. They include soft tap, navigation, slide-swish, reveal, heart-chime, and celebration cues, and require no extra sound assets. The separate effects toggle has been removed from the header to make room for the guestbook shortcut; effects remain enabled.
5. Click an empty photo frame or slideshow placeholder to preview a local image or video in the current tab. This preview is temporary; to publish an image, copy it into `media/` and set its relative path in `story.js`.

## Important media slots

Put files in the `media/` folder and use their relative paths in `story.js`. The current placeholders are deliberate, because your personal photos and videos weren't included with the project.

| Moment ID | What to add | Suggested filename / setup |
|---|---|---|
| `beginning` | Jiji or the two black cats | `media/two-black-cats.jpg` |
| `kiki` | Kiki balancing in the trash can | `media/kiki-trashcan.jpg` |
| `calls` | Roblox or late-night-call memory | `media/first-calls.jpg` |
| `mako` | One first-date photo, plus a background photo of the Mako venue | Slot: `media/mako-first-date.jpg`; background: `media/mako-place.jpg` |
| `mako-details` | Four photos from the first Mako date | Four images, mixed portrait and landscape ratios |
| `ramen-date` | One selfie and one bowl-of-food photo | `media/enoki-selfie.jpg`, `media/enoki-bowl.jpg` |
| `little-things-gallery` | Six images, no title or captions on the slide | Mix portrait and landscape photos; the grid has six clickable frames |
| `spotify-blend` | Seven embedded Spotify tracks from the playlist you shared | No local media needed. The players require an internet connection. |
| `train` | A general train-ride, window, station or earphone photo. Avoid a photo of her asleep. | `media/train-ride.jpg` |
| `her-portrait` | Dedicated portrait of her | `media/may1-portrait.jpg` |
| `skating-video` | **Vertical 9:16** skating video | `media/ice-skating.mp4` |
| `skating-gallery` | Four skating photos | Mixed portrait and landscape |
| `may1-question` | Rooftop POV background, plus two portrait photos | Background: `media/rooftop-pov.jpg`; slots: `media/rooftop-night.jpg`, `media/mini-baobao.jpg` |
| `may1-photobooth` | Landscape GIF and printed photobooth strip | GIF: `media/may1-photobooth.gif`; strip: `media/photobooth-strip.jpg` or `.png` |
| `may9` | Her performance at Untirta | `media/untirta-performance.jpg` |
| `june19` | Four photos of home, cats and the beach | Four mixed-ratio photos |
| `july9` | Original March 29 photo first, July 9 recreation second | Two portraits; keeps their order for the then-and-now comparison |
| `aug18` | Sidang photo and note/chocolate photo | Two landscape or square photos |
| `memory-flashback` | Instagram-Story-style flashback slideshow after the sidang chapter | Add photo objects to `media` in `story.js`; each object has its own `src`, `date`, and `caption` |
| `relationship-clock` | Live relationship duration since May 1, 2026 | No asset needed. Change `startDate` in `story.js` if the start date needs correction; the visible clock updates every second. |
| `chat-overview`, `chat-first-hello`, `chat-balance`, `chat-hourly`, `chat-monthly`, `chat-emojis`, `chat-words`, `chat-rhythm` | WhatsApp chat story | Opens with the first messages, compares message and word totals, then shows the hourly pattern, month-by-month activity, favorite emojis, favorite words, and a sweet closing thought. |
| `birthday-crew` | Mini Baobao, Bocchi figure, shark slippers, and Manis | Add one photo to each frame and edit its `src` in the slide's `media` array. The frame name comes from `frameName`. |
| `birthday-cats` | Four named cat portraits: Lulu, Kaliko, Dishwasher, and Si Item | Add a photo to each named frame and edit its `src` in `story.js`. The layout is a balanced two-by-two grid. |
| `oct17` | Recent favorite photo of you two | `media/recent-us.jpg` |

### Background music

Place the audio file at `media/background-music.mp3`. Music starts from the first interaction anywhere in the story, loops continuously, and can be paused or resumed from the music-note button. Change `MUSIC_SRC` in `app.js` to use another path. The music file is intentionally not included, so add a track that you have permission to use.

### Live relationship clock

The `relationship-clock` chapter counts from `startDate` in `story.js` (currently May 1, 2026 at local midnight) and updates months, days, hours, minutes, and seconds in real time. Change that field to adjust the date. The clock uses the visitor's local browser time.

### WhatsApp chat recap

The chat recap opens with the first messages from March 25, 2026 and ends the data window on October 16, 2026: 205 chat days and 106,721 messages. Qiana sent 55,018 messages and used 201,406 words; Ardan sent 51,703 messages and used 203,450 words. The emoji and word counts are copied from the supplied charts. Hourly and monthly bar heights are reconstructed from the chart visuals because exact per-hour and per-month labels were not provided; the slides show relative patterns instead of pretending those individual counts are exact.

### Birthday photo frames

The `birthday-crew` and `birthday-cats` chapters come before the final birthday letter. The public birthday guestbook follows that private letter as the final chapter. Each decorative frame is an editable `media` item: update `src` with its file path, and change `frameName`, `label`, or `icon` if needed. The photo picker can preview each image temporarily in the browser, but the final image path must be written into `story.js` for deployment.

### Flashback slideshow

The `memory-flashback` moment sits immediately after `I did it. And you were there.` It starts with six editable photo slots. Add as many objects to that `media` array as needed; the indicators and photo counter adapt to the array length. Each photo object supports these fields:

```js
{ type: "image", src: "media/flashback-07.jpg", ratio: "4 / 5", fit: "cover", label: "Flashback photo seven", icon: "♡", date: "AUGUST 18", caption: "The little moment I want to keep" }
```

Change `src`, `date`, and `caption` for each photo. Tap the left or right edge of the photo to move between pictures, use the segmented indicators to jump directly, or use the keyboard arrow keys. At the ends, navigation naturally returns to the neighboring story chapter. You can also click an empty slideshow slot to preview a local picture before adding its path in `story.js`.

### Background images

Two slides use a photo behind the copy rather than inside a frame:

- **Mako:** `backgroundSrc: "media/mako-place.jpg"`. The picture is blended with a soft golden wash so the text and main first-date picture stay readable.
- **Rooftop proposal:** `backgroundSrc: "media/rooftop-pov.jpg"`. The image sits below a dusk-toned overlay and gradient text panel. Add a photo taken from your view of the rooftop for the intended effect.

Click the small background-picture control near the lower-right of either scene to preview a local background image without editing code. That preview only lasts in the current browser tab. To publish it, add the file under `media/` and update `backgroundSrc` in `story.js`. Background images are separate from the foreground gallery slots.

## Aspect ratios and file types

- Portrait photo: `3 / 4` or `4 / 5`
- Spotify Blend chapter: embedded Spotify tracks use the supplied track IDs; playback requires internet access and may require Spotify consent depending on the browser
- Landscape photo: `4 / 3` or `16 / 9`
- Ice-skating video: `9 / 16` (vertical)
- Animated GIF: set `type: "image"` or leave the current image type; `.gif` renders as an image and keeps animating
- Printed photo strip: `779 / 2400`, `fit: "contain"` so the entire strip remains visible

The photobooth slide keeps its landscape GIF centered next to the tall print, like a moving digital memory beside a physical keepsake. The image-only everyday gallery has no heading or caption text; empty slots show only a small plus so they stay discoverable without cluttering the grid.

## Customizing copy and titles

All story moments live in `story.js`. The final private greeting rotates through Qiana, Aya, Aiigou, my love, baby, honey, sweetheart, and my everything. It also changes when tapped. Story text, image paths, dates, captions, and button labels can be edited there. Keep every `id` unique because the memory map and navigation use each object in the array.

## Publish

Upload the entire folder to a static host such as GitHub Pages, Netlify, or Vercel. Include `index.html`, `styles.css`, `app.js`, `story.js`, and the `media/` folder. Paths are case-sensitive on many hosts. Always test the deployed link on a phone before sending it.

## Interactions

- Back/next buttons, touch swipe, keyboard navigation, progress segments, and a clickable story map
- Looping background soundtrack that starts on the first interaction, with a music-note pause/resume control
- Original Web Audio sound effects for taps, chapter transitions, photo navigation, reveals, collected hearts, and celebration; no extra sound files needed, with no separate toggle in the header
- A live month/day/hour/minute/second relationship clock starting May 1, 2026
- An eight-part WhatsApp recap with animated totals, the first chat, hourly and monthly charts, favorite emojis and words, and a closing note
- Two birthday photo galleries with balanced named frames for personal keepsakes and four named cats
- A dedicated Spotify Blend chapter with all seven embedded tracks and a “Next song” scroll control for phones
- Clickable image/video frames and temporary local file previews
- Quiet heart-collecting across chapters, tappable stickers, a Jiji easter egg, animated rotating birthday greeting, and final confetti
- Responsive portrait layout with distinct chapter-specific styles


## Birthday guestbook + Firestore setup

The public `wishes.html` page is a casual Indonesian-first birthday guestbook written from Aya’s point of view, with the burgundy/cream invitation style inspired by the supplied reference. It is compacted for phones and reveals the other messages after a visitor submits their own wish. The private rewind keeps its existing scrapbook look, uses the same cat-name gate, and adds a WISHES navbar shortcut. The guestbook chapter comes immediately after the private boyfriend letter and uses a polished wine-red/gold palette.

### Files added

- `wishes.html`, `wishes.css`, `wishes.js`: public message form, guestbook view, and page visuals.
- `firebase-core.js`: Firebase web config plus Firestore create/list/update helpers shared by both pages.
- `firebase-integration.js`: connects the existing, non-module rewind app to Firestore.
- `firestore.rules`: validation rules for new entries and reply/visibility metadata updates.
- `index-gate.js`: a cat-name gate for `index.html`.
- `media/dishwasher-cat.svg`: a temporary hand-drawn cat illustration because the supplied ZIP did not contain a real Dishwasher photo.
- The private guestbook slide has reply/hide/unhide controls and a copy-link button. Photo attachments open in an enlarged viewer in both the public page and the private rewind; Aya’s saved replies are shown on the public guestbook.

The portrait in the public page is a compressed WebP crop from the attached invitation, embedded as a Base64 data URI. Optional guest-uploaded photos are also resized, JPEG-compressed, Base64-encoded in the browser, and stored directly in each Firestore document—**Firebase Storage is not used**.

### Publish the guestbook

1. In Firebase Console, open project `qia-sbirthday`, then **Firestore Database**. Create the database if it does not exist.
2. In Firestore **Rules**, paste the contents of `firestore.rules` and publish them. The collection is named `birthdayWishes` and is created automatically by the first wish.
3. Host the whole folder on a static host (GitHub Pages, Netlify, Vercel, etc.). Do not open `wishes.html` as a `file://` page: Firebase modules require an HTTP(S) origin. Existing media paths are relative, so publish the entire folder.
4. Test a text-only wish, one wish with a photo, the locked `index.html`, the guestbook chapter, and a second browser/device to verify live updates.

### Photo compression and Firestore document size

The optional image picker rejects non-image files and originals larger than 12 MB, then resizes the image to at most 1000 px on its longest side and compresses it as JPEG until the Base64 data URL is about 240,000 characters or less. That keeps the photo comfortably below Firestore's 1 MiB per-document limit. Each photo is stored in that wish's `photoData` field; no storage bucket is used. This is intended for small keepsake photos, not full-resolution originals.

### Important access note

The guestbook intentionally hides other people's notes in the **interface** until the visitor has sent a wish (or has already sent one in that browser). Because the site is static and the guestbook has no sign-in/backend, the rules allow public reads; a technically savvy visitor could read the collection directly rather than going through the form. This is a presentation gate, not strong access control. If you need Firestore itself to enforce “must submit first,” enable Firebase Anonymous Authentication (or add a trusted backend) and change the rules to require a verified per-visitor identity before reads. Also consider enabling Firebase App Check and adding moderation/deletion tooling before sharing the link widely.

### Replies, hiding messages, and admin access

The final private guestbook chapter lets Aya save a reply to each wish and hide/unhide that wish from the public UI. Those replies appear on `wishes.html`, and photos can be expanded in both views. The chapter is behind the `dishwasher` front-end gate, but the password is not secure server-side authentication. The current static rules validate metadata changes without proving the editor is Aya; use Firebase Authentication with admin-only rules or a trusted backend before relying on it for genuine moderation security.

### Private rewind password

`index.html` asks for the cat's name; the answer is `dishwasher` (case-insensitive). The successful gate is remembered for the current browser tab session. This is a friendly front-end gate only—any password embedded in static JavaScript can be inspected, and the story files are not encrypted. It is appropriate for a personal birthday surprise, but not for confidential content.

### Personal assets

The uploaded ZIP had no photos in `media/`, even though `story.js` contains photo placeholders and refers to Dishwasher. The added cat illustration is only a stand-in. Replace `media/dishwasher-cat.svg` with a real photo if you have one, then change the `src` in the gate markup in `index.html` to that photo's path. Other empty rewind photo slots remain as they were.
