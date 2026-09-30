(() => {
  'use strict';
  const video = document.querySelector('#stylelock-reel');
  const toggle = document.querySelector('.video-toggle');
  const soundToggle = document.querySelector('.sound-toggle');
  if (!video || !toggle || !soundToggle) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let audioContext = null;
  let audioSource = null;
  let gainNode = null;
  let audioGraphReady = false;
  let pausedByUser = false;
  let soundOn = false;
  let autoplayTried = false;
  let visible = false;
  const load = () => {
    if (!video.getAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }
  };
  const enableReducedSound = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        if (!audioContext) audioContext = new AudioContextClass();
        if (!audioSource) audioSource = audioContext.createMediaElementSource(video);
        if (!gainNode) {
          gainNode = audioContext.createGain();
          gainNode.gain.value = 0.15;
        }
        if (!audioGraphReady) {
          audioSource.connect(gainNode);
          gainNode.connect(audioContext.destination);
          audioGraphReady = true;
        }
        if (audioContext.state === 'suspended') await audioContext.resume();
        try { video.volume = 1; } catch { /* The gain node controls the audible level. */ }
        return true;
      } catch {
        if (audioSource) return false;
      }
    }
    try {
      video.volume = 0.15;
      return video.volume === 0.15;
    } catch {
      return false;
    }
  };
  const sync = () => {
    toggle.innerHTML = video.paused ? 'Play film <span aria-hidden="true">▷</span>' : 'Pause film <span aria-hidden="true">Ⅱ</span>';
    toggle.setAttribute('aria-label', video.paused ? 'Play StyleLock film' : 'Pause StyleLock film');
    soundToggle.innerHTML = `<span aria-hidden="true">SOUND ${soundOn ? 'ON' : 'OFF'}</span>`;
    soundToggle.setAttribute('aria-label', soundOn ? 'Mute the original reel audio' : 'Enable the original reel audio');
    soundToggle.setAttribute('aria-pressed', String(soundOn));
  };
  const startPlayback = async () => {
    load();
    autoplayTried = true;
    video.muted = !soundOn;
    try { await video.play(); } catch { /* Autoplay denial is a normal browser policy outcome. */ }
    sync();
  };
  const update = () => {
    if (document.hidden || !visible || (motion.matches && !video.paused) || (motion.matches && !autoplayTried) || pausedByUser) {
      video.pause();
      sync();
    } else if (!motion.matches) {
      void startPlayback();
    }
  };
  toggle.hidden = false;
  soundToggle.hidden = false;
  toggle.addEventListener('click', () => {
    if (video.paused) {
      pausedByUser = false;
      void startPlayback();
    } else {
      pausedByUser = true;
      video.pause();
    }
  });
  soundToggle.addEventListener('click', async () => {
    if (soundOn) {
      soundOn = false;
      video.muted = true;
    } else if (await enableReducedSound()) {
      soundOn = true;
      video.muted = false;
    }
    sync();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('error', () => {
    toggle.hidden = true;
    soundToggle.hidden = true;
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible || document.hidden || motion.matches || pausedByUser) {
      video.pause();
      sync();
    } else {
      void startPlayback();
    }
  }, { threshold: 0.15 }).observe(video);
  motion.addEventListener('change', () => {
    if (motion.matches) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      autoplayTried = false;
    }
    sync();
    update();
  });
  document.addEventListener('visibilitychange', update);
  sync();
})();
