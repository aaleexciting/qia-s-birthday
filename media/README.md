# Your memories go here ♡

Put photos and videos in this folder, then set their relative `src` paths in `story.js`. Add the background soundtrack as `background-music.mp3`; it starts after the first interaction and loops until paused with the music-note button. The soundtrack is intentionally not included in this project.

The `memory-flashback` chapter (right after the sidang moment) is an open-ended story-style photo slideshow. Add as many entries as needed to its `media` array. Each entry can define a file path, date, caption, label, and fit. The progress segments and photo count update automatically.

For the May 1 train moment, use a train-window, station, or shared-earphones photo rather than a photo of her asleep. The story text keeps that memory private while still celebrating it.


No separate files are needed for interface sound effects. The tap, transition, reveal, and heart sounds are synthesized lightly in `app.js` using the browser's Web Audio API. The background music is separate and remains user-supplied.
