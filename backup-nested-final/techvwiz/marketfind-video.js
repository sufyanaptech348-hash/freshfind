

(function () {
  'use strict';

  var video = document.querySelector('.page-background-video');
  if (!video) return;

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

  video.addEventListener('error', function () { video.style.display = 'none'; }, true);

  tryPlay();
  video.addEventListener('canplay', tryPlay);
  video.addEventListener('loadeddata', tryPlay);

  ['click', 'touchstart', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, tryPlay, { once:true, passive:true });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause();
    else tryPlay();
  });
})();


