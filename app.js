(() => {
  "use strict";

  const story = Array.isArray(window.REWIND_STORY) ? window.REWIND_STORY : [];
  const stage = document.getElementById("stage");
  const progressTrack = document.getElementById("progressTrack");
  const momentCounter = document.getElementById("momentCounter");
  const momentDate = document.getElementById("momentDate");
  const backButton = document.getElementById("backButton");
  const nextButton = document.getElementById("nextButton");
  const nextLabel = document.getElementById("nextLabel");
  const brandButton = document.getElementById("brandButton");
  const mapButton = document.getElementById("mapButton");
  const soundButton = document.getElementById("soundButton");
  const mapOverlay = document.getElementById("storyMap");
  const mapClose = document.getElementById("mapClose");
  const mapList = document.getElementById("mapList");
  const mediaViewer = document.getElementById("mediaViewer");
  const viewerClose = document.getElementById("viewerClose");
  const viewerContent = document.getElementById("viewerContent");
  const toast = document.getElementById("toast");
  const mediaPicker = document.getElementById("mediaPicker");
  const backgroundMusic = document.getElementById("backgroundMusic");
  const heartScore = document.getElementById("heartScore");
  const heartCount = document.getElementById("heartCount");
  const MUSIC_SRC = "media/background-music.mp3";
  const RELATIONSHIP_START = new Date(2026, 4, 1, 0, 0, 0);

  let currentIndex = 0;
  let guestbookUnsubscribe = null;
  let toastTimer = null;
  let touchStart = null;
  let pendingSlot = null;
  let pendingBackgroundId = null;
  const localPreviewUrls = [];
  const soundEnabled = true;
  let audioContext = null;
  let noiseBuffer = null;
  let musicStarted = false;
  let musicAttemptInFlight = false;
  let musicUnavailable = false;
  let musicGestureBound = true;
  let heartsCollected = 0;
  let heartScoreTimer = null;
  let birthdayCycleTimer = null;
  let birthdayAnimationTimer = null;
  let birthdayVariants = [];
  let birthdayVariantIndex = 0;
  const visitedMoments = new Set();
  const bonusHeartMoments = new Set();
  const slideshowIndices = new Map();

  const pad = value => String(value).padStart(2, "0");
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const currentMoment = () => story[currentIndex] || {};
  const storyStickers = {
    "lore": "☕", "beginning": "🐈‍⬛", "kiki": "🐈", "calls": "🎮", "mako": "📷",
    "mako-details": "🎀", "ramen-date": "🍜", "little-things": "♡", "train": "🚆",
    "spotify-blend": "🎧", "her-portrait": "🎀", "skating-video": "⛸️", "skating-gallery": "❄️",
    "may1-question": "🌙", "may1-photobooth": "🎞️", "may9": "🎤", "june19": "🌊",
    "july9": "🪞", "aug18": "🎓", "oct17": "🎂"
  };
  const displayTitle = moment => moment.layout === "full-gallery" ? "The everyday gallery" : moment.id === "birthday-letter" ? "Your birthday, every way I say it." : String(moment.title || "A little memory").replace(/\n/g, " ");

  // These phrases add typographic emphasis only. The original sentence text remains unchanged.
  const titleEmphasis = {
    cover: [["sayang.", "script"]],
    lore: [["became ours.", "shimmer"]],
    beginning: [["black cats", "spotlight"]],
    kiki: [["trash-can talent", "wink"]],
    calls: [["one more round", "spotlight"]],
    mako: [["first place", "shimmer"]],
    "mako-details": [["pretty brown", "script"]],
    "ramen-date": [["said yes", "spotlight"]],
    "little-things": [["became us", "script"]],
    "spotify-blend": [["one pair of earphones", "underline"]],
    train: [["before the rink.", "script"]],
    "her-portrait": [["look at you.", "shimmer"]],
    "skating-video": [["first rink adventure", "spotlight"]],
    "skating-gallery": [["cutest day.", "shimmer"]],
    "may1-question": [["said yes.", "spotlight"]],
    "may1-photobooth": [["huge memory.", "shimmer"]],
    may9: [["favorite person", "script"]],
    june19: [["felt unreal.", "shimmer"]],
    july9: [["take two.", "spotlight"]],
    aug18: [["you were there.", "shimmer"]],
    "memory-flashback": [["all ours.", "script"]],
    oct17: [["here we are today.", "script"]],
    "birthday-letter": [["every way I say it.", "script"]],
    "relationship-clock": [["a little more us.", "script"]],
    "chat-overview": [["peek at our WhatsApp chat.", "shimmer"]],
    "chat-first-hello": [["little hiiii.", "script"]],
    "chat-balance": [["a little more; I wrote a little more.", "script"]],
    "chat-hourly": [["night-owl energy.", "shimmer"]],
    "chat-monthly": [["extra chatty.", "script"]],
    "chat-emojis": [["big feelings.", "shimmer"]],
    "chat-words": [["own language.", "script"]],
    "chat-rhythm": [["favorite person to talk to.", "shimmer"]],
    "birthday-crew": [["whole little crew.", "script"]],
    "birthday-cats": [["celebrating, too.", "shimmer"]]
  };

  const copyEmphasis = {
    cover: [["Happy Birthday, love.", "spotlight"], ["smiling too much today.", "wink"]],
    lore: [["part of our lore.", "underline"], ["the smallest things", "shimmer"], ["meaning so much.", "script"], ["let's rewind", "spotlight"]],
    beginning: [["Two black cats", "spotlight"], ["little beginning", "underline"], ["Look at us now.", "shimmer"]],
    kiki: [["more pictures of you.", "script"], ["this absolute goof", "wink"], ["whole album", "underline"]],
    calls: [["hours-long calls", "spotlight"], ["so excited", "italic"], ["make us that happy.", "shimmer"], ["promise me", "wink"]],
    mako: [["the first place", "spotlight"], ["those little details.", "script"]],
    "mako-details": [["pretty brown", "shimmer"], ["a hundred little details", "underline"], ["so much more of you", "script"]],
    "ramen-date": [["enoki rice", "wink"], ["very first time holding hands", "spotlight"], ["how lucky I got", "shimmer"]],
    "little-things": [["tiny pieces of life", "underline"], ["ordinary things turn into our things", "spotlight"], ["one of my favorite things.", "script"]],
    "spotify-blend": [["our music taste", "spotlight"], ["one pair of wired earphones", "underline"], ["Just us, a little music", "shimmer"]],
    train: [["fell asleep on my shoulder", "spotlight"], ["sitting extra still", "italic"], ["quiet moments with you", "script"]],
    "her-portrait": [["ridiculously pretty", "spotlight"], ["come with a warning.", "wink"]],
    "skating-video": [["tried it together", "spotlight"], ["every second", "underline"], ["little time capsule", "script"]],
    "skating-gallery": [["a hundred more memories", "spotlight"], ["less fear of falling", "wink"]],
    "may1-question": [["my heart was racing.", "spotlight"], ["so nervous.", "italic"], ["you said yes.", "shimmer"], ["we became us.", "script"]],
    "may1-photobooth": [["my favorite thing on my desk", "spotlight"], ["you became my girl.", "script"]],
    may9: [["performing at Untirta!", "spotlight"], ["my eyes were completely glued to you", "shimmer"], ["right at the front", "underline"], ["Percik Kecil", "script"]],
    june19: [["two whole nights", "spotlight"], ["met my mom and my cats", "underline"], ["unforgettable beach trip", "shimmer"]],
    july9: [["exact same spot", "underline"], ["exact same outfits!", "spotlight"], ["just as gorgeous", "shimmer"], ["my girl", "script"]],
    aug18: [["Finally done with my sidang skripsi!", "spotlight"], ["sticking by my side", "underline"], ["note and chocolate", "shimmer"], ["share this part of my life", "script"]],
    oct17: [["world was blessed with you", "spotlight"], ["sweetest, kindest, most gorgeous girl", "shimmer"], ["favorite story to tell", "script"], ["chapters we haven't written yet", "underline"]],
    "birthday-letter": [["my warmth, my safe place, my favorite notification", "spotlight"], ["ordinary days softer, funnier", "shimmer"], ["girl I feel lucky to love", "script"], ["today, tomorrow", "underline"], ["every rewind and every new memory", "spotlight"]]
  };


  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = audioContext || new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playTone(ctx, frequency, delay, duration, volume, wave = "sine", endFrequency = frequency) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(Math.max(25, frequency), start);
    if (endFrequency !== frequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.015, duration * .22));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .015);
  }

  function playSoftWhoosh(ctx, volume = .016, duration = .13) {
    try {
      if (!noiseBuffer) {
        const bufferSize = Math.ceil(ctx.sampleRate * .22);
        noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channel = noiseBuffer.getChannelData(0);
        for (let index = 0; index < bufferSize; index += 1) channel[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize * .35);
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const start = ctx.currentTime;
      source.buffer = noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, start);
      filter.frequency.exponentialRampToValueAtTime(360, start + duration);
      filter.Q.value = .55;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      source.start(start); source.stop(start + duration + .02);
    } catch (_) { /* Noise is optional; melodic cues still play. */ }
  }

  // Tiny original synth-made sound effects; no external audio files or network requests needed.
  function playSound(kind = "tap") {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      switch (kind) {
        case "next":
          playTone(ctx, 590, 0, .105, .026, "triangle", 720);
          playTone(ctx, 790, .065, .135, .022, "sine", 960);
          playSoftWhoosh(ctx, .008, .1);
          break;
        case "back":
          playTone(ctx, 820, 0, .095, .018, "sine", 640);
          playTone(ctx, 620, .055, .12, .018, "triangle", 520);
          break;
        case "open":
        case "reveal":
          [523, 659, 784, 1047].forEach((frequency, index) => playTone(ctx, frequency, index * .045, .18, .018, "sine"));
          if (kind === "reveal") playSoftWhoosh(ctx, .012, .19);
          break;
        case "slide":
          playSoftWhoosh(ctx, .02, .16);
          playTone(ctx, 460, .01, .1, .012, "triangle", 710);
          break;
        case "heart":
          playTone(ctx, 784, 0, .12, .024, "sine");
          playTone(ctx, 988, .06, .16, .022, "sine");
          playTone(ctx, 1318, .12, .2, .016, "sine");
          break;
        case "complete":
          [523, 659, 784, 988, 1175].forEach((frequency, index) => playTone(ctx, frequency, index * .07, .22, .021, "sine"));
          playSoftWhoosh(ctx, .013, .24);
          break;
        case "tap":
        default:
          playTone(ctx, 630, 0, .06, .018, "triangle", 410);
          break;
      }
    } catch (_) { /* Audio is a progressive enhancement; the story still works silently. */ }
  }


  function renderProgress() {
    progressTrack.innerHTML = story.map((moment, index) => `
      <button type="button" class="progress-segment ${index < currentIndex ? "is-done" : ""} ${index === currentIndex ? "is-current" : ""}"
        data-go="${index}" aria-label="Go to moment ${index + 1}: ${escapeHTML(displayTitle(moment))}"
        aria-current="${index === currentIndex ? "step" : "false"}" title="${escapeHTML(moment.chapter || moment.title)}">
        <span></span>
      </button>`).join("");
  }

  function renderMap() {
    mapList.innerHTML = story.map((moment, index) => `
      <button class="map-item ${index === currentIndex ? "is-current" : ""}" type="button" data-go="${index}">
        <span class="map-item-number">${pad(index + 1)}</span>
        <span class="map-item-copy"><strong>${escapeHTML(displayTitle(moment))}</strong><small>${escapeHTML(moment.layout === "full-gallery" ? "PHOTO GRID" : (moment.chapter || moment.date || "A memory"))}</small></span>
      </button>`).join("");
  }

  function decorateText(text, rules = []) {
    let chunks = [{ text: String(text), style: "" }];
    rules.slice().sort((a, b) => b[0].length - a[0].length).forEach(([phrase, style]) => {
      const nextChunks = [];
      chunks.forEach(chunk => {
        if (chunk.style) { nextChunks.push(chunk); return; }
        let cursor = 0;
        let found = chunk.text.indexOf(phrase, cursor);
        if (found < 0) { nextChunks.push(chunk); return; }
        while (found >= 0) {
          if (found > cursor) nextChunks.push({ text: chunk.text.slice(cursor, found), style: "" });
          nextChunks.push({ text: phrase, style });
          cursor = found + phrase.length;
          found = chunk.text.indexOf(phrase, cursor);
        }
        if (cursor < chunk.text.length) nextChunks.push({ text: chunk.text.slice(cursor), style: "" });
      });
      chunks = nextChunks;
    });
    return chunks.map(chunk => chunk.style
      ? `<span class="phrase phrase--${chunk.style}">${escapeHTML(chunk.text)}</span>`
      : escapeHTML(chunk.text)).join("");
  }

  function decorateCopyText(text, momentId) {
    return decorateText(text, copyEmphasis[momentId] || []);
  }

  function decorateHeadingText(text, momentId) {
    return decorateText(text, titleEmphasis[momentId] || []).replace(/\n/g, "<br>");
  }

  function renderCopy(paragraphs = [], isLetter = false, momentId = currentMoment().id) {
    return (paragraphs || []).map((paragraph, index) => {
      const isKaomoji = /^\(.+\)\s*♡?$/.test(paragraph.trim());
      const finalLine = isLetter && index === paragraphs.length - 1 && !isKaomoji;
      const classes = `copy-line copy-line-${index + 1}${index === 0 ? " copy-line--opening" : ""}${index === paragraphs.length - 1 ? " copy-line--closing" : ""}${finalLine ? " final-line" : ""}${isKaomoji ? " kaomoji-line" : ""}`;
      return `<p class="${classes}" style="--line-order:${index}">${decorateCopyText(paragraph, momentId)}</p>`;
    }).join("");
  }


  function renderPlaceholder(media, index) {
    const icon = media.icon || "♡";
    const label = media.label || "Add a photo for this memory";
    const caption = media.caption || "a little moment, kept close";
    if (media.minimal) {
      return `<div class="media-placeholder media-placeholder--minimal" data-empty-slot="${index}" role="button" tabindex="0" aria-label="${escapeHTML(label)}. Choose a local preview file."><span aria-hidden="true">＋</span></div>`;
    }
    return `
      <div class="media-placeholder" data-empty-slot="${index}" role="button" tabindex="0" aria-label="${escapeHTML(label)}. Choose a local preview photo or video.">
        <span class="placeholder-sticker">${escapeHTML(icon)}</span>
        <span class="placeholder-label">${escapeHTML(label)}</span>
        ${caption ? `<span class="placeholder-caption">${escapeHTML(caption)}</span>` : ""}
        <span class="placeholder-hint">＋ ADD MEMORY</span>
      </div>`;
  }


  function renderMediaItem(media, index) {
    const ratio = media.ratio || "4 / 3";
    const fit = media.fit === "contain" ? "contain" : "cover";
    const src = media.src || "";
    const type = media.type === "video" ? "video" : "image";
    const mediaContent = src
      ? (type === "video"
        ? `<video src="${escapeHTML(src)}" playsinline controls preload="metadata" aria-label="${escapeHTML(media.label || "A memory video")}"></video>`
        : `<img src="${escapeHTML(src)}" alt="${escapeHTML(media.label || "A memory photo")}" loading="lazy">`)
      : renderPlaceholder(media, index);
    return `<div class="media-frame ${src ? "has-media" : "is-placeholder"}${media.minimal ? " media-frame--minimal" : ""}" data-media-index="${index}" data-media-type="${type}" data-media-src="${escapeHTML(src)}" data-media-label="${escapeHTML(media.label || "A memory")}" style="--ratio:${escapeHTML(ratio)};--fit:${fit}" role="group" aria-label="${escapeHTML(media.label || "A memory photo")}">${mediaContent}</div>`;
  }


  function renderVisual(moment) {
    if (!Array.isArray(moment.media) || moment.media.length === 0) return "";
    const layout = moment.layout || "standard";
    const firstRatio = moment.media[0]?.ratio || "";
    const classes = [
      layout === "gallery" ? "visual-wrap--grid" : "",
      layout === "compare" ? "visual-wrap--compare" : "",
      layout === "portrait" ? "visual-wrap--portrait" : "",
      layout === "video" ? "visual-wrap--video" : "",
      layout === "duo" ? "visual-wrap--duo" : "",
      layout === "proposal" ? "visual-wrap--proposal" : "",
      layout === "keepsake-pair" ? "visual-wrap--keepsake-pair" : "",
      layout === "full-gallery" ? "visual-wrap--full-gallery" : "",
      layout === "video" && firstRatio.replace(/\s/g, "") === "9/16" ? "visual-wrap--vertical-video" : ""
    ].filter(Boolean).join(" ");
    return `<div class="visual-wrap ${classes}"><div class="media-gallery ${moment.media.length > 1 ? "multi" : ""}">${moment.media.map((item, index) => renderMediaItem(item, index)).join("")}</div></div>`;
  }


  function renderCoverArt() {
    return `
      <div class="cover-art gift-art" aria-hidden="true">
        <div class="gift-aura"></div>
        <span class="gift-spark gift-spark--one">✦</span><span class="gift-spark gift-spark--two">♡</span>
        <div class="gift-box"><span class="gift-lid"></span><span class="gift-ribbon gift-ribbon--v"></span><span class="gift-ribbon gift-ribbon--h"></span><span class="gift-bow gift-bow--left"></span><span class="gift-bow gift-bow--right"></span></div>
        <span class="gift-bear">ʕ ˶ᵔ ᴥ ᵔ˶ ʔ</span><span class="gift-tag">to my<br><b>Bei ♡</b></span>
        <span class="cover-floating cover-floating--one">✧</span><span class="cover-floating cover-floating--two">♡</span>
      </div>`;
  }

  function renderLetterArt() {
    return `<div class="letter-art birthday-party-art" aria-hidden="true">
      <span class="party-balloon party-balloon--one">♡</span><span class="party-balloon party-balloon--two">✦</span>
      <span class="letter-sparkle one">✳</span><span class="letter-sparkle two">♡</span><span class="party-spark party-spark--three">✧</span>
      <span class="birthday-cake"><span class="cake-candle"></span><span class="cake-icing"></span><span class="cake-layer cake-layer--top"></span><span class="cake-layer cake-layer--bottom"></span></span>
      <span class="letter-paper"></span><div class="letter-envelope"></div><span class="party-heart">♥</span>
    </div>`;
  }

  function renderSpotifyPlayers(moment) {
    const tracks = Array.isArray(moment.spotifyTracks) ? moment.spotifyTracks : [];
    return tracks.map((trackId, index) => {
      const number = String(index + 1).padStart(2, "0");
      const safeId = escapeHTML(trackId);
      return `<div class="spotify-track"><span class="spotify-track-number">${number}</span><iframe title="Spotify favorite ${number}" src="https://open.spotify.com/embed/track/${safeId}?utm_source=generator&theme=0" width="100%" height="152" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`;
    }).join("");
  }

  function renderSpotifyScene(moment) {
    const chapter = escapeHTML(moment.chapter || "OUR SPOTIFY BLEND");
    const date = escapeHTML(moment.date || "MAY 1");
    const title = decorateHeadingText(moment.title || "Same songs, one pair of earphones.", moment.id);
    const paragraphs = Array.isArray(moment.paragraphs) ? moment.paragraphs : [];
    return `
      <article class="story-scene layout-spotify" data-art="spotify-blend">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading spotify-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Send a tiny heart" title="A tiny heart">🎧</button></div>
        <div class="spotify-memory-note">
          <span class="spotify-note-icon" aria-hidden="true">♫</span>
          <div>${paragraphs.map((paragraph, index) => `<p>${escapeHTML(paragraph)}</p>`).join("")}</div>
          <span class="spotify-earbud" aria-hidden="true">♡</span>
        </div>
        <section class="spotify-player-shell" aria-label="Our seven favorite Spotify tracks">
          <div class="spotify-player-header"><span><i aria-hidden="true">✦</i> OUR BLEND</span><span>07 TRACKS · SPOTIFY</span></div>
          <div class="spotify-embed-list">${renderSpotifyPlayers(moment)}</div>
          <div class="spotify-list-footer"><span>🎧 one ear each</span><button class="spotify-scroll-next" type="button" aria-label="Scroll to the next song">Next song ↓</button></div>
        </section>
        <span class="spotify-floating-note spotify-floating-note--one" aria-hidden="true">♫</span><span class="spotify-floating-note spotify-floating-note--two" aria-hidden="true">♪</span>
      </article>`;
  }

  function renderSlideshowPhoto(media, index) {
    if (media.src) {
      return `<img class="slideshow-photo" src="${escapeHTML(media.src)}" alt="${escapeHTML(media.label || media.caption || "A favorite memory")}" style="--slide-fit:${media.fit === "contain" ? "contain" : "cover"}" loading="eager" decoding="async">`;
    }
    return `<div class="slideshow-placeholder" data-empty-slot="${index}" role="button" tabindex="0" aria-label="${escapeHTML(media.label || "Add a flashback photo")}. Choose a local preview photo."><span class="slideshow-placeholder-icon">${escapeHTML(media.icon || "♡")}</span><strong>Add this photo</strong><small>Choose a picture for this memory</small><span class="slideshow-placeholder-plus">＋</span></div>`;
  }

  function renderSlideshowScene(moment) {
    const photos = Array.isArray(moment.media) ? moment.media : [];
    if (!photos.length) return `<article class="story-scene layout-slideshow" data-art="flashback"><p class="slideshow-empty">Add photo entries to this moment in story.js.</p></article>`;
    const photoIndex = Math.max(0, Math.min(photos.length - 1, slideshowIndices.get(moment.id) || 0));
    const photo = photos[photoIndex];
    const title = decorateHeadingText(moment.title || "A few moments, all ours.", moment.id);
    const chapter = escapeHTML(moment.chapter || "OUR FAVORITE LITTLE THINGS");
    const date = escapeHTML(photo.date || "A LITTLE MEMORY");
    const caption = escapeHTML(photo.caption || "A moment, kept close.");
    const ratioCount = `${pad(photoIndex + 1)} / ${pad(photos.length)}`;
    const indicatorGap = Math.min(3, 100 / Math.max(1, photos.length - 1));
    return `
      <article class="story-scene layout-slideshow" data-art="flashback">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">A PHOTO REWIND</span></div>
        <div class="scene-heading slideshow-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="Tap to collect a tiny heart">✧</button></div>
        <div class="slideshow-progress" role="group" aria-label="Choose a flashback photo" style="--indicator-gap:${indicatorGap}px">
          ${photos.map((item, index) => `<button type="button" class="slideshow-segment ${index < photoIndex ? "is-done" : ""} ${index === photoIndex ? "is-current" : ""}" data-photo-index="${index}" aria-label="Show photo ${index + 1} of ${photos.length}" aria-current="${index === photoIndex ? "step" : "false"}" title="${escapeHTML(item.caption || `Photo ${index + 1}`)}"><span></span></button>`).join("")}
        </div>
        <div class="slideshow-frame" aria-label="Flashback photo ${photoIndex + 1} of ${photos.length}">
          ${renderSlideshowPhoto(photo, photoIndex)}
          <button type="button" class="slideshow-tapzone slideshow-tapzone--previous" data-slide-nav="-1" aria-label="Previous flashback photo"><span aria-hidden="true">‹</span></button>
          <button type="button" class="slideshow-tapzone slideshow-tapzone--next" data-slide-nav="1" aria-label="Next flashback photo"><span aria-hidden="true">›</span></button>
          <div class="slideshow-caption"><span class="slideshow-date">${date}</span><p>${caption}</p></div>
          <span class="slideshow-photo-count">${ratioCount}</span>
        </div>
        <div class="slideshow-meta"><span><i aria-hidden="true">♡</i> A LITTLE FLASHBACK</span><span>tap the sides to wander</span></div>
        <div class="slideshow-doodles" aria-hidden="true"><span>✧</span><span>♡</span><span>✿</span></div>
      </article>`;
  }

  function renderDurationScene(moment) {
    const title = decorateHeadingText(moment.title || "Every second, a little more us.", moment.id);
    const chapter = escapeHTML(moment.chapter || "OUR LITTLE TIMER");
    const date = escapeHTML(moment.date || "AND STILL COUNTING");
    const units = [ ["months", "months"], ["days", "days"], ["hours", "hours"], ["minutes", "minutes"], ["seconds", "seconds"] ];
    return `
      <article class="story-scene layout-duration" data-art="relationship-clock">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading duration-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">♡</button></div>
        ${moment.kicker ? `<p class="data-kicker">✦ ${escapeHTML(moment.kicker)}</p>` : ""}
        <section class="duration-card" aria-label="Live relationship duration since May 1, 2026">
          <div class="duration-orbit" aria-hidden="true"><span>♡</span><i>✦</i><b>✧</b></div>
          <div class="duration-grid">
            ${units.map(([key, label]) => `<div class="duration-unit duration-unit--${key}"><strong data-duration-unit="${key}">00</strong><span>${label}</span></div>`).join("")}
          </div>
          <div class="duration-live"><span class="live-dot"></span> LIVE · SINCE MAY 1, 2026</div>
        </section>
        <div class="duration-note">A little clock for something that keeps growing. ♡</div>
        <div class="copy-panel compact-copy"><div class="copy-scroll">${renderCopy(moment.paragraphs || [], false, moment.id)}</div></div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderChatOverviewScene(moment) {
    const stats = moment.stats || {};
    const title = decorateHeadingText(moment.title || "Let's peek at our WhatsApp chat.", moment.id);
    const chapter = escapeHTML(moment.chapter || "OUR LITTLE CHAT UNIVERSE");
    const date = escapeHTML(moment.date || "");
    const totalMessages = Number(stats.totalMessages || 0);
    const activeDays = Number(stats.activeDays || 0);
    return `
      <article class="story-scene layout-data layout-chat-overview" data-art="chat-overview">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading data-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">💬</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <section class="messages-hero"><span class="messages-hero-icon" aria-hidden="true">♡</span><strong class="messages-hero-number count-up" data-count-up="${totalMessages}">0</strong><span class="messages-hero-label">messages sent between us</span><div class="messages-hero-sparkles" aria-hidden="true">✦　✧　♡</div></section>
        <div class="chat-summary-grid">
          <div class="chat-summary-chip"><span>OUR FIRST HELLO</span><strong>${escapeHTML(stats.firstMessage || "")}</strong><small>the start of it all ♡</small></div>
          <div class="chat-summary-chip"><span>OUR LATEST CHAT</span><strong>${escapeHTML(stats.lastMessage || "")}</strong><small>and the story keeps going</small></div>
          <div class="chat-summary-chip chat-summary-chip--wide"><span>ALL THOSE LITTLE CHECK-INS</span><strong><span class="count-up" data-count-up="${activeDays}">0</span> <small>chat days</small></strong></div>
        </div>
        <div class="data-copy">${(moment.paragraphs || []).map((paragraph, index) => `<p class="copy-line copy-line-${index + 1}">${decorateText(paragraph, [])}</p>`).join("")}</div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderChatFirstHelloScene(moment) {
    const stats = moment.stats || {};
    const messages = Array.isArray(stats.messages) ? stats.messages : [];
    const title = decorateHeadingText(moment.title || "It started with a little hiiii.", moment.id);
    const chapter = escapeHTML(moment.chapter || "OUR VERY FIRST CHAT");
    const date = escapeHTML(moment.date || "MARCH 25, 2026");
    return `
      <article class="story-scene layout-data layout-chat-first-hello" data-art="chat-first-hello">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading data-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">♡</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <section class="first-chat-window" aria-label="Our first WhatsApp messages">
          <header class="first-chat-header"><span class="first-chat-avatar" aria-hidden="true">♡</span><span class="first-chat-contact"><strong>Qiana &amp; Ardan</strong><small>our first little hello</small></span><span class="first-chat-heart" aria-hidden="true">✿</span></header>
          <div class="first-chat-date">WEDNESDAY · MARCH 25, 2026</div>
          <div class="first-chat-messages">${messages.map((message, index) => {
            const isArdan = message.name === "Ardan";
            const showSender = index === 0 || message.name !== messages[index - 1].name;
            return `<div class="first-chat-message ${isArdan ? "first-chat-message--ardan" : "first-chat-message--qiana"}">${showSender ? `<span class="first-chat-sender">${escapeHTML(message.name)}</span>` : ""}<div class="first-chat-bubble">${escapeHTML(message.text)}<time>${escapeHTML(message.time)}</time></div></div>`;
          }).join("")}</div>
        </section>
        <p class="first-chat-foot">The tiniest beginning of a very big us. ♡</p>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderDuelMetric(title, people, key, totalLabel) {
    const first = people[0] || { name: "Qiana", [key]: 0, color: "qiana" };
    const second = people[1] || { name: "Ardan", [key]: 0, color: "ardan" };
    const firstCount = Number(first[key] || 0);
    const secondCount = Number(second[key] || 0);
    const total = firstCount + secondCount || 1;
    const firstPercent = firstCount / total * 100;
    return `<section class="duel-metric"><div class="duel-metric-heading"><strong>${title}</strong><span>${totalLabel || total.toLocaleString("en-US")} between us</span></div><div class="duel-bar" role="img" aria-label="${escapeHTML(first.name)} and ${escapeHTML(second.name)} comparison"><span class="duel-fill duel-fill--qiana" style="width:${firstPercent.toFixed(3)}%"></span><span class="duel-fill duel-fill--ardan" style="width:${(100 - firstPercent).toFixed(3)}%"></span></div><div class="duel-values"><span class="duel-person duel-person--qiana"><b>${escapeHTML(first.name)}</b><strong class="count-up" data-count-up="${firstCount}">0</strong><small>${Math.round(firstPercent)}%</small></span><span class="duel-person duel-person--ardan"><b>${escapeHTML(second.name)}</b><strong class="count-up" data-count-up="${secondCount}">0</strong><small>${Math.round(100 - firstPercent)}%</small></span></div></section>`;
  }

  function renderChatBalanceScene(moment) {
    const stats = moment.stats || {};
    const people = Array.isArray(stats.people) ? stats.people : [];
    const title = decorateHeadingText(moment.title || "You sent a little more; I wrote a little more.", moment.id);
    const chapter = escapeHTML(moment.chapter || "THE MESSAGE DUEL");
    const date = escapeHTML(moment.date || "");
    return `
      <article class="story-scene layout-data layout-chat-balance" data-art="chat-balance">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading data-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">⚖</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <div class="chat-duel-cards">${renderDuelMetric("Messages", people, "messages")}${renderDuelMetric("Words typed", people, "words")}</div>
        <div class="duel-note"><span aria-hidden="true">✦</span><p>${(moment.paragraphs || []).map(paragraph => decorateText(paragraph, [])).join(" ")}</p></div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderChatHourlyScene(moment) {
    const stats = moment.stats || {};
    const hourly = Array.isArray(stats.hourly) ? stats.hourly : [];
    const title = decorateHeadingText(moment.title || "When do we talk the most?", moment.id);
    const chapter = escapeHTML(moment.chapter || "OUR CHAT BY HOUR");
    const date = escapeHTML(moment.date || "");
    const maxValue = 4500;
    const ticks = [{ at: 0, label: "4.5k" }, { at: 33.333, label: "3k" }, { at: 66.667, label: "1.5k" }, { at: 100, label: "0" }];
    const labels = { 0: "12 AM", 3: "3 AM", 6: "6 AM", 9: "9 AM", 12: "12 PM", 15: "3 PM", 18: "6 PM", 21: "9 PM" };
    return `
      <article class="story-scene layout-data layout-chat-hourly" data-art="chat-hourly">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading data-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">☾</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <section class="hourly-chart-card" aria-label="Messages per hour chart">
          <div class="hourly-chart-legend"><span><i class="legend-dot legend-dot--qiana"></i>Qiana</span><span><i class="legend-dot legend-dot--ardan"></i>Ardan</span></div>
          <div class="hourly-chart-layout"><div class="hourly-y-axis">${ticks.map(tick => `<span style="top:${tick.at}%">${tick.label}</span>`).join("")}</div><div class="hourly-plot-wrap"><div class="hourly-grid-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="hourly-bars">${hourly.map((item, index) => `<div class="hourly-bar-group" title="${labels[item.hour] || item.hour + ":00"}" aria-label="${labels[item.hour] || item.hour + ":00"}""><span class="hourly-bar hourly-bar--qiana" style="--bar-height:${Math.min(100, Number(item.qiana || 0) / maxValue * 100)}%;--bar-delay:${index * 13}ms"></span><span class="hourly-bar hourly-bar--ardan" style="--bar-height:${Math.min(100, Number(item.ardan || 0) / maxValue * 100)}%;--bar-delay:${index * 13 + 55}ms"></span></div>`).join("")}</div></div></div>
          <div class="hourly-x-axis">${hourly.map(item => `<span>${labels[item.hour] || ""}</span>`).join("")}</div>
        </section>
        <div class="data-copy">${(moment.paragraphs || []).map((paragraph, index) => `<p class="copy-line copy-line-${index + 1}">${decorateText(paragraph, [])}</p>`).join("")}</div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderChatMonthlyScene(moment) {
    const stats = moment.stats || {};
    const monthly = Array.isArray(stats.monthly) ? stats.monthly : [];
    const title = decorateHeadingText(moment.title || "Our chat, month by month.", moment.id);
    const chapter = escapeHTML(moment.chapter || "OUR CHAT, MONTH BY MONTH");
    const date = escapeHTML(moment.date || "");
    const maxValue = Math.max(1, ...monthly.map(item => Math.max(Number(item.qiana || 0), Number(item.ardan || 0))));
    return `
      <article class="story-scene layout-data layout-chat-monthly" data-art="chat-monthly">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading data-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">✿</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <section class="monthly-chart-card" aria-label="Relative messages by month">
          <div class="monthly-chart-legend"><span><i class="legend-dot legend-dot--qiana"></i>Qiana</span><span><i class="legend-dot legend-dot--ardan"></i>Ardan</span></div>
          <div class="monthly-chart-rows">${monthly.map((item, index) => `<div class="monthly-row" style="--row-delay:${index * 70}ms"><span class="monthly-month">${escapeHTML(item.month)}</span><div class="monthly-pair-bars"><span class="monthly-bar monthly-bar--qiana" style="--bar-width:${Number(item.qiana || 0) / maxValue * 100}%;--bar-delay:${index * 70}ms"></span><span class="monthly-bar monthly-bar--ardan" style="--bar-width:${Number(item.ardan || 0) / maxValue * 100}%;--bar-delay:${index * 70 + 35}ms"></span></div></div>`).join("")}</div>
          <div class="monthly-chart-note"><span>quieter</span><span>more messages</span></div>
        </section>
        <div class="data-copy">${(moment.paragraphs || []).map((paragraph, index) => `<p class="copy-line copy-line-${index + 1}">${decorateText(paragraph, [])}</p>`).join("")}</div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderChatFavoritesScene(moment, kind) {
    const stats = moment.stats || {};
    const people = Array.isArray(stats.people) ? stats.people : [];
    const title = decorateHeadingText(moment.title || (kind === "emoji" ? "Our chat in emojis." : "Words that sound like us."), moment.id);
    const chapter = escapeHTML(moment.chapter || (kind === "emoji" ? "OUR CHAT IN EMOJIS" : "WORDS THAT SOUND LIKE US"));
    const date = escapeHTML(moment.date || "");
    const isEmoji = kind === "emoji";
    return `
      <article class="story-scene layout-data layout-chat-favorites ${isEmoji ? "layout-chat-emojis" : "layout-chat-words"}" data-art="${isEmoji ? "chat-emojis" : "chat-words"}">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading data-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">${isEmoji ? "💗" : "✎"}</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <div class="favorites-people">${people.map(person => `<section class="favorites-person favorites-person--${escapeHTML(person.color || "qiana")}"><h2>${escapeHTML(person.name)}</h2><div class="favorites-items ${isEmoji ? "favorites-items--emoji" : "favorites-items--words"}">${(person.items || []).map((item, index) => `<div class="favorite-item" style="--item-delay:${index * 65}ms"><span class="favorite-label ${isEmoji ? "favorite-label--emoji" : ""}">${escapeHTML(item.label)}</span><strong class="favorite-count count-up" data-count-up="${Number(item.count || 0)}">0</strong><small>${isEmoji ? "times" : "uses"}</small></div>`).join("")}</div></section>`).join("")}</div>
        <div class="data-copy">${(moment.paragraphs || []).map((paragraph, index) => `<p class="copy-line copy-line-${index + 1}">${decorateText(paragraph, [])}</p>`).join("")}</div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderChatRhythmScene(moment) {
    const title = decorateHeadingText(moment.title || "Still my favorite person to talk to.", moment.id);
    const chapter = escapeHTML(moment.chapter || "THE RHYTHM OF US");
    const date = escapeHTML(moment.date || "");
    const paragraph = (moment.paragraphs || []).map(item => decorateText(item, [])).join(" ");
    return `
      <article class="story-scene layout-data layout-chat-rhythm" data-art="chat-rhythm">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading data-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">♡</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <section class="chat-ending-card"><span class="chat-ending-spark" aria-hidden="true">✦　♡　✧</span><div class="chat-ending-number"><strong class="count-up" data-count-up="106721">0</strong><span>messages later...</span></div><p>${paragraph}</p><div class="chat-ending-hearts" aria-hidden="true"><span>♡</span><span>✿</span><span>♡</span></div></section>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function renderBirthdayGalleryScene(moment) {
    const isCats = moment.layout === "birthday-cats";
    const title = decorateHeadingText(moment.title || "Your birthday crew.", moment.id);
    const chapter = escapeHTML(moment.chapter || "A LITTLE BIRTHDAY GREETING");
    const date = escapeHTML(moment.date || "");
    const items = Array.isArray(moment.media) ? moment.media : [];
    return `
      <article class="story-scene layout-birthday-gallery ${isCats ? "layout-birthday-cats" : "layout-birthday-crew"}" data-art="${isCats ? "birthday-cats" : "birthday-crew"}">
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        <div class="scene-heading birthday-gallery-heading"><h1>${title}</h1><button class="tiny-star tiny-interactive" type="button" aria-label="Collect a tiny heart" title="A tiny heart">${isCats ? "🐾" : "🎀"}</button></div>
        ${moment.kicker ? `<p class="data-kicker">${escapeHTML(moment.kicker)}</p>` : ""}
        <div class="birthday-photo-grid">${items.map((item, index) => `<div class="birthday-photo-card birthday-photo-card--${index+1}" style="--frame-tilt:${index % 2 ? "1.3deg" : "-1.2deg"}"><div class="birthday-photo-window">${renderMediaItem(item, index)}</div><span class="birthday-frame-name">${escapeHTML(item.frameName || item.caption || item.label || `Memory ${index+1}`)}</span><span class="birthday-frame-spark" aria-hidden="true">${index % 2 ? "✦" : "♡"}</span></div>`).join("")}</div>
        <div class="birthday-gallery-copy">${(moment.paragraphs || []).map((paragraph, index) => `<p class="copy-line copy-line-${index+1}">${decorateText(paragraph, [])}</p>`).join("")}</div>
        <div class="birthday-gallery-foot">${isCats ? "birthday wishes, delivered in tiny meows ♡" : "a tiny birthday party, with love ♡"}</div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function stopGuestbookWatch() {
    if (typeof guestbookUnsubscribe === "function") guestbookUnsubscribe();
    guestbookUnsubscribe = null;
  }

  function formatGuestbookDate(timestamp) {
    if (!timestamp) return "just now";
    try {
      const date = timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
      return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date) : "just now";
    } catch (_) { return "just now"; }
  }

  function paintRewindGuestbook(wishes) {
    const list = document.getElementById("rewindWishesList");
    const count = document.getElementById("rewindWishCount");
    if (!list || !count) return;
    const drafts = new Map([...list.querySelectorAll("[data-admin-reply]")].map(input => {
      const card = input.closest("[data-wish-card]");
      return [card ? card.dataset.wishCard : "", input.value];
    }).filter(([id]) => id));
    const hiddenCount = wishes.filter(wish => wish.hidden === true).length;
    const visibleCount = wishes.length - hiddenCount;
    count.textContent = `${visibleCount} messages · ${hiddenCount} hidden`;
    if (!wishes.length) {
      list.innerHTML = '<div class="guestbook-empty"><span>✦</span><strong>Belum ada pesan.</strong><p>Guestbook-nya masih nunggu ucapan pertama, hehe.</p></div>';
      return;
    }
    list.innerHTML = wishes.map(wish => {
      const id = escapeHTML(String(wish.id || ""));
      const name = escapeHTML(String(wish.name || "Guest").slice(0, 48));
      const message = escapeHTML(String(wish.message || "").slice(0, 900));
      const hidden = wish.hidden === true;
      const replyRaw = String(wish.reply || "").slice(0, 900);
      const reply = escapeHTML(replyRaw);
      const replyDraft = drafts.has(String(wish.id || "")) ? drafts.get(String(wish.id || "")) : replyRaw;
      const photo = typeof wish.photoData === "string" && wish.photoData.length <= 300000 && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(wish.photoData)
        ? `<button class="guestbook-photo-open" type="button" data-expand-wish-photo aria-label="Expand photo from ${name}"><img class="guestbook-note-photo" src="${wish.photoData}" alt="Photo from ${name}" loading="lazy"></button>` : "";
      const replyBox = replyRaw ? `<div class="guestbook-note-reply"><strong>AYA REPLIED</strong><p>${reply}</p></div>` : "";
      return `<article class="guestbook-note ${hidden ? "is-hidden" : ""}" data-wish-card="${id}">
        <div class="guestbook-note-head"><strong>${name}</strong><time>${escapeHTML(formatGuestbookDate(wish.createdAt))}</time></div>
        ${hidden ? '<span class="guestbook-hidden-badge">HIDDEN FROM PUBLIC</span>' : ""}
        <p class="guestbook-note-message">${message}</p>${photo}${replyBox}
        <div class="guestbook-admin-controls">
          <label class="guestbook-admin-label"><span>REPLY AS AYA</span><textarea class="guestbook-admin-reply" data-admin-reply maxlength="900" rows="2" placeholder="Tulis balasan di sini…">${escapeHTML(replyDraft)}</textarea></label>
          <div class="guestbook-admin-actions"><button type="button" class="guestbook-admin-save" data-admin-save="${id}">Save reply</button><button type="button" class="guestbook-admin-hide" data-admin-hide="${id}" data-hidden="${hidden ? "true" : "false"}">${hidden ? "Show message" : "Hide message"}</button></div>
        </div>
      </article>`;
    }).join("");
  }

  function startGuestbookWatch() {
    stopGuestbookWatch();
    const list = document.getElementById("rewindWishesList");
    if (!list) return;
    if (!window.BirthdayGuestbook || typeof window.BirthdayGuestbook.watchWishes !== "function") {
      list.innerHTML = '<div class="guestbook-empty"><span>♡</span><strong>Belum siap.</strong><p>Pastikan koneksi Firestore sudah aktif.</p></div>';
      return;
    }
    list.innerHTML = '<div class="guestbook-empty"><span>♡</span><p>Loading birthday messages…</p></div>';
    guestbookUnsubscribe = window.BirthdayGuestbook.watchWishes(paintRewindGuestbook, error => {
      console.error("Could not load rewind guestbook", error);
      const target = document.getElementById("rewindWishesList");
      if (target) target.innerHTML = '<div class="guestbook-empty guestbook-error"><span>♡</span><strong>Pesan-pesannya belum bisa dibuka.</strong><p>Check Firestore rules and refresh when ready.</p></div>';
    });
  }

  function renderBirthdayWishesScene(moment) {
    const previousText = Array.isArray(moment.paragraphs) && moment.paragraphs.length ? moment.paragraphs[0] : "A birthday guestbook from friends, fans, and familiar faces.";
    return `<article class="story-scene layout-guestbook" data-art="birthday-wishes">
      <div class="guestbook-overline"><span>${escapeHTML(moment.chapter || "AYA’S BIRTHDAY GUESTBOOK")}</span><span>✦ OCT 17</span></div>
      <h1 class="guestbook-title">${escapeHTML(moment.title || "The birthday guestbook")}</h1>
      <p class="guestbook-deck">${escapeHTML(previousText)}</p>
      <div class="guestbook-count"><strong id="rewindWishCount">…</strong></div>
      <div class="guestbook-toolbar"><button class="guestbook-copy-link" type="button" data-copy-wishes-link>Copy wishes link <span aria-hidden="true">↗</span></button><a class="guestbook-public-link" href="wishes.html" target="_blank" rel="noopener noreferrer">Open public page</a></div>
      <div class="guestbook-stream" id="rewindWishesList" aria-live="polite"><div class="guestbook-empty"><span>✦</span><p>Loading birthday messages…</p></div></div>
      <p class="guestbook-admin-hint">Private controls: reply as Aya or hide a message from the public page.</p>
    </article>`;
  }

  function renderScene(moment) {
    if (moment.layout === "birthday-wishes") return renderBirthdayWishesScene(moment);
    if (moment.layout === "slideshow") return renderSlideshowScene(moment);
    if (moment.layout === "duration") return renderDurationScene(moment);
    if (moment.layout === "chat-overview") return renderChatOverviewScene(moment);
    if (moment.layout === "chat-first-hello") return renderChatFirstHelloScene(moment);
    if (moment.layout === "chat-balance") return renderChatBalanceScene(moment);
    if (moment.layout === "chat-hourly") return renderChatHourlyScene(moment);
    if (moment.layout === "chat-monthly") return renderChatMonthlyScene(moment);
    if (moment.layout === "chat-emojis") return renderChatFavoritesScene(moment, "emoji");
    if (moment.layout === "chat-words") return renderChatFavoritesScene(moment, "words");
    if (moment.layout === "chat-rhythm") return renderChatRhythmScene(moment);
    if (moment.layout === "birthday-crew" || moment.layout === "birthday-cats") return renderBirthdayGalleryScene(moment);
    const isCover = moment.layout === "cover";
    const isLetter = moment.layout === "letter";
    const isFullGallery = moment.layout === "full-gallery";
    const title = String(moment.title || "");
    const chapter = escapeHTML(moment.chapter || "");
    const date = escapeHTML(moment.date || "");
    const lyricLabel = moment.lyricLabel || (isCover ? "" : "the line that became ours");
    const lyric = moment.lyric ? `<button type="button" class="scene-lyric ${isCover ? "cover-lyric" : "lore-lyric"}" aria-label="Tap to remember this lyric">${lyricLabel ? `<span class="lyric-label">${escapeHTML(lyricLabel)}</span>` : ""}<strong>${escapeHTML(moment.lyric)}</strong></button>` : "";
    const kicker = moment.kicker ? `<div class="scene-kicker">✿ ${escapeHTML(moment.kicker)}</div>` : "";
    const sceneBg = moment.backgroundSrc ? ` style="--scene-photo: url(&quot;${escapeHTML(moment.backgroundSrc)}&quot;)"` : "";
    const bgClass = moment.backgroundSrc ? " has-scene-backdrop" : "";

    if (isCover) {
      return `
        <article class="story-scene layout-cover${bgClass}" data-art="birthday-gift"${sceneBg}>
          ${renderCoverArt()}
          ${lyric}
          <div class="cover-title"><h1>${decorateHeadingText(moment.title || "", moment.id)}</h1></div>
          <div class="copy-panel cover-copy"><div class="copy-scroll">${renderCopy(moment.paragraphs, false, moment.id)}</div></div>
          <button type="button" class="cover-wishes-jump" data-wishes-slide>Read the birthday wishes <span aria-hidden="true">↗</span></button>
          <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
        </article>`;
    }

    if (isFullGallery) {
      return `<article class="story-scene layout-full-gallery${bgClass}" data-art="everyday-gallery"${sceneBg}>${renderVisual(moment)}</article>`;
    }

    if (moment.layout === "spotify") return renderSpotifyScene(moment);

    if (isLetter) {
      const variants = Array.isArray(moment.titleVariants) && moment.titleVariants.length ? moment.titleVariants : ["Qiana"];
      const firstName = variants[0] || "Qiana";
      return `
        <article class="story-scene layout-letter${bgClass}" data-art="letter"${sceneBg}>
          <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
          ${renderLetterArt()}
          <div class="scene-heading birthday-heading"><button class="birthday-greeting" type="button" data-title-variants="${escapeHTML(JSON.stringify(variants))}" aria-live="polite" aria-label="Happy Birthday, ${escapeHTML(firstName)}. Tap to see another name"><span class="birthday-static">Happy Birthday,</span><span class="birthday-roller"><span class="birthday-name birthday-name--initial">${escapeHTML(firstName)}</span></span></button></div>
          <div class="copy-panel birthday-copy"><div class="copy-scroll">${renderCopy(moment.paragraphs, true, moment.id)}</div></div>
          <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
        </article>`;
    }

    const supportedLayouts = ["gallery", "compare", "portrait", "video", "duo", "proposal", "keepsake-pair"];
    const layoutClass = supportedLayouts.includes(moment.layout) ? ` layout-${moment.layout}` : "";
    const loreDecor = moment.id === "lore" ? `<div class="lore-doodles" aria-hidden="true"><span class="lore-coffee">☕</span><span class="lore-zzz">z z Z</span><span class="lore-sleepy-face">(－ω－) zzZ</span><span class="lore-steam"></span></div>` : "";
    const sticker = storyStickers[moment.id] || "✧";
    const sceneTitle = title ? `<div class="scene-heading"><h1>${decorateHeadingText(title, moment.id)}</h1>${moment.id === "beginning" ? '<button class="tiny-star cat-easter" type="button" aria-label="A tiny hello from Jiji" title="a tiny hello from Jiji">🐈‍⬛</button>' : `<button class="tiny-star tiny-interactive" type="button" aria-label="Send a tiny heart" title="a tiny heart">${sticker}</button>`}</div>` : "";
    return `
      <article class="story-scene layout-standard${layoutClass}${bgClass}" data-art="${escapeHTML(moment.art || "memory")}"${sceneBg}>
        ${moment.backgroundSrc ? `<button class="background-photo-button" type="button" data-background-id="${escapeHTML(moment.id)}" aria-label="Choose a background photo" title="Change background photo">▧</button>` : ""}
        <div class="scene-overline"><span class="scene-chapter">${chapter}</span><span class="scene-date">${date}</span></div>
        ${lyric}
        ${loreDecor}
        ${sceneTitle}
        ${kicker}
        ${renderVisual(moment)}
        <div class="copy-panel"><div class="copy-scroll">${renderCopy(moment.paragraphs, false, moment.id)}</div></div>
        <div class="scene-doodles" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span></div>
      </article>`;
  }

  function advanceBirthdayGreeting() {
    const greeting = stage.querySelector(".birthday-greeting");
    const name = greeting && greeting.querySelector(".birthday-name");
    if (!greeting || !name || birthdayVariants.length < 2) return;
    birthdayVariantIndex = (birthdayVariantIndex + 1) % birthdayVariants.length;
    const nextName = birthdayVariants[birthdayVariantIndex];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.clearTimeout(birthdayAnimationTimer);
    if (reducedMotion) {
      name.textContent = nextName;
      greeting.setAttribute("aria-label", `Happy Birthday, ${nextName}. Tap to see another name`);
      return;
    }
    name.classList.remove("is-entering", "birthday-name--initial");
    void name.offsetWidth;
    name.classList.add("is-leaving");
    birthdayAnimationTimer = window.setTimeout(() => {
      if (!name.isConnected || !greeting.isConnected) return;
      name.textContent = nextName;
      name.classList.remove("is-leaving");
      name.classList.add("is-entering");
      greeting.setAttribute("aria-label", `Happy Birthday, ${nextName}. Tap to see another name`);
      birthdayAnimationTimer = window.setTimeout(() => name.classList.remove("is-entering"), 560);
    }, 230);
  }

  function startBirthdayGreetingCycle(moment) {
    window.clearInterval(birthdayCycleTimer);
    window.clearTimeout(birthdayAnimationTimer);
    birthdayCycleTimer = null;
    birthdayAnimationTimer = null;
    birthdayVariants = [];
    birthdayVariantIndex = 0;
    if (moment.layout !== "letter") return;
    try {
      const greeting = stage.querySelector(".birthday-greeting");
      birthdayVariants = greeting ? JSON.parse(greeting.dataset.titleVariants || "[]") : [];
    } catch (_) { birthdayVariants = []; }
    if (birthdayVariants.length > 1) birthdayCycleTimer = window.setInterval(advanceBirthdayGreeting, 3100);
  }


  function updateHeartScore() {
    if (!heartScore || !heartCount) return;
    heartCount.textContent = String(heartsCollected).padStart(2, "0");
    heartScore.setAttribute("aria-label", `${heartsCollected} little hearts collected`);
    heartScore.title = visitedMoments.size === story.length
      ? "The whole little universe has been discovered. ♡"
      : `You've wandered through ${visitedMoments.size} of ${story.length} moments. Tap a little sticker for a bonus heart.`;
    heartScore.classList.remove("is-popping");
    void heartScore.offsetWidth;
    heartScore.classList.add("is-popping");
    window.clearTimeout(heartScoreTimer);
    heartScoreTimer = window.setTimeout(() => heartScore.classList.remove("is-popping"), 460);
    heartScore.classList.toggle("is-complete", visitedMoments.size === story.length);
  }

  function markMomentVisited(moment) {
    if (!moment || !moment.id || visitedMoments.has(moment.id)) return;
    visitedMoments.add(moment.id);
    heartsCollected += 1;
    updateHeartScore();
  }

  function collectBonusHeart(anchor) {
    if (!anchor) return;
    playSound("heart");
    const moment = currentMoment();
    if (!bonusHeartMoments.has(moment.id)) {
      bonusHeartMoments.add(moment.id);
      heartsCollected += 1;
      updateHeartScore();
    }
    heartBurst(anchor);
  }

  function navigateSlideshow(delta) {
    const moment = currentMoment();
    const photos = Array.isArray(moment.media) ? moment.media : [];
    if (moment.layout !== "slideshow" || photos.length === 0) return;
    const currentPhoto = Math.max(0, Math.min(photos.length - 1, slideshowIndices.get(moment.id) || 0));
    const target = currentPhoto + delta;
    if (target < 0) { previous(); return; }
    if (target >= photos.length) { next(); return; }
    slideshowIndices.set(moment.id, target);
    playSound("slide");
    render();
  }

  function relationshipDuration(now = new Date()) {
    const clockMoment = story.find(moment => moment.layout === "duration");
    const start = clockMoment && clockMoment.startDate ? new Date(clockMoment.startDate) : RELATIONSHIP_START;
    let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
    let monthCursor = new Date(start);
    monthCursor.setMonth(start.getMonth() + months);
    while (monthCursor > now && months > 0) {
      months -= 1;
      monthCursor = new Date(start);
      monthCursor.setMonth(start.getMonth() + months);
    }
    let remaining = Math.max(0, now.getTime() - monthCursor.getTime());
    const dayMs = 86400000;
    const hourMs = 3600000;
    const minuteMs = 60000;
    const days = Math.floor(remaining / dayMs); remaining %= dayMs;
    const hours = Math.floor(remaining / hourMs); remaining %= hourMs;
    const minutes = Math.floor(remaining / minuteMs); remaining %= minuteMs;
    const seconds = Math.floor(remaining / 1000);
    return { months, days, hours, minutes, seconds };
  }

  function animateDataCounters() {
    const counters = stage.querySelectorAll("[data-count-up]");
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    counters.forEach(node => {
      const target = Math.max(0, Number(node.dataset.countUp || 0));
      if (reduceMotion || typeof window.requestAnimationFrame !== "function") {
        node.textContent = target.toLocaleString("en-US");
        return;
      }
      const started = performance.now();
      const duration = 760;
      const tick = now => {
        if (!node.isConnected) return;
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = Math.round(target * eased).toLocaleString("en-US");
        if (progress < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    });
  }

  function updateRelationshipClock() {
    const fields = stage.querySelectorAll("[data-duration-unit]");
    if (!fields.length) return;
    const values = relationshipDuration();
    fields.forEach(field => {
      const key = field.dataset.durationUnit;
      const value = String(values[key] ?? 0).padStart(2, "0");
      if (field.textContent !== value) {
        field.textContent = value;
        field.classList.remove("is-ticking");
        void field.offsetWidth;
        field.classList.add("is-ticking");
      }
    });
  }

  function updateChrome() {
    const moment = currentMoment();
    momentCounter.textContent = `MOMENT ${pad(currentIndex + 1)} / ${pad(story.length)}`;
    momentDate.textContent = moment.date || moment.chapter || (moment.layout === "full-gallery" ? " " : "OUR STORY");
    backButton.disabled = currentIndex === 0;
    nextLabel.textContent = currentIndex === 0 ? (moment.cta || "Tap to rewind") : currentIndex === story.length - 1 ? (moment.cta || "Rewind our story") : (moment.cta || "Next memory");
    const nextIcon = nextButton.querySelector(".next-icon");
    if (nextIcon) nextIcon.textContent = currentIndex === story.length - 1 ? "↺" : "↗";
    renderProgress();
    renderMap();
  }

  function syncMusicButton() {
    if (!soundButton) return;
    const playing = Boolean(backgroundMusic && !backgroundMusic.paused && !backgroundMusic.ended);
    soundButton.classList.toggle("is-on", playing);
    soundButton.setAttribute("aria-pressed", String(playing));
    soundButton.setAttribute("aria-label", playing ? "Pause background music" : "Start background music");
    soundButton.title = musicUnavailable
      ? `Add ${MUSIC_SRC} to enable the soundtrack`
      : playing ? "Pause the looping soundtrack" : "Start the looping soundtrack";
    soundButton.textContent = playing ? "♫" : "♪";
  }


  function unbindMusicGesture() {
    if (!musicGestureBound) return;
    document.removeEventListener("pointerdown", firstUserGesture, true);
    document.removeEventListener("keydown", firstUserGesture, true);
    document.removeEventListener("touchstart", firstUserGesture, true);
    document.removeEventListener("click", firstUserGesture, true);
    musicGestureBound = false;
  }

  function firstUserGesture(event) {
    if (event && event.target && event.target.closest && event.target.closest("#soundButton")) return;
    if (musicUnavailable || (backgroundMusic && !backgroundMusic.paused)) {
      unbindMusicGesture();
      return;
    }
    requestBackgroundMusic(false);
  }

  function requestBackgroundMusic(showFeedback = false) {
    if (!backgroundMusic || musicUnavailable || musicAttemptInFlight || !backgroundMusic.paused) {
      if (backgroundMusic && !backgroundMusic.paused) { syncMusicButton(); return; }
      if (musicUnavailable && showFeedback) showToast(`Add ${MUSIC_SRC} and reload to hear our soundtrack. ♡`);
      return;
    }
    musicAttemptInFlight = true;
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.38;
    backgroundMusic.preload = "auto";
    if (!backgroundMusic.getAttribute("src")) {
      backgroundMusic.src = MUSIC_SRC;
      try { backgroundMusic.load(); } catch (_) { /* The browser may already be loading it. */ }
    }
    let playRequest;
    try { playRequest = backgroundMusic.play(); }
    catch (_) { musicAttemptInFlight = false; syncMusicButton(); return; }
    Promise.resolve(playRequest).then(() => {
      musicStarted = true;
      musicAttemptInFlight = false;
      unbindMusicGesture();
      syncMusicButton();
      if (showFeedback) showToast("Our little soundtrack is playing. ♡");
    }).catch(() => {
      musicAttemptInFlight = false;
      syncMusicButton();
      if (showFeedback) showToast(`Add ${MUSIC_SRC} to enable the music, then reload. ♡`);
    });
  }

  function toggleBackgroundMusic() {
    if (!backgroundMusic) return;
    if (!backgroundMusic.paused && !backgroundMusic.ended) {
      backgroundMusic.pause();
      syncMusicButton();
      return;
    }
    requestBackgroundMusic(true);
  }

  if (backgroundMusic) {
    backgroundMusic.addEventListener("play", syncMusicButton);
    backgroundMusic.addEventListener("pause", syncMusicButton);
    backgroundMusic.addEventListener("ended", () => { if (backgroundMusic.loop) requestBackgroundMusic(false); else syncMusicButton(); });
    backgroundMusic.addEventListener("error", () => {
      musicUnavailable = true;
      musicAttemptInFlight = false;
      syncMusicButton();
    });
    // Start fetching the soundtrack immediately, but never start playback before a gesture.
    backgroundMusic.src = MUSIC_SRC;
    backgroundMusic.load();
    document.addEventListener("pointerdown", firstUserGesture, true);
    document.addEventListener("keydown", firstUserGesture, true);
    document.addEventListener("touchstart", firstUserGesture, { capture: true, passive: true });
    document.addEventListener("click", firstUserGesture, true);
  }

  function updatePreloadProgress(done, total) {
    const bar = document.getElementById("assetPreloadBar");
    const label = document.getElementById("assetPreloadLabel");
    const track = bar && bar.parentElement;
    const percent = total ? Math.min(100, Math.round(done / total * 100)) : 100;
    if (bar) bar.style.width = `${percent}%`;
    if (track) track.setAttribute("aria-valuenow", String(percent));
    if (label) label.textContent = `Getting everything ready · ${percent}%`;
  }

  async function preloadStoryAssets() {
    const imageSources = new Set();
    const videoSources = new Set();
    story.forEach(moment => {
      if (moment.backgroundSrc) imageSources.add(moment.backgroundSrc);
      (Array.isArray(moment.media) ? moment.media : []).forEach(media => {
        if (!media || !media.src || /^blob:|^data:/i.test(media.src)) return;
        if (media.type === "video") videoSources.add(media.src);
        else imageSources.add(media.src);
      });
    });
    const total = imageSources.size + videoSources.size;
    let done = 0;
    updatePreloadProgress(0, total);
    if (!total) {
      updatePreloadProgress(0, 0);
      await new Promise(resolve => window.setTimeout(resolve, 250));
      return;
    }
    const finishOne = () => { done += 1; updatePreloadProgress(done, total); };
    const imageTasks = Array.from(imageSources, src => new Promise(resolve => {
      const image = new Image();
      let settled = false;
      const finish = async () => {
        if (settled) return;
        settled = true;
        try { if (image.decode) await image.decode(); } catch (_) { /* Broken/missing assets fall back to a placeholder. */ }
        finishOne(); resolve();
      };
      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
      image.src = src;
      if (image.complete) finish();
      window.setTimeout(finish, 5200);
    }));
    const videoTasks = Array.from(videoSources, src => new Promise(resolve => {
      const video = document.createElement("video");
      video.preload = "metadata";
      let settled = false;
      const finish = () => { if (settled) return; settled = true; finishOne(); resolve(); video.removeAttribute("src"); video.load(); };
      video.addEventListener("loadedmetadata", finish, { once: true });
      video.addEventListener("error", finish, { once: true });
      video.src = src;
      window.setTimeout(finish, 5200);
    }));
    await Promise.race([
      Promise.all([...imageTasks, ...videoTasks]),
      new Promise(resolve => window.setTimeout(resolve, 5400))
    ]);
    updatePreloadProgress(total, total);
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready.catch(() => {}), new Promise(resolve => window.setTimeout(resolve, 700))]);
    }
  }

  function render() {
    if (!story.length) {
      stage.innerHTML = '<div class="loading-state"><span class="loading-heart">♡</span><p>Add story moments in story.js to begin.</p></div>';
      return;
    }
    const moment = currentMoment();
    stopGuestbookWatch();
    markMomentVisited(moment);
    stage.className = `stage theme-${/^[a-z-]+$/.test(moment.theme || "") ? moment.theme : "rose"}`;
    stage.innerHTML = renderScene(moment);
    updateChrome();
    animateDataCounters();
    updateRelationshipClock();
    startBirthdayGreetingCycle(moment);
    attachMediaErrorHandlers();
    attachSpotifyInteractions();
    if (moment.layout === "birthday-wishes") startGuestbookWatch();
    if (moment.id === "birthday-letter") launchConfetti();
  }

  function goTo(index, options = {}) {
    if (!story.length) return;
    const bounded = Math.max(0, Math.min(story.length - 1, Number(index)));
    if (!Number.isFinite(bounded)) return;
    const previousIndex = currentIndex;
    currentIndex = bounded;
    if (currentIndex !== previousIndex) playSound(currentIndex > previousIndex ? "next" : "back");
    closeMap();
    closeViewer();
    render();
    if (!options.keepToast) hideToast();
  }

  function next() {
    if (currentIndex === story.length - 1) {
      launchConfetti();
      showToast("One more time, from the very beginning. ♡");
      window.setTimeout(() => goTo(0), 720);
      return;
    }
    goTo(currentIndex + 1);
  }

  function previous() {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 2600);
  }

  function hideToast() {
    toast.classList.remove("is-visible");
  }

  function openMap() {
    mapOverlay.hidden = false;
    const currentButton = mapList.querySelector(".is-current");
    if (currentButton) currentButton.scrollIntoView({ block: "nearest" });
    mapClose.focus({ preventScroll: true });
  }

  function closeMap() {
    mapOverlay.hidden = true;
  }

  function openViewer(src, type, label) {
    if (!src) return;
    viewerContent.innerHTML = type === "video"
      ? `<video src="${escapeHTML(src)}" controls autoplay playsinline></video>`
      : `<img src="${escapeHTML(src)}" alt="${escapeHTML(label || "Memory photo")}">`;
    mediaViewer.hidden = false;
    viewerClose.focus({ preventScroll: true });
  }

  function closeViewer() {
    const video = viewerContent.querySelector("video");
    if (video) video.pause();
    mediaViewer.hidden = true;
    viewerContent.innerHTML = "";
  }

  function attachSpotifyInteractions() {
    const list = stage.querySelector(".spotify-embed-list");
    const button = stage.querySelector(".spotify-scroll-next");
    if (!list || !button) return;
    const updateLabel = () => {
      const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
      const atEnd = maxScroll > 4 && list.scrollTop >= maxScroll - 8;
      button.textContent = atEnd ? "Back to top ↑" : "Next song ↓";
      button.setAttribute("aria-label", atEnd ? "Return to the first song" : "Scroll to the next song");
      button.disabled = maxScroll <= 4;
    };
    list.addEventListener("scroll", updateLabel, { passive: true });
    button.addEventListener("click", () => {
      const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
      const atEnd = maxScroll > 4 && list.scrollTop >= maxScroll - 8;
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      list.scrollTo({ top: atEnd ? 0 : Math.min(maxScroll, list.scrollTop + 148), behavior });
      playSound("tap");
    });
    updateLabel();
  }

  function attachMediaErrorHandlers() {
    stage.querySelectorAll(".media-frame img, .slideshow-photo").forEach(img => {
      img.addEventListener("error", () => {
        const frame = img.closest(".media-frame");
        const moment = currentMoment();
        if (img.classList.contains("slideshow-photo")) {
          const photoIndex = Math.max(0, Math.min((moment.media || []).length - 1, slideshowIndices.get(moment.id) || 0));
          const photo = moment.media && moment.media[photoIndex];
          if (photo) img.replaceWith(document.createRange().createContextualFragment(renderSlideshowPhoto({ ...photo, src: "" }, photoIndex)));
          return;
        }
        if (!frame || frame.dataset.fallbackShown === "true") return;
        frame.dataset.fallbackShown = "true";
        const mediaIndex = Number(frame.dataset.mediaIndex);
        const media = Array.isArray(moment.media) ? moment.media[mediaIndex] : null;
        if (media) frame.innerHTML = renderPlaceholder(media, mediaIndex);
        frame.classList.remove("has-media");
        frame.classList.add("is-placeholder");
      }, { once: true });
    });
  }

  function launchConfetti() {
    if (!stage) return;
    playSound("complete");
    stage.querySelectorAll(".confetti").forEach(piece => piece.remove());
    const confettiColors = ["#d59aa2", "#e7b6a5", "#d9c0e8", "#f2d9aa", "#b8d9d0", "#bb8caa"];
    const total = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 34;
    for (let index = 0; index < total; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = confettiColors[index % confettiColors.length];
      piece.style.setProperty("--drift", `${Math.round(Math.random() * 100 - 50)}px`);
      piece.style.setProperty("--spin", `${Math.round(Math.random() * 540 + 120)}deg`);
      piece.style.animationDelay = `${Math.random() * .8}s`;
      piece.style.opacity = `${Math.random() * .4 + .6}`;
      stage.appendChild(piece);
      window.setTimeout(() => piece.remove(), 3700);
    }
  }

  function heartBurst(anchor) {
    if (!anchor) return;
    const bounds = anchor.getBoundingClientRect();
    const shellBounds = document.getElementById("appShell").getBoundingClientRect();
    ["♡", "✦", "♡", "✧", "♥"].forEach((glyph, index) => {
      const heart = document.createElement("span");
      heart.className = "heart-burst";
      heart.textContent = glyph;
      heart.style.left = `${bounds.left - shellBounds.left + bounds.width / 2 + (index - 2) * 12}px`;
      heart.style.top = `${bounds.top - shellBounds.top + bounds.height / 2}px`;
      heart.style.setProperty("--x", `${(index - 2) * 13}px`);
      heart.style.animationDelay = `${index * .035}s`;
      document.getElementById("appShell").appendChild(heart);
      window.setTimeout(() => heart.remove(), 1000);
    });
  }

  function handleBackgroundPlaceholder(button) {
    pendingBackgroundId = button.dataset.backgroundId || currentMoment().id;
    pendingSlot = null;
    mediaPicker.accept = "image/*";
    mediaPicker.value = "";
    mediaPicker.click();
    showToast("Choose a photo of Mako or the rooftop for this background. ♡");
  }

  function handlePlaceholder(slot) {
    pendingBackgroundId = null;
    mediaPicker.accept = "image/*,video/*";
    const moment = currentMoment();
    const mediaIndex = Number(slot.closest(".media-frame")?.dataset.mediaIndex ?? slot.dataset.emptySlot ?? 0);
    const media = Array.isArray(moment.media) ? moment.media[mediaIndex] : null;
    pendingSlot = { momentId: moment.id, mediaIndex };
    mediaPicker.value = "";
    mediaPicker.click();
    if (media) showToast("Choose a photo or video to preview this memory.");
  }

  function mediaToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleLocalPreview(file) {
    if (!file) return;
    if (pendingBackgroundId) {
      if (!file.type.startsWith("image/")) {
        showToast("Please choose a photo for the background.");
        pendingBackgroundId = null;
        mediaPicker.accept = "image/*,video/*";
        return;
      }
      const target = story.find(item => item.id === pendingBackgroundId);
      if (!target) return;
      const objectUrl = URL.createObjectURL(file);
      localPreviewUrls.push(objectUrl);
      target.backgroundSrc = objectUrl;
      pendingBackgroundId = null;
      mediaPicker.accept = "image/*,video/*";
      render();
      showToast("Background preview added! Add the photo to /media and set backgroundSrc in story.js to publish it. ♡");
      return;
    }
    if (!pendingSlot) return;
    const { momentId, mediaIndex } = pendingSlot;
    const moment = story.find(item => item.id === momentId);
    const media = moment && moment.media && moment.media[mediaIndex];
    if (!media) return;
    const objectUrl = URL.createObjectURL(file);
    localPreviewUrls.push(objectUrl);
    media.src = objectUrl;
    media.type = file.type.startsWith("video/") ? "video" : "image";
    // This is a local preview only. Deployment instructions are in README.md.
    render();
    playSound("reveal");
    showToast("Preview added here! To share it with her, add the file to /media and set its src in story.js. ♡");
  }

  function closeTopLayer() {
    if (!mediaViewer.hidden) closeViewer();
    else if (!mapOverlay.hidden) closeMap();
  }

  // Story navigation: buttons, keyboard, clickable progress, and touch swipes.
  soundButton.addEventListener("click", () => {
    unbindMusicGesture();
    playSound("tap");
    toggleBackgroundMusic();
  });
  backButton.addEventListener("click", previous);
  nextButton.addEventListener("click", next);
  brandButton.addEventListener("click", () => { playSound("tap"); goTo(0); });
  mapButton.addEventListener("click", () => { playSound("tap"); openMap(); });
  mapClose.addEventListener("click", () => { playSound("tap"); closeMap(); });
  viewerClose.addEventListener("click", () => { playSound("tap"); closeViewer(); });
  mediaPicker.addEventListener("change", event => handleLocalPreview(event.target.files && event.target.files[0]));

  progressTrack.addEventListener("click", event => {
    const button = event.target.closest("[data-go]");
    if (button) goTo(Number(button.dataset.go));
  });
  mapList.addEventListener("click", event => {
    const button = event.target.closest("[data-go]");
    if (button) goTo(Number(button.dataset.go));
  });
  stage.addEventListener("click", async event => {
    const photoExpand = event.target.closest("[data-expand-wish-photo]");
    if (photoExpand) {
      const image = photoExpand.querySelector("img");
      if (image) openViewer(image.src, "image", image.alt || "Birthday guestbook photo");
      return;
    }
    const copyLinkButton = event.target.closest("[data-copy-wishes-link]");
    if (copyLinkButton) {
      const url = new URL("wishes.html", window.location.href).href;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(url);
        else {
          const helper = document.createElement("textarea"); helper.value = url; helper.setAttribute("readonly", "");
          helper.style.position = "fixed"; helper.style.opacity = "0"; document.body.append(helper); helper.select();
          const copied = document.execCommand("copy"); helper.remove(); if (!copied) throw new Error("copy unavailable");
        }
        showToast("Wishes link copied! Share it with Aya’s friends ✦");
      } catch (_) { showToast("Couldn’t copy automatically — copy this page URL from the address bar."); }
      return;
    }
    const saveReplyButton = event.target.closest("[data-admin-save]");
    if (saveReplyButton) {
      const wishId = saveReplyButton.dataset.adminSave;
      const card = saveReplyButton.closest("[data-wish-card]");
      const replyInput = card && card.querySelector("[data-admin-reply]");
      if (!window.BirthdayGuestbook || typeof window.BirthdayGuestbook.updateWish !== "function") { showToast("Guestbook service is still loading. Try again in a moment."); return; }
      saveReplyButton.disabled = true;
      try {
        await window.BirthdayGuestbook.updateWish(wishId, { reply: replyInput ? replyInput.value : "" });
        showToast("Reply saved ✦");
      } catch (error) {
        console.error("Could not save Aya’s reply", error);
        showToast("Couldn’t save the reply. Check Firestore rules and try again.");
      } finally { saveReplyButton.disabled = false; }
      return;
    }
    const hideWishButton = event.target.closest("[data-admin-hide]");
    if (hideWishButton) {
      const wishId = hideWishButton.dataset.adminHide;
      const nextHidden = hideWishButton.dataset.hidden !== "true";
      if (!window.BirthdayGuestbook || typeof window.BirthdayGuestbook.updateWish !== "function") { showToast("Guestbook service is still loading. Try again in a moment."); return; }
      hideWishButton.disabled = true;
      try {
        await window.BirthdayGuestbook.updateWish(wishId, { hidden: nextHidden });
        showToast(nextHidden ? "Message hidden from the public page." : "Message is visible again.");
      } catch (error) {
        console.error("Could not update guestbook visibility", error);
        showToast("Couldn’t update visibility. Check Firestore rules and try again.");
      } finally { hideWishButton.disabled = false; }
      return;
    }
    const wishesJump = event.target.closest("[data-wishes-slide]");
    if (wishesJump) {
      const targetIndex = story.findIndex(item => item.id === "birthday-wishes");
      if (targetIndex >= 0) goTo(targetIndex);
      return;
    }
    const backgroundButton = event.target.closest(".background-photo-button");
    if (backgroundButton) { handleBackgroundPlaceholder(backgroundButton); return; }
    const slideshowNav = event.target.closest("[data-slide-nav]");
    if (slideshowNav) { navigateSlideshow(Number(slideshowNav.dataset.slideNav)); return; }
    const slideshowProgress = event.target.closest("[data-photo-index]");
    if (slideshowProgress) {
      const moment = currentMoment();
      const targetPhoto = Number(slideshowProgress.dataset.photoIndex);
      if (moment.layout === "slideshow" && Number.isInteger(targetPhoto)) { slideshowIndices.set(moment.id, targetPhoto); playSound("slide"); render(); }
      return;
    }
    const birthdayGreeting = event.target.closest(".birthday-greeting");
    if (birthdayGreeting) { playSound("open"); advanceBirthdayGreeting(); return; }
    const catEaster = event.target.closest(".cat-easter");
    if (catEaster) { playSound("reveal"); collectBonusHeart(catEaster); return; }
    const tinyInteractive = event.target.closest(".tiny-interactive");
    if (tinyInteractive) { collectBonusHeart(tinyInteractive); return; }
    const lyricCard = event.target.closest(".lore-lyric, .cover-lyric");
    if (lyricCard) { playSound("open"); lyricCard.classList.remove("is-remembered"); void lyricCard.offsetWidth; lyricCard.classList.add("is-remembered"); return; }
    const placeholder = event.target.closest(".media-placeholder, .slideshow-placeholder");
    if (placeholder) {
      playSound("open");
      handlePlaceholder(placeholder);
      return;
    }
    const frame = event.target.closest(".media-frame.has-media");
    if (!frame) return;
    if (event.target.tagName.toLowerCase() === "video") return;
    playSound("open");
    openViewer(frame.dataset.mediaSrc, frame.dataset.mediaType, frame.dataset.mediaLabel);
  });
  stage.addEventListener("keydown", event => {
    const placeholder = event.target.closest(".media-placeholder, .slideshow-placeholder");
    if (placeholder && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      handlePlaceholder(placeholder);
    }
  });
  mapOverlay.addEventListener("click", event => { if (event.target === mapOverlay) closeMap(); });
  mediaViewer.addEventListener("click", event => { if (event.target === mediaViewer || event.target === viewerContent) closeViewer(); });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeTopLayer(); return; }
    if (!mapOverlay.hidden || !mediaViewer.hidden) return;
    if (currentMoment().layout === "slideshow" && event.key === "ArrowRight") { event.preventDefault(); navigateSlideshow(1); return; }
    if (currentMoment().layout === "slideshow" && event.key === "ArrowLeft") { event.preventDefault(); navigateSlideshow(-1); return; }
    if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); next(); }
    if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); previous(); }
    if (event.key === "Home") { event.preventDefault(); goTo(0); }
    if (event.key === "End") { event.preventDefault(); goTo(story.length - 1); }
  });

  stage.addEventListener("touchstart", event => {
    if (event.touches.length !== 1 || event.target.closest("button, video, .copy-scroll, .media-frame")) return;
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener("touchend", event => {
    if (!touchStart || !event.changedTouches.length) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.x;
    const dy = end.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (dx < 0) next(); else previous();
    }
  }, { passive: true });

  document.addEventListener("birthdayguestbook-ready", () => {
    if (currentMoment() && currentMoment().layout === "birthday-wishes") startGuestbookWatch();
  });

  syncMusicButton();
  window.setInterval(updateRelationshipClock, 1000);
  preloadStoryAssets().finally(() => render());
})();
