let flipBook = null;
let soundEnabled = true;

// Synthesize a realistic paper slide sound using Web Audio API (Zero external MP3 dependencies)
function playPaperSound() {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 0.12; // 120ms duration
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate white noise burst
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter to simulate paper rustle
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.Q.setValueAtTime(3.0, audioCtx.currentTime);

    // Envelope
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    whiteNoise.start();
  } catch (e) {
    // AudioContext blocked until first user interaction
  }
}

// Sound toggle
document.getElementById('audio-toggle').addEventListener('click', (e) => {
  soundEnabled = !soundEnabled;
  e.target.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
});

// Initialize Flipbook
window.addEventListener('DOMContentLoaded', () => {
  const bookElement = document.getElementById('book');

  // PageFlip initialization
  flipBook = new St.PageFlip(bookElement, {
    width: 420,             // Single page base width
    height: 580,            // Single page base height
    size: 'stretch',        // Responsively scales to fit screens
    minWidth: 320,
    maxWidth: 550,
    minHeight: 460,
    maxHeight: 750,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: false
  });

  // Load all pages from HTML DOM
  flipBook.loadFromHTML(document.querySelectorAll('.page'));

  // Trigger sound on turn
  flipBook.on('flip', (e) => {
    playPaperSound();
    updateActiveTabs(e.data);
  });

  // Tab navigation handler
  const tabs = document.querySelectorAll('.bookmark-tabs .tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPage = parseInt(tab.getAttribute('data-page'), 10);
      flipBook.flip(targetPage);
    });
  });

  function updateActiveTabs(currentPageIndex) {
    tabs.forEach(tab => {
      const pageNum = parseInt(tab.getAttribute('data-page'), 10);
      // Mark tab active if viewing the corresponding spread
      if (currentPageIndex >= pageNum && currentPageIndex < pageNum + 2) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }
});