/* ============================================================
   Sri Lankan Traditional Wedding Invitation — App Logic
   Features: Guest personalization, envelope animation, floating
   petals, countdown, audio, RSVP WhatsApp, calendar, gallery
   ============================================================ */

(function () {
  'use strict';

  // ── CONFIG (Easily editable by couple) ──
  const CONFIG = {
    groomName: 'කසුන්',
    groomNameEn: 'Kasun',
    brideName: 'සඳුනි',
    brideNameEn: 'Sanduni',
    weddingDate: '2026-12-20T07:00:00+05:30',
    weddingEndDate: '2026-12-20T15:00:00+05:30',
    venueName: 'Waters Edge',
    venueAddress: '316, Ethul Kotte Road, Battaramulla, Sri Lanka',
    whatsappNumber: '94774559982', // Replace with actual number (no + prefix)
    googleCalendarTitle: 'කසුන් ❤ සඳුනි මංගල උත්සවය',
    googleCalendarLocation: 'Waters Edge, 316 Ethul Kotte Road, Battaramulla',
  };

  // ── DOM Elements ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loadingScreen = $('#loadingScreen');
  const envelopeCover = $('#envelopeCover');
  const openEnvelopeBtn = $('#openEnvelopeBtn');
  const invitationContent = $('#invitationContent');
  const envelopeGuestName = $('#envelopeGuestName');
  const audioPlayer = $('#audioPlayer');
  const audioIcon = $('#audioIcon');
  const petalsCanvas = $('#petals-canvas');

  // ── GUEST NAME FROM URL ──
  function getGuestName() {
    const params = new URLSearchParams(window.location.search);
    let name = params.get('to') || params.get('guest') || params.get('name');
    if (name) {
      return decodeURIComponent(name.replace(/\+/g, ' '));
    }
    return null;
  }

  function setGuestName() {
    const guestName = getGuestName();
    if (guestName && envelopeGuestName) {
      envelopeGuestName.textContent = guestName + ' වෙත';
    }
    // Also pre-fill RSVP name
    const rsvpNameInput = $('#rsvpName');
    if (guestName && rsvpNameInput) {
      rsvpNameInput.value = guestName;
    }
  }

  // ── LOADING SCREEN ──
  function hideLoadingScreen() {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 1800);
  }

  // ── ENVELOPE OPEN ──
  let isEnvelopeOpened = false;

  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    envelopeCover.classList.add('opened');
    invitationContent.classList.add('visible');

    // Start petals
    setTimeout(initPetals, 500);

    // Show audio player
    setTimeout(() => {
      audioPlayer.classList.add('visible');
      playAudio();
    }, 1000);

    // Trigger scroll reveals
    setTimeout(initScrollReveal, 800);

    // Start countdown
    startCountdown();

    // Init sparkles
    setTimeout(createSparkles, 1200);
  }

  // ── AUDIO (Ambient Sitar / Flute — using Web Audio API for a gentle tone) ──
  let audioCtx = null;
  let isPlaying = false;
  let audioNodes = [];

  function createAmbientTone() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Create a gentle, soothing ambient pad
    const notes = [261.63, 329.63, 392.0, 493.88]; // C4, E4, G4, B4
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 2);
    masterGain.connect(audioCtx.destination);

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // Gentle vibrato
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.3 + i * 0.1, audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(2, audioCtx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0.25 - i * 0.04, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();

      audioNodes.push({ osc, gain, lfo, lfoGain });
    });

    audioNodes.push({ masterGain });
    return masterGain;
  }

  function playAudio() {
    try {
      createAmbientTone();
      isPlaying = true;
      audioPlayer.classList.add('playing');
      audioIcon.textContent = '🎵';
    } catch (e) {
      console.log('Audio playback not available');
    }
  }

  function stopAudio() {
    if (audioCtx) {
      audioNodes.forEach((node) => {
        if (node.osc) { try { node.osc.stop(); } catch (e) { } }
        if (node.lfo) { try { node.lfo.stop(); } catch (e) { } }
      });
      audioNodes = [];
      isPlaying = false;
      audioPlayer.classList.remove('playing');
      audioIcon.textContent = '🔇';
    }
  }

  function toggleAudio() {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  }

  // ── FLOATING PETALS (Canvas Animation) ──
  let petals = [];
  let petalsAnimId = null;

  class Petal {
    constructor(canvas) {
      this.canvas = canvas;
      this.x = Math.random() * canvas.width;
      this.y = -20 - Math.random() * 100;
      this.size = 8 + Math.random() * 14;
      this.speedY = 0.5 + Math.random() * 1.2;
      this.speedX = -0.3 + Math.random() * 0.6;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = -0.02 + Math.random() * 0.04;
      this.opacity = 0.3 + Math.random() * 0.5;
      this.swayAmplitude = 20 + Math.random() * 40;
      this.swaySpeed = 0.005 + Math.random() * 0.01;
      this.swayOffset = Math.random() * Math.PI * 2;
      this.color = this.getColor();
    }

    getColor() {
      const colors = [
        // Champagne Gold Dust Glow
        { r: 255, g: 232, b: 156 },
        { r: 212, g: 175, b: 55 },
        // Soft Lotus Pink
        { r: 240, g: 190, b: 195 },
        // Warm White / Ivory Glow
        { r: 255, g: 248, b: 240 },
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    update(time) {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(time * this.swaySpeed + this.swayOffset) * 0.6;
      this.rotation += this.rotationSpeed;

      if (this.y > this.canvas.height + 20) {
        this.y = -20;
        this.x = Math.random() * this.canvas.width;
      }
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;

      // Glow effect for golden particles
      if (this.color.r === 255 || this.color.r === 212) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.6)`;
      }

      // Draw modern rounded petal / sparkle shape
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
      ctx.fill();

      ctx.restore();
    }
  }

  function initPetals() {
    const canvas = petalsCanvas;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const petalCount = Math.min(35, Math.floor(window.innerWidth / 30));
    for (let i = 0; i < petalCount; i++) {
      petals.push(new Petal(canvas));
    }

    let startTime = Date.now();

    function animate() {
      const time = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.update(time);
        p.draw(ctx, time);
      });
      petalsAnimId = requestAnimationFrame(animate);
    }
    animate();
  }

  // ── COUNTDOWN TIMER ──
  let countdownInterval = null;

  function startCountdown() {
    const targetDate = new Date(CONFIG.weddingDate).getTime();

    function update() {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        $('#countDays').textContent = '00';
        $('#countHours').textContent = '00';
        $('#countMinutes').textContent = '00';
        $('#countSeconds').textContent = '00';
        clearInterval(countdownInterval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const daysEl = $('#countDays');
      const hoursEl = $('#countHours');
      const minutesEl = $('#countMinutes');
      const secondsEl = $('#countSeconds');

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    update();
    countdownInterval = setInterval(update, 1000);
  }

  // ── SCROLL REVEAL ──
  function initScrollReveal() {
    const revealElements = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  // ── SPARKLES ──
  function createSparkles() {
    const container = $('#heroSparkles');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.animationDelay = Math.random() * 3 + 's';
      sparkle.style.animationDuration = 2 + Math.random() * 2 + 's';
      container.appendChild(sparkle);
    }
  }

  // ── GALLERY ──
  function initGallery() {
    const grid = $('#galleryGrid');
    if (!grid) return;

    // Generate beautiful gradient placeholder images
    const gradients = [
      'linear-gradient(135deg, #E8B4B8 0%, #C9A84C 100%)',
      'linear-gradient(135deg, #4A0E17 0%, #C9A84C 100%)',
      'linear-gradient(135deg, #F0D5C8 0%, #D4836B 100%)',
      'linear-gradient(135deg, #722F37 0%, #E8D48B 100%)',
      'linear-gradient(135deg, #C9A84C 0%, #FFF8F0 100%)',
      'linear-gradient(135deg, #5C1A25 0%, #F5E6A3 100%)',
    ];

    const labels = ['💕', '💍', '🌸', '✨', '🪷', '🎊'];

    gradients.forEach((grad, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.background = grad;
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'center';
      item.style.fontSize = '2rem';
      item.textContent = labels[i];
      item.title = 'ඡායාරූපය ' + (i + 1);

      item.addEventListener('click', () => {
        // For placeholder, just show a zoomed version
        const lightbox = $('#lightbox');
        const lightboxImg = $('#lightboxImg');
        // Create a canvas-based snapshot
        lightboxImg.style.display = 'none';
        lightbox.style.display = 'flex';
        lightbox.style.alignItems = 'center';
        lightbox.style.justifyContent = 'center';

        // Create a styled preview
        let preview = lightbox.querySelector('.lightbox-preview');
        if (!preview) {
          preview = document.createElement('div');
          preview.className = 'lightbox-preview';
          preview.style.cssText = `
            width: 80vw; max-width: 400px; height: 80vw; max-height: 400px;
            border-radius: 16px; display: flex; align-items: center;
            justify-content: center; font-size: 5rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          `;
          lightbox.appendChild(preview);
        }
        preview.style.background = grad;
        preview.textContent = labels[i];

        lightbox.classList.add('active');
      });

      grid.appendChild(item);
    });
  }

  // ── LIGHTBOX ──
  function initLightbox() {
    const lightbox = $('#lightbox');
    const lightboxClose = $('#lightboxClose');

    function closeLightbox() {
      lightbox.classList.remove('active');
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
    }
  }

  // ── WHATSAPP RSVP ──
  function initRsvp() {
    const btnRsvp = $('#btnRsvpWhatsapp');
    if (!btnRsvp) return;

    btnRsvp.addEventListener('click', () => {
      const name = $('#rsvpName').value.trim() || 'ආරාධිතයා';
      const attend = $('#rsvpAttend').value;
      const guests = $('#rsvpGuests').value;

      if (!attend) {
        alert('කරුණාකර සහභාගිත්වය තෝරන්න');
        return;
      }

      const attendText = attend === 'yes' ? 'සහභාගී වෙමි ✅' : 'සහභාගී වීමට නොහැක ❌';

      const message = `💍 *මංගල ආරාධනය තහවුරු කිරීම*

👤 නම: ${name}
📋 සහභාගිත්වය: ${attendText}
👥 පැමිණෙන සංඛ්‍යාව: ${guests}

_${CONFIG.groomName} ❤ ${CONFIG.brideName} මංගල උත්සවය_
📅 2026 දෙසැම්බර් 20
🏛️ ${CONFIG.venueName}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    });
  }

  // ── WHATSAPP WISHES ──
  function initWishes() {
    const btnWishes = $('#btnSendWishes');
    if (!btnWishes) return;

    btnWishes.addEventListener('click', () => {
      const wishes = $('#wishesText').value.trim();
      const guestName = getGuestName() || $('#rsvpName').value.trim() || '';

      if (!wishes) {
        alert('කරුණාකර ඔබගේ සුබ පැතුම් ලියන්න');
        return;
      }

      const message = `🌸 *සුබ පැතුම්*

${guestName ? '👤 ' + guestName + ' වෙතින්\n\n' : ''}💌 ${wishes}

_${CONFIG.groomName} ❤ ${CONFIG.brideName} මංගල උත්සවයට සුබ පැතුම්_ 🎊`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    });
  }

  // ── ADD TO CALENDAR ──
  function initCalendar() {
    const btnCalendar = $('#btnAddCalendar');
    if (!btnCalendar) return;

    btnCalendar.addEventListener('click', () => {
      // Google Calendar link
      const startDate = new Date(CONFIG.weddingDate);
      const endDate = new Date(CONFIG.weddingEndDate);

      const formatGCalDate = (d) => {
        return d.toISOString().replace(/-|:|\.\d{3}/g, '');
      };

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(CONFIG.googleCalendarTitle)}&dates=${formatGCalDate(startDate)}/${formatGCalDate(endDate)}&details=${encodeURIComponent('කසුන් සහ සඳුනිගේ මංගල උත්සවය\nපෝරු මංගල්‍යය: පෙ.ව. 8:15\nසංග්‍රහය: ප.ව. 12:00')}&location=${encodeURIComponent(CONFIG.googleCalendarLocation)}`;

      window.open(gcalUrl, '_blank');
    });
  }

  // ── SMOOTH SCROLL FOR INTERNAL LINKS ──
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── COUPLE PHOTO PLACEHOLDERS ──
  function initCouplePhotos() {
    // Photos are set directly in HTML src attributes
    // No placeholder generation needed
  }

  // ── PARALLAX SUBTLE EFFECT ──
  function initParallax() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const hero = $('.hero-section');
          if (hero) {
            hero.style.backgroundPositionY = `${scrollY * 0.3}px`;
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── INITIALIZE ──
  function init() {
    // Set guest name from URL
    setGuestName();

    // Hide loading screen
    hideLoadingScreen();

    // Envelope button
    if (openEnvelopeBtn) {
      openEnvelopeBtn.addEventListener('click', openEnvelope);
    }

    // Also open on envelope click
    if (envelopeCover) {
      envelopeCover.addEventListener('click', (e) => {
        if (e.target === envelopeCover || e.target.closest('.envelope-cover')) {
          openEnvelope();
        }
      });
    }

    // Audio toggle
    if (audioPlayer) {
      audioPlayer.addEventListener('click', toggleAudio);
    }

    // Gallery
    initGallery();
    initLightbox();

    // RSVP & Wishes
    initRsvp();
    initWishes();

    // Calendar
    initCalendar();

    // Couple photos
    initCouplePhotos();

    // Smooth scroll
    initSmoothScroll();

    // Parallax
    initParallax();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
