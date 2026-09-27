

(function () {
  'use strict';
  var TEXT = document.querySelector('.hero-anim .text');
  var BTN  = document.getElementById('replay');
  if (!TEXT || !BTN) return;

  function split(el){
    var raw = el.textContent;
    el.textContent = '';
    var nodes = [];
    for (var i = 0; i < raw.length; i++) {
      var ch = raw[i];
      var s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(s);
      nodes.push(s);
    }
    return nodes;
  }

  function run(fn){ fn(); BTN.onclick = fn; }
  var _raf = null;
  var _cleanup = function(){};

  function loop(onTick, cleanup){
    cancelAnimationFrame(_raf); _cleanup();
    _cleanup = cleanup || function(){};
    function tick(){ if (!onTick()) _raf = requestAnimationFrame(tick); }
    _raf = requestAnimationFrame(tick);
  }

  function gravity_bounce(){
    var chars = split(TEXT);
    var GRAVITY = 0.9, BOUNCE = 0.42;
    var st = chars.map(function(_, i){
      return { pos: -(60 + i*12), vel: 0, settled: false, op: 0, opv: 0 };
    });
    var f = 0;

    loop(function(){
      f++; var done = true;
      chars.forEach(function(ch, i){
        if (f < i*4) { done = false; return; }
        var s = st[i];
        if (!s.settled) {
          s.vel += GRAVITY; s.pos += s.vel;
          if (s.pos >= 0) {
            s.pos = 0; s.vel *= -BOUNCE;
            if (Math.abs(s.vel) < 1.0) { s.vel = 0; s.settled = true; }
            else done = false;
          } else done = false;
        }
        s.opv += (1 - s.op) * 0.07;
        s.opv *= 0.78;
        s.op  += s.opv;
        ch.style.transform = 'translateY(' + s.pos + 'px)';
        ch.style.opacity   = s.op;
      });
      return done;
    });
  }
  run(gravity_bounce);
})();


