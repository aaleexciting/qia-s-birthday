## Latest small revision

- Removed the interactive writing-prompt chips and their JavaScript/CSS. The existing copywriting and other interactions remain unchanged.

# Birthday guestbook update — deployment notes

## What changed in this pass

- `wishes.html` — moved the wish form above the public wall, replaced the long explanatory paragraph with a short birthday announcement, and kept the existing public announcement and all other copy unchanged, removed the interactive writing-prompt chips, and retained the random-wish button.
- `wishes.css` — rebuilt the form as a standout blush-and-berry card, improved mobile spacing, and added restrained heart/sparkle interactions with reduced-motion support.
- `wishes.js` — kept the surprise-me wish picker and the small heart celebration after a wish is successfully submitted; removed all prompt-chip markup and behavior. Existing live wishes, photo attachments, PNG birthday-card export, and owner reply/hide/restore controls remain connected to the same Firebase code.

## Deploy carefully

The supplied ZIP did not include the site's `media/` directory. Keep the existing live `/media/` folder and its images/videos when updating the deployed files, especially `media/aya.JPG` and the rewind assets. Do not replace the live site's entire directory in a way that deletes existing media.

## Owner access and moderation

The owner access button on `wishes.html` uses the existing case-insensitive cat-name answer: `dishwasher`. This is a client-side convenience gate, not secure authentication. The current Firestore rules allow public reads and metadata updates, so use Firebase Authentication with an admin-only rule (or a trusted backend) before treating the owner panel as secure moderation. Permanent deletion remains disabled; Aya can reply to a wish and hide or restore it from the public feed.

## Birthday-card sharing

Each public wish has a **Save birthday card** action that creates a framed PNG containing the wish. Browsers with file sharing open the system share sheet; otherwise the image is downloaded. On iPhone, choose **Save Image** in the share sheet (or from the opened/downloaded image) to add it to Photos. Websites cannot silently write an image straight into the camera roll.


## Copywriting restoration (V4)

The public page's original Indonesian/English copy has been restored for the hero, announcement, form labels, photo helper, submit button, message-wall heading, and footer. Interactive writing prompt chips and their JavaScript/CSS were removed. The public wishes feed still loads without requiring a visitor to submit first, even though the preserved original instruction text mentions submitting before viewing others' messages.
