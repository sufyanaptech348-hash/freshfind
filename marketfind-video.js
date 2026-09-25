/* ============================================================
   BACKGROUND VIDEO — autoplay safety net
   Extracted from marketfind.html — keep in sync with the page.
   ============================================================ */

(function () {
  'use strict';

  var video = document.querySelector('.page-background-video');
  if (!video) return;

  // Reduced motion: the CSS hides the video, so don't start it.
  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (prefersReduced) {
    video.pause();
    video.removeAttribute('autoplay');
    return;
  }

  function tryPlay() {
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  // If the source fails, hide the video so the cream gradient shows through.
  video.addEventListener('error', function () { video.style.display = 'none'; }, true);

  tryPlay();
  video.addEventListener('canplay', tryPlay);
  video.addEventListener('loadeddata', tryPlay);

  // Strict autoplay policies need a user gesture — retry on first interaction.
  ['click', 'touchstart', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, tryPlay, { once:true, passive:true });
  });

  // Pause when the tab is hidden to save battery.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause();
    else tryPlay();
  });
})();
