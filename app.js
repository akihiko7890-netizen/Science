/**
 * Grade 6 Science Chapter 6: Reproduction (မျိုးပွားခြင်း)
 * Core Interactive Engine: Web Audio API SFX, localStorage Star Tracker,
 * Interactive Labs, Concept Map, and Quiz Arena.
 */

const STORAGE_KEYS = {
  stars: 'g6_repro_stars',
  discoveries: 'g6_repro_discoveries',
  muted: 'g6_repro_muted',
  quizBest: 'g6_repro_quiz_best',
};

const TOTAL_DISCOVERIES = 30;

const memoryStore = {};
const safeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    }
  },
  set(key, val) {
    memoryStore[key] = String(val);
    try {
      window.localStorage.setItem(key, String(val));
    } catch {
      // Ignore SecurityError when opened directly via file:// in restricted mode
    }
  },
  remove(key) {
    delete memoryStore[key];
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

// ---------- State Management ----------
function getStars() {
  return parseInt(safeStorage.get(STORAGE_KEYS.stars) || '0', 10) || 0;
}

function getDiscoveries() {
  try {
    const raw = safeStorage.get(STORAGE_KEYS.discoveries);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isMuted() {
  return safeStorage.get(STORAGE_KEYS.muted) === 'true';
}

function setMuted(val) {
  safeStorage.set(STORAGE_KEYS.muted, val ? 'true' : 'false');
}

function updateHud() {
  const starEl = document.getElementById('hud-star-count');
  if (starEl) {
    starEl.textContent = String(getStars());
  }
  const soundBtn = document.getElementById('hud-sound-toggle');
  if (soundBtn) {
    const muted = isMuted();
    soundBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    soundBtn.setAttribute('aria-label', muted ? 'အသံဖွင့်မည်' : 'အသံပိတ်မည်');
    const iconSpan = soundBtn.querySelector('.sound-icon');
    const labelSpan = soundBtn.querySelector('.sound-label');
    if (iconSpan) iconSpan.textContent = muted ? '🔇' : '🔊';
    if (labelSpan) labelSpan.textContent = muted ? 'အသံပိတ်' : 'အသံဖွင့်';
  }
  const progressFill = document.getElementById('hub-progress-fill');
  const progressText = document.getElementById('hub-progress-text');
  if (progressFill && progressText) {
    const count = getDiscoveries().length;
    const pct = Math.min(100, Math.round((count / TOTAL_DISCOVERIES) * 100));
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${count} / ${TOTAL_DISCOVERIES} ခု ရှာဖွေပြီး (${pct}%)`;
  }
}

// ---------- Web Audio API Sound Generator ----------
let audioCtx = null;

function ensureAudio() {
  if (isMuted()) return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, duration = 0.12, type = 'sine', gainVal = 0.14, delay = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

const SFX = {
  click() {
    playTone(540, 0.08, 'triangle', 0.1);
  },
  star() {
    playTone(659.25, 0.12, 'sine', 0.14, 0);
    playTone(880, 0.18, 'sine', 0.15, 0.09);
  },
  success() {
    playTone(523.25, 0.12, 'triangle', 0.14, 0);
    playTone(659.25, 0.12, 'triangle', 0.14, 0.1);
    playTone(783.99, 0.22, 'triangle', 0.16, 0.2);
  },
  error() {
    playTone(260, 0.14, 'sawtooth', 0.08, 0);
    playTone(210, 0.18, 'sawtooth', 0.08, 0.12);
  },
  celebrate() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => playTone(n, 0.2, 'triangle', 0.15, i * 0.09));
  },
};

// ---------- Toast & Star Awards ----------
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  const item = document.createElement('div');
  item.className = 'toast-item';
  item.textContent = message;
  container.appendChild(item);
  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(-6px)';
    item.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(() => item.remove(), 220);
  }, 2600);
}

function awardDiscovery(id, stars = 1, message = '') {
  const discoveries = getDiscoveries();
  if (!discoveries.includes(id)) {
    discoveries.push(id);
    safeStorage.set(STORAGE_KEYS.discoveries, JSON.stringify(discoveries));
    const total = getStars() + stars;
    safeStorage.set(STORAGE_KEYS.stars, String(total));
    updateHud();
    SFX.star();
    showToast(message ? `⭐ +${stars} ကြယ်ရရှိ! — ${message}` : `⭐ +${stars} စူးစမ်းလေ့လာကြယ် ရရှိပါပြီ!`);
    return true;
  }
  return false;
}

function addBonusStars(stars, message) {
  const total = getStars() + stars;
  safeStorage.set(STORAGE_KEYS.stars, String(total));
  updateHud();
  SFX.star();
  if (message) {
    showToast(`⭐ +${stars} — ${message}`);
  }
}

// ---------- Shared Reveal Toggles & Classifiers ----------
function initRevealButtons() {
  document.querySelectorAll('[data-reveal-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-reveal-target');
      const box = targetId ? document.getElementById(targetId) : null;
      if (!box) return;
      const isHidden = box.hasAttribute('hidden');
      if (isHidden) {
        box.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        const awardId = btn.getAttribute('data-discovery-id');
        const awardMsg = btn.getAttribute('data-discovery-msg') || 'သိပ္ပံအချက်အလက်အသစ် တွေ့ရှိပြီ';
        if (awardId) {
          awardDiscovery(awardId, 1, awardMsg);
        } else {
          SFX.click();
        }
      } else {
        box.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        SFX.click();
      }
    });
  });
}

function initClassifiers() {
  document.querySelectorAll('.classify-row').forEach((row) => {
    const answer = row.getAttribute('data-answer');
    const feedback = row.querySelector('.classify-feedback');
    const awardId = row.getAttribute('data-discovery-id');
    row.querySelectorAll('.choice-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const chosen = chip.getAttribute('data-choice');
        row.querySelectorAll('.choice-chip').forEach((c) => {
          c.classList.remove('is-correct', 'is-wrong');
        });
        if (chosen === answer) {
          chip.classList.add('is-correct');
          SFX.success();
          if (feedback) {
            feedback.textContent = `မှန်ကန်ပါသည်! (${chip.textContent.trim()})`;
            feedback.style.color = '#035941';
          }
          if (awardId) {
            awardDiscovery(awardId, 1, 'လေ့ကျင့်ခန်း မှန်ကန်စွာ ဖြေဆိုနိုင်ပြီ');
          }
        } else {
          chip.classList.add('is-wrong');
          SFX.error();
          if (feedback) {
            feedback.textContent = 'ပြန်လည်စဉ်းစားကြည့်ပါဦးနော်။';
            feedback.style.color = '#9E2424';
          }
        }
      });
    });
  });
}

// ---------- Page: Plants (Flower Lab, Spores, Flip Cards) ----------
const FLOWER_PARTS = {
  anther: {
    title: 'ဝတ်မှုန်အိတ် (Anther) — အဖိုဂမိ',
    badge: 'အဖိုမျိုးပွားအင်္ဂါ',
    desc: 'ဝတ်မှုန်အိတ်အတွင်း၌ ဝတ်မှုန် (Pollen) များ ထုတ်လုပ်သိုလှောင်ထားသည်။ ဝတ်မှုန်များထဲတွင် အဖိုဂမိ (Male gamete) ပါဝင်ပါသည်။',
    step: 1,
  },
  pollen: {
    title: 'ဝတ်မှုန် (Pollen) & ဝတ်မှုန်ကူးခြင်း',
    badge: 'မျိုးပွားဆဲလ် သယ်ဆောင်မှု',
    desc: 'လေ၊ အင်းဆက် (ပျား၊ လိပ်ပြာ) သို့မဟုတ် ရေကြောင့် ဝတ်မှုန်များသည် အဖိုဝတ်မှုန်အိတ်မှ အမဝတ်မှုန်ခံထိပ်သို့ ရောက်ရှိခြင်းကို ဝတ်မှုန်ကူးခြင်း (Pollination) ဟုခေါ်သည်။',
    step: 2,
  },
  ovary: {
    title: 'အစေ့အိမ် (Ovary) — အမဂမိ',
    badge: 'အမမျိုးပွားအင်္ဂါ',
    desc: 'ပန်းပွင့်၏ အလယ်ဗဟိုအောက်ခြေတွင် တည်ရှိသော အစေ့အိမ်ထဲ၌ အမဂမိ (Female gamete) ပါရှိသည်။ သန္ဓေအောင်ပြီးနောက် အသီးအဖြစ် ဖွံ့ဖြိုးလာသည်။',
    step: 3,
  },
  ovule: {
    title: 'အစေ့လောင်း (Ovule) → အစေ့ → အပင်သစ်',
    badge: 'သန္ဓေအောင်ခြင်းရလဒ်',
    desc: 'အစေ့အိမ်အတွင်းရှိ အစေ့လောင်းသည် အဖိုဂမိနှင့် အမဂမိ ပေါင်းစပ်သန္ဓေအောင်ပြီးနောက် အစေ့ (Seed) ဖြစ်လာသည်။ မြေကြီး၌ စိုက်ပျိုးသောအခါ အပင်သစ်ပေါက်လာသည်။',
    step: 4,
  },
};

function initPlantsPage() {
  const flowerPanel = document.getElementById('flower-info-panel');
  if (flowerPanel) {
    const titleEl = document.getElementById('flower-part-title');
    const badgeEl = document.getElementById('flower-part-badge');
    const descEl = document.getElementById('flower-part-desc');
    const stepEls = document.querySelectorAll('.flow-step');

    const selectPart = (partKey) => {
      const info = FLOWER_PARTS[partKey];
      if (!info) return;
      if (titleEl) titleEl.textContent = info.title;
      if (badgeEl) badgeEl.textContent = info.badge;
      if (descEl) descEl.textContent = info.desc;

      document.querySelectorAll('[data-flower-part]').forEach((el) => {
        const match = el.getAttribute('data-flower-part') === partKey;
        el.classList.toggle('is-selected', match);
        el.classList.toggle('is-active', match);
      });

      stepEls.forEach((stepEl) => {
        const idx = parseInt(stepEl.getAttribute('data-step') || '0', 10);
        stepEl.classList.toggle('is-lit', idx <= info.step);
      });

      awardDiscovery(`flower_${partKey}`, 1, info.title);
      SFX.click();
    };

    document.querySelectorAll('[data-flower-part]').forEach((el) => {
      el.addEventListener('click', () => {
        selectPart(el.getAttribute('data-flower-part'));
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectPart(el.getAttribute('data-flower-part'));
        }
      });
    });

    const pollBtn = document.getElementById('btn-simulate-pollination');
    const pollenParticle = document.getElementById('sim-pollen-dot');
    if (pollBtn && pollenParticle) {
      pollBtn.addEventListener('click', () => {
        SFX.click();
        pollenParticle.style.transition = 'none';
        pollenParticle.style.transform = 'translate(0px, 0px) scale(1)';
        pollenParticle.style.opacity = '1';
        pollenParticle.setAttribute('opacity', '1');
        // Force reflow so repeat animations replay reliably in Chrome
        void pollenParticle.getBoundingClientRect();
        requestAnimationFrame(() => {
          pollenParticle.style.transition = 'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease';
          pollenParticle.style.transform = 'translate(78px, 111px) scale(1.25)';
        });
        setTimeout(() => {
          selectPart('ovule');
          SFX.success();
          awardDiscovery('flower_pollination_sim', 2, 'ဝတ်မှုန်ကူး၍ သန္ဓေအောင်ခြင်း ဖြစ်စဉ်ပြီးဆုံး!');
        }, 1150);
      });
    }
  }

  // Fern Spore Release Button (Figure 6-3)
  const sporeBtn = document.getElementById('btn-release-spores');
  const sporeBox = document.getElementById('spore-status-box');
  if (sporeBtn && sporeBox) {
    sporeBtn.addEventListener('click', () => {
      const dots = document.querySelectorAll('.fern-spore-dot');
      dots.forEach((dot) => {
        dot.style.transition = 'none';
        dot.style.transform = 'translate(0px, 0px) scale(1)';
        dot.style.opacity = '1';
      });
      void sporeBtn.offsetWidth;
      requestAnimationFrame(() => {
        dots.forEach((dot, i) => {
          dot.style.transition = `transform 1.15s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.05}s, opacity 1.15s ease ${i * 0.05}s`;
          const dx = (i % 2 === 0 ? -1 : 1) * (18 + (i % 4) * 14);
          const dy = 52 + (i % 3) * 22;
          dot.style.transform = `translate(${dx}px, ${dy}px) scale(1.35)`;
          dot.style.opacity = '0.15';
        });
      });
      sporeBox.removeAttribute('hidden');
      awardDiscovery('plant_fern_spores', 1, 'ဖန်းပင်၏ စပိုး (Spore) များ ပြန့်ကျဲမျိုးပွားပုံ');
      SFX.success();
    });
  }

  // Figure 6-4 Flip Cards
  document.querySelectorAll('.flip-card').forEach((card) => {
    const toggleFlip = () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
      const id = card.getAttribute('data-discovery-id');
      const msg = card.getAttribute('data-discovery-msg') || 'ပင်ပိုင်းမျိုးပွားခြင်း နမူနာ';
      if (flipped && id) {
        awardDiscovery(id, 1, msg);
      } else {
        SFX.click();
      }
    };
    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFlip();
      }
    });
  });
}

// ---------- Page: Animals (Filter & Fertilization Simulator) ----------
function initAnimalsPage() {
  const filterBtns = document.querySelectorAll('[data-animal-filter]');
  const animalCards = document.querySelectorAll('.animal-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-animal-filter');
      filterBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      animalCards.forEach((card) => {
        const type = card.getAttribute('data-repro-type');
        const show = filter === 'all' || type === filter;
        card.classList.toggle('is-hidden', !show);
      });
      SFX.click();
    });
  });

  // Fertilization Simulator
  const stage = document.getElementById('fert-stage');
  if (!stage) return;
  const modeBtns = document.querySelectorAll('[data-fert-mode]');
  const runBtn = document.getElementById('btn-run-fert');
  const resetBtn = document.getElementById('btn-reset-fert');
  const captionEl = document.getElementById('fert-caption');
  const envBadge = document.getElementById('fert-env-label');
  const zygoteSub = document.getElementById('fert-zygote-sub');

  let currentMode = 'external';
  let simTimeout = null;

  function resetSim() {
    if (simTimeout) clearTimeout(simTimeout);
    stage.classList.remove('is-merging', 'is-fertilized');
    if (currentMode === 'external') {
      stage.classList.add('fert-stage--external');
      stage.classList.remove('fert-stage--internal');
      if (envBadge) envBadge.textContent = 'ရေထဲ / ခန္ဓာကိုယ်ပြင်ပ (ဥပမာ - ငါး၊ ဖား၊ ရေပုတ်သင်)';
      if (captionEl) captionEl.textContent = 'အမမျိုးဥနှင့် အဖိုသုက်ကောင်တို့သည် ခန္ဓာကိုယ်ပြင်ပ (ရေထဲ) တွင် တွေ့ဆုံရန် အသင့်ဖြစ်နေပါသည်။';
      if (zygoteSub) zygoteSub.textContent = 'သန္ဓေအောင်ဥ → ဖားလောင်း → ဖား / ငါး';
    } else {
      stage.classList.add('fert-stage--internal');
      stage.classList.remove('fert-stage--external');
      if (envBadge) envBadge.textContent = 'မိခင်ခန္ဓာကိုယ်အတွင်း (ဥပမာ - လူ၊ မြင်း)';
      if (captionEl) captionEl.textContent = 'အမမျိုးဥနှင့် အဖိုသုက်ကောင်တို့သည် မိခင်၏ခန္ဓာကိုယ်အတွင်း၌ တွေ့ဆုံရန် အသင့်ဖြစ်နေပါသည်။';
      if (zygoteSub) zygoteSub.textContent = 'သန္ဓေအောင်ဥ → သန္ဓေသား → မွေးဖွား';
    }
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentMode = btn.getAttribute('data-fert-mode') || 'external';
      modeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      resetSim();
      SFX.click();
    });
  });

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      resetSim();
      SFX.click();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          stage.classList.add('is-merging');
          if (captionEl) {
            captionEl.textContent = 'အဖိုသုက်ကောင် (Sperm) သည် အမမျိုးဥ (Egg) ထံသို့ ရွေ့လျားပေါင်းစပ်နေပါသည်...';
          }
          simTimeout = setTimeout(() => {
            stage.classList.add('is-fertilized');
            SFX.success();
            if (currentMode === 'external') {
              if (captionEl) {
                captionEl.textContent = 'ပြင်ပသန္ဓေအောင်ခြင်း ပြီးမြောက်ပြီ! သန္ဓေအောင်ဥ (Zygote) မှ ဖားလောင်းနှင့် ဖား/ငါးအဖြစ် ကြီးထွားလာမည်။';
              }
              awardDiscovery('fert_sim_external', 2, 'ပြင်ပသန္ဓေအောင်ခြင်း လက်တွေ့စမ်းသပ်မှု');
            } else {
              if (captionEl) {
                captionEl.textContent = 'အတွင်းသန္ဓေအောင်ခြင်း ပြီးမြောက်ပြီ! မိခင်ကိုယ်တွင်း၌ သန္ဓေအောင်ဥ (Zygote) မှ သန္ဓေသားအဖြစ် ဖွံ့ဖြိုးလာမည်။';
              }
              awardDiscovery('fert_sim_internal', 2, 'အတွင်းသန္ဓေအောင်ခြင်း လက်တွေ့စမ်းသပ်မှု');
            }
          }, 1100);
        });
      });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetSim();
      SFX.click();
    });
  }

  resetSim();
}

// ---------- Page: Concept Map Review (Page 58) ----------
function initConceptMapPage() {
  const blanks = document.querySelectorAll('.cmap-blank');
  if (!blanks.length) return;

  const modeRevealBtn = document.getElementById('btn-mode-reveal');
  const modeQuizBtn = document.getElementById('btn-mode-wordbank');
  const revealAllBtn = document.getElementById('btn-cmap-reveal-all');
  const resetMapBtn = document.getElementById('btn-cmap-reset');
  const wordBankEl = document.getElementById('word-bank');
  const wordTokens = document.querySelectorAll('.word-token');
  const statusEl = document.getElementById('cmap-status');

  let mode = 'reveal'; // 'reveal' | 'wordbank'
  let selectedToken = null;

  function updateStatus() {
    const solved = document.querySelectorAll('.cmap-blank.is-revealed').length;
    if (statusEl) {
      statusEl.textContent = `ဖြည့်စွက်ပြီးစီးမှု: ${solved} / ${blanks.length}`;
    }
    if (solved === blanks.length) {
      awardDiscovery('review_concept_map_complete', 3, 'အခန်း (၆) ခြုံငုံသုံးသပ်ချက် မြေပုံပြီးပြည့်စုံပြီ!');
    }
  }

  function revealBlank(blank) {
    const ans = blank.getAttribute('data-answer') || '';
    blank.textContent = ans;
    blank.classList.add('is-revealed');
    blank.setAttribute('aria-pressed', 'true');
  }

  function resetMap() {
    blanks.forEach((b) => {
      b.classList.remove('is-revealed');
      b.setAttribute('aria-pressed', 'false');
      b.textContent = b.getAttribute('data-placeholder') || 'နှိပ်၍ ဖြည့်ပါ';
    });
    wordTokens.forEach((t) => t.classList.remove('is-selected', 'is-used'));
    selectedToken = null;
    updateStatus();
  }

  if (modeRevealBtn && modeQuizBtn && wordBankEl) {
    modeRevealBtn.addEventListener('click', () => {
      mode = 'reveal';
      modeRevealBtn.classList.add('is-active');
      modeQuizBtn.classList.remove('is-active');
      wordBankEl.setAttribute('hidden', '');
      SFX.click();
    });

    modeQuizBtn.addEventListener('click', () => {
      mode = 'wordbank';
      modeQuizBtn.classList.add('is-active');
      modeRevealBtn.classList.remove('is-active');
      wordBankEl.removeAttribute('hidden');
      resetMap();
      SFX.click();
    });
  }

  wordTokens.forEach((token) => {
    token.addEventListener('click', () => {
      if (token.classList.contains('is-used')) return;
      wordTokens.forEach((t) => t.classList.remove('is-selected'));
      token.classList.add('is-selected');
      selectedToken = token;
      SFX.click();
    });
  });

  blanks.forEach((blank) => {
    blank.addEventListener('click', () => {
      if (blank.classList.contains('is-revealed')) return;
      if (mode === 'reveal') {
        revealBlank(blank);
        SFX.success();
        updateStatus();
      } else {
        if (!selectedToken) {
          showToast('အပေါ်ရှိ စကားလုံးဘဏ်မှ စကားလုံးတစ်ခုကို အရင်ရွေးချယ်ပါ။');
          SFX.click();
          return;
        }
        const chosen = selectedToken.getAttribute('data-word');
        const expected = blank.getAttribute('data-answer');
        if (chosen === expected) {
          revealBlank(blank);
          selectedToken.classList.remove('is-selected');
          selectedToken.classList.add('is-used');
          selectedToken = null;
          SFX.success();
          updateStatus();
        } else {
          SFX.error();
          showToast('ထိုကွက်လပ်နှင့် မကိုက်ညီသေးပါ — နောက်တစ်နေရာ စမ်းကြည့်ပါ။');
        }
      }
    });
  });

  if (revealAllBtn) {
    revealAllBtn.addEventListener('click', () => {
      blanks.forEach(revealBlank);
      wordTokens.forEach((t) => t.classList.add('is-used'));
      SFX.success();
      updateStatus();
    });
  }

  if (resetMapBtn) {
    resetMapBtn.addEventListener('click', () => {
      resetMap();
      SFX.click();
    });
  }

  updateStatus();
}

// ---------- Page: Quiz Arena & Confetti ----------
const QUIZ_QUESTIONS = [
  {
    q: '၁။ သက်ရှိများတွင် ယင်းတို့နှင့် မျိုးစိတ်တူသက်ရှိများကို ပွားများပေးနိုင်သော ဖြစ်စဉ်ကို မည်သို့ခေါ်သနည်း?',
    options: [
      'အသက်ရှူခြင်း (Respiration)',
      'မျိုးပွားခြင်း (Reproduction)',
      'ကြီးထွားခြင်း (Growth)',
      'အာဟာရမှီဝဲခြင်း (Nutrition)',
    ],
    correct: 1,
    explain: 'မှန်ပါသည် — မျိုးစိတ်တူသက်ရှိများကို ပွားများပေးနိုင်သော ဖြစ်စဉ်ကို မျိုးပွားခြင်း (Reproduction) ဟုခေါ်ပါသည်။ (စာမျက်နှာ ၅၃)',
  },
  {
    q: '၂။ ဖန်းပင် (Fern) နှင့် မော့စ်ပင် (Moss) တို့သည် မည်သည့်နည်းလမ်းဖြင့် မျိုးပွားသနည်း?',
    options: [
      'ပန်းပွင့်အစေ့ဖြင့် လိင်ရှိမျိုးပွားခြင်း',
      'အရွက်အောက်မျက်နှာပြင်ရှိ စပိုး (Spores) များဖြင့် လိင်မဲ့မျိုးပွားခြင်း',
      'မြေအောက်ပင်စည်ဖြင့် ပင်ပိုင်းမျိုးပွားခြင်း',
      'ဖူးထွက်ခြင်း (Budding) ဖြင့် မျိုးပွားခြင်း',
    ],
    correct: 1,
    explain: 'မှန်ပါသည် — ဖန်းပင်နှင့် မော့စ်ပင်တို့သည် အရွက်အောက်ရှိ စပိုး (Spores) များဖြင့် လိင်မဲ့မျိုးပွားကြသည်။ (စာမျက်နှာ ၅၅)',
  },
  {
    q: '၃။ ပန်းပွင့်တစ်ပွင့်တွင် အဖိုဂမိ (Male gamete) သည် မည်သည့်အစိတ်အပိုင်း၌ ပါဝင်သနည်း?',
    options: [
      'အစေ့အိမ် (Ovary)',
      'အစေ့လောင်း (Ovule)',
      'ဝတ်မှုန်အိတ်ရှိ ဝတ်မှုန် (Pollen)',
      'ပွင့်ဖတ် (Petal)',
    ],
    correct: 2,
    explain: 'မှန်ပါသည် — ပန်းပွင့်၏ ဝတ်မှုန်အိတ်ထဲရှိ ဝတ်မှုန်တွင် အဖိုဂမိပါဝင်ပြီး အစေ့အိမ်ထဲတွင် အမဂမိ ပါဝင်ပါသည်။ (စာမျက်နှာ ၅၄)',
  },
  {
    q: '၄။ ပန်းပွင့်ရှိ ဝတ်မှုန်အိတ်မှ ဝတ်မှုန်များသည် ဝတ်မှုန်ခံတိုင် (Stigma) ပေါ်သို့ ရောက်ရှိခြင်းကို မည်သို့ခေါ်သနည်း?',
    options: [
      'သန္ဓေအောင်ခြင်း (Fertilization)',
      'ဝတ်မှုန်ကူးခြင်း (Pollination)',
      'စပိုးထွက်ခြင်း (Spore formation)',
      'စုံကွဲပွားခြင်း (Binary Fission)',
    ],
    correct: 1,
    explain: 'မှန်ပါသည် — ဝတ်မှုန်အိတ်မှ ဝတ်မှုန်များ ဝတ်မှုန်ခံတိုင်ပေါ်သို့ ကျရောက်ခြင်းကို ဝတ်မှုန်ကူးခြင်း (Pollination) ဟုခေါ်သည်။ (စာမျက်နှာ ၅၄)',
  },
  {
    q: '၅။ အောက်ပါတို့အနက် ခန္ဓာကိုယ်ပြင်ပတွင် သန္ဓေအောင်ခြင်း (External Fertilization) ဖြစ်ပွားသော သတ္တဝါအုပ်စုမှာ မည်သည်နည်း?',
    options: [
      'လူနှင့် မြင်း',
      'ငါး၊ ဖားနှင့် ရေပုတ်သင်',
      'ပန်ဒါဝက်ဝံနှင့် မြင်း',
      'အမီးဗားနှင့် ပါရာမီစီယမ်',
    ],
    correct: 1,
    explain: 'မှန်ပါသည် — ငါး၊ ဖားနှင့် ရေပုတ်သင်တို့၏ အမမျိုးဥနှင့် အဖိုသုက်ကောင်တို့သည် ရေထဲ (ခန္ဓာကိုယ်ပြင်ပ) တွင် တွေ့ဆုံသန္ဓေအောင်ကြသည်။ (စာမျက်နှာ ၅၈)',
  },
  {
    q: '၆။ ပလန်နေးရီးယား (Planaria) နှင့် ဟိုက်ဒရာ (Hydra) တို့၏ လိင်မဲ့မျိုးပွားပုံ မှန်ကန်စွာ တွဲဖက်ထားသည်မှာ မည်သည်နည်း?',
    options: [
      'ပလန်နေးရီးယား (အပိုင်းပိုင်းပြတ်ခြင်း) နှင့် ဟိုက်ဒရာ (ဖူးထွက်ခြင်း)',
      'ပလန်နေးရီးယား (ဖူးထွက်ခြင်း) နှင့် ဟိုက်ဒရာ (စပိုးထွက်ခြင်း)',
      'နှစ်မျိုးလုံး စုံကွဲပွားခြင်း (Binary Fission)',
      'နှစ်မျိုးလုံး လိင်ရှိမျိုးပွားခြင်း',
    ],
    correct: 0,
    explain: 'မှန်ပါသည် — ပလန်နေးရီးယားသည် အပိုင်းပိုင်းပြတ်ခြင်း (Fragmentation) ဖြင့်လည်းကောင်း၊ ဟိုက်ဒရာသည် ဖူးထွက်ခြင်း (Budding) ဖြင့်လည်းကောင်း မျိုးပွားကြသည်။ (စာမျက်နှာ ၅၃-၅၇)',
  },
  {
    q: '၇။ အာလူးပင်၊ ချင်းပင်နှင့် ရွက်ကျပင်ပေါက်ပင်တို့သည် မည်သည့်မျိုးပွားနည်းအမျိုးအစားတွင် ပါဝင်သနည်း?',
    options: [
      'လိင်ရှိမျိုးပွားခြင်း (Sexual Reproduction)',
      'စပိုးဖြင့် မျိုးပွားခြင်း',
      'ပင်ပိုင်းမျိုးပွားခြင်း (Vegetative Propagation)',
      'ပြင်ပသန္ဓေအောင်ခြင်း',
    ],
    correct: 2,
    explain: 'မှန်ပါသည် — အပင်၏ ပင်ပိုင်းအင်္ဂါများဖြစ်သော အမြစ်၊ အရွက်၊ အကိုင်းနှင့် မြေအောက်ပင်စည်များမှ အပင်သစ်ပေါက်ခြင်းကို ပင်ပိုင်းမျိုးပွားခြင်း ဟုခေါ်သည်။ (စာမျက်နှာ ၅၅-၅၆)',
  },
  {
    q: '၈။ ဆဲလ်တစ်ခုတည်းရှိသော အမီးဗား (Amoeba) နှင့် ပါရာမီစီယမ် (Paramecium) တို့သည် မည်သို့မျိုးပွားကြသနည်း?',
    options: [
      'စုံကွဲပွားခြင်း (Binary Fission) ဖြင့် မျိုးပွားသည်',
      'အတွင်းသန္ဓေအောင်ခြင်း (Internal Fertilization) ဖြင့် မျိုးပွားသည်',
      'အပိုင်းပိုင်းပြတ်ခြင်း (Fragmentation) ဖြင့် မျိုးပွားသည်',
      'စပိုး (Spores) များဖြင့် မျိုးပွားသည်',
    ],
    correct: 0,
    explain: 'မှန်ပါသည် — အမီးဗားနှင့် ပါရာမီစီယမ်တို့သည် မိခင်ဆဲလ်မှ နှစ်ပိုင်းတိတိ ကွဲထွက်သည့် စုံကွဲပွားခြင်း (Binary Fission) ဖြင့် လိင်မဲ့မျိုးပွားကြသည်။ (စာမျက်နှာ ၅၆-၅၇)',
  },
  {
    q: '၉။ အဖိုဂမိ (သုက်ကောင်) နှင့် အမဂမိ (မျိုးဥ) တို့ ပေါင်းစပ်ပြီးနောက် မည်သည့်အရာ ဖြစ်ပေါ်လာသနည်း?',
    options: [
      'စပိုး (Spore)',
      'သန္ဓေအောင်ဥ (Zygote)',
      'ဝတ်မှုန် (Pollen)',
      'အမြစ် (Root)',
    ],
    correct: 1,
    explain: 'မှန်ပါသည် — အဖိုဂမိနှင့် အမဂမိတို့ ပေါင်းစပ်ခြင်း (သန္ဓေအောင်ခြင်း) မှ သန္ဓေအောင်ဥ (Zygote) ဖြစ်ပေါ်လာပါသည်။ (စာမျက်နှာ ၅၄ နှင့် ၅၇)',
  },
  {
    q: '၁၀။ ကျောင်းသုံးဖတ်စာအုပ် ပုံ (၆-၄) အရ မြေပြင်ပေါ်တွားသွားပင်စည် (Runner) မှ မျိုးပွားသော အပင်ဥပမာမှာ မည်သည်နည်း?',
    options: [
      'ကြံပင်',
      'မြင်းခွာရွက်ပင်',
      'ရွက်ကျပင်ပေါက်ပင်',
      'သရက်ပင်',
    ],
    correct: 1,
    explain: 'မှန်ပါသည် — မြင်းခွာရွက်ပင်သည် မြေပြင်ပေါ်တွင် တွားသွားပင်စည် (Runner) မှတစ်ဆင့် အပင်သစ်များ ပွားများပါသည်။ (စာမျက်နှာ ၅၅)',
  },
  {
    q: '၁၁။ ပန်းပွင့်တစ်ပွင့်တွင် ပွင့်ချပ်နှင့် အတွင်းပိုင်းအင်္ဂါများကို ကာကွယ်ပေးသော အစိမ်းရောင်အစိတ်အပိုင်းမှာ မည်သည်နည်း?',
    options: [
      'ပွင့်ဖတ် (Petal)',
      'ပွင့်ချပ် / ပွင့်ဖတ်ခံရွက် (Sepal)',
      'ဝတ်မှုန်တံ (Style)',
      'အဖိုတိုင် (Filament)',
    ],
    correct: 1,
    explain: 'မှန်ပါသည် — ပွင့်ချပ် (Sepal) သည် အဖူးအခြေအနေတွင် အတွင်းပိုင်းရှိ ပန်းပွင့်အင်္ဂါများကို ကာကွယ်ပေးပါသည်။ (စာမျက်နှာ ၅၄)',
  },
  {
    q: '၁၂။ ပင်ပိုင်းမျိုးပွားခြင်း (Vegetative Propagation) ၏ အဓိက အားသာချက်တစ်ခုမှာ မည်သည်နည်း?',
    options: [
      'အစေ့မရှိသော အပင်များကိုပါ လျင်မြန်စွာ စိုက်ပျိုးမျိုးပွားနိုင်ခြင်း',
      'ပိုးမွှားများဖြင့် ဝတ်မှုန်ကူးရန် မဖြစ်မနေ လိုအပ်ခြင်း',
      'မိခင်အပင်နှင့် မျိုးစိတ်လုံးဝကွဲပြားသော အပင်သစ်ရရှိခြင်း',
      'ရေထဲတွင်သာ ရှင်သန်ကြီးထွားနိုင်ခြင်း',
    ],
    correct: 0,
    explain: 'မှန်ပါသည် — ပင်ပိုင်းမျိုးပွားခြင်းဖြင့် အစေ့မရှိသောအပင်များ (ဥပမာ - ကြံပင်) ကိုပင် လျင်မြန်စွာ စိုက်ပျိုးနိုင်ပြီး မိခင်အပင်ကဲ့သို့ ကောင်းမွန်သော ဂုဏ်သတ္တိများ ရရှိနိုင်သည်။ (စာမျက်နှာ ၅၄ နှင့် ၅၆)',
  },
];

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#FF6B6B', '#06D6A0', '#FFD166', '#118AB2', '#1D3557'];
  const pieces = Array.from({ length: 110 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.5,
    w: 7 + Math.random() * 7,
    h: 5 + Math.random() * 6,
    vy: 2.5 + Math.random() * 3.8,
    vx: -2 + Math.random() * 4,
    rot: Math.random() * Math.PI * 2,
    vrot: -0.1 + Math.random() * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  let frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (frame < 165) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(tick);
}

function initQuizPage() {
  const arena = document.getElementById('quiz-arena');
  if (!arena) return;

  let activeMode = 'full12';
  let activePool = QUIZ_QUESTIONS.slice();
  let currentIndex = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let answered = false;

  function setupPool(mode) {
    activeMode = mode;
    if (mode === 'quick5') {
      activePool = shuffleArray(QUIZ_QUESTIONS).slice(0, 5);
    } else if (mode === 'medium8') {
      activePool = shuffleArray(QUIZ_QUESTIONS).slice(0, 8);
    } else {
      activePool = QUIZ_QUESTIONS.slice();
    }
    currentIndex = 0;
    score = 0;
    streak = 0;
    bestStreak = 0;
    answered = false;
  }

  document.querySelectorAll('[data-quiz-mode]').forEach((modeBtn) => {
    modeBtn.addEventListener('click', () => {
      const mode = modeBtn.getAttribute('data-quiz-mode') || 'full12';
      document.querySelectorAll('[data-quiz-mode]').forEach((b) => b.classList.remove('is-active'));
      modeBtn.classList.add('is-active');
      SFX.click();
      setupPool(mode);
      renderQuestion();
    });
  });

  function renderQuestion() {
    answered = false;
    const item = activePool[currentIndex];
    const progressPct = Math.round(((currentIndex + 1) / activePool.length) * 100);

    arena.innerHTML = `
      <div class="progress-strip" style="margin-bottom:14px; justify-content:space-between;">
        <span>မေးခွန်း <strong class="en-term">${currentIndex + 1} / ${activePool.length}</strong></span>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          ${streak >= 2 ? `<span class="streak-pill">🔥 ဆက်တိုက်မှန် <span class="en-term">${streak}</span></span>` : ''}
          <span>ရမှတ်: <strong class="en-term">${score}</strong></span>
        </div>
      </div>
      <div class="progress-bar-track" style="width:100%; margin-bottom:18px;">
        <div class="progress-bar-fill" style="width:${progressPct}%;"></div>
      </div>
      <h3>${item.q}</h3>
      <div class="quiz-options" role="group" aria-label="ရွေးချယ်စရာအဖြေများ">
        ${item.options
          .map(
            (opt, idx) => `
          <button type="button" class="quiz-option" data-opt-idx="${idx}">
            <span class="en-term" style="min-width:26px;height:26px;border-radius:8px;background:#EDF4FA;display:grid;place-items:center;font-size:0.86rem;">${idx + 1}</span>
            <span>${opt}</span>
          </button>`
          )
          .join('')}
      </div>
      <div id="quiz-feedback-slot"></div>
      <div class="mt-2" id="quiz-next-slot" hidden>
        <button type="button" class="btn btn-primary" id="btn-quiz-next">
          ${currentIndex + 1 < activePool.length ? 'နောက်မေးခွန်းသို့ →' : 'ရလဒ်ကြည့်ရှုမည် →'}
        </button>
      </div>
    `;

    arena.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const idx = parseInt(btn.getAttribute('data-opt-idx') || '-1', 10);
        const isRight = idx === item.correct;

        arena.querySelectorAll('.quiz-option').forEach((b, bIdx) => {
          b.disabled = true;
          if (bIdx === item.correct) b.classList.add('is-correct');
          if (bIdx === idx && !isRight) b.classList.add('is-wrong');
        });

        const fbSlot = document.getElementById('quiz-feedback-slot');
        if (fbSlot) {
          fbSlot.innerHTML = `<div class="quiz-feedback ${isRight ? 'quiz-feedback--ok' : 'quiz-feedback--err'}">${item.explain}</div>`;
        }

        if (isRight) {
          score++;
          streak++;
          if (streak > bestStreak) bestStreak = streak;
          SFX.success();
          addBonusStars(2, streak >= 3 ? `${streak} ခုဆက်တိုက် အဖြေမှန်!` : 'ဉာဏ်စမ်းအဖြေမှန်!');
        } else {
          streak = 0;
          SFX.error();
        }

        const nextSlot = document.getElementById('quiz-next-slot');
        if (nextSlot) nextSlot.removeAttribute('hidden');
        const nextBtn = document.getElementById('btn-quiz-next');
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            SFX.click();
            currentIndex++;
            if (currentIndex < activePool.length) {
              renderQuestion();
            } else {
              renderSummary();
            }
          });
        }
      });
    });
  }

  function renderSummary() {
    const prevBest = parseInt(safeStorage.get(STORAGE_KEYS.quizBest) || '0', 10) || 0;
    const pct = Math.round((score / activePool.length) * 100);
    if (pct > prevBest) {
      safeStorage.set(STORAGE_KEYS.quizBest, String(pct));
    }
    const badgeTitle =
      pct >= 90
        ? 'သိပ္ပံစူးစမ်းရှာဖွေရေး ချန်ပီယံ (Grade 6 Master!)'
        : pct >= 60
          ? 'ထူးချွန်သော သိပ္ပံစူးစမ်းသူ (Great Explorer!)'
          : 'ဆက်လက်လေ့လာကြစို့ (Keep Exploring!)';

    if (pct >= 60) {
      SFX.celebrate();
      launchConfetti();
    }
    awardDiscovery('quiz_completed', 3, 'ဉာဏ်စမ်းပြိုင်ပွဲ ပြီးမြောက်အောင်မြင်ပြီ!');
    if (activeMode === 'full12' && score >= 10) {
      awardDiscovery('quiz_master_12', 4, 'မေးခွန်း ၁၂ ခု စိန်ခေါ်မှု ထူးချွန်ဆု!');
    }

    arena.innerHTML = `
      <div style="text-align:center; padding: 14px 6px;">
        <div style="font-size:2.8rem; line-height:1.2;">${pct >= 80 ? '🏆' : '🌟'}</div>
        <h2 class="mt-1">${badgeTitle}</h2>
        <p class="mt-1" style="font-size:1.12rem;">
          သင်ဖြေဆိုနိုင်ခဲ့သော ရမှတ် — <strong class="en-term" style="color:var(--ocean);font-size:1.35rem;">${score} / ${activePool.length} (${pct}%)</strong>
        </p>
        <p class="muted-text">
          အများဆုံး ဆက်တိုက်မှန်ကန်မှု — <strong class="en-term">${bestStreak}</strong> ခု ·
          စုစုပေါင်း ကြယ် — <strong class="en-term">${getStars()}</strong>
        </p>
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px;" class="mt-3">
          <button type="button" class="btn btn-primary" id="btn-quiz-retry">↺ ထပ်မံဖြေဆိုမည်</button>
          <a href="./games.html" class="btn btn-teal">ဂိမ်း ၃ မျိုး ကစားမည်</a>
          <a href="./map.html" class="btn btn-amber">ပင်မမြေပုံသို့ ပြန်သွားမည်</a>
        </div>
      </div>
    `;

    const retryBtn = document.getElementById('btn-quiz-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        SFX.click();
        setupPool(activeMode);
        renderQuestion();
      });
    }
  }

  setupPool(activeMode);
  renderQuestion();
}

// ---------- Hub Reset Control & Global Sound Toggle ----------
function initGlobalControls() {
  updateHud();

  const soundBtn = document.getElementById('hud-sound-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const nextMuted = !isMuted();
      setMuted(nextMuted);
      updateHud();
      if (!nextMuted) {
        SFX.click();
        showToast('🔊 အသံစနစ် ဖွင့်လိုက်ပါပြီ');
      } else {
        showToast('🔇 အသံစနစ် ပိတ်လိုက်ပါပြီ');
      }
    });
  }

  const resetBtn = document.getElementById('btn-reset-progress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      safeStorage.remove(STORAGE_KEYS.stars);
      safeStorage.remove(STORAGE_KEYS.discoveries);
      safeStorage.remove(STORAGE_KEYS.quizBest);
      updateHud();
      SFX.click();
      showToast('စူးစမ်းလေ့လာမှု မှတ်တမ်းအားလုံးကို ပြန်လည်စတင်လိုက်ပါပြီ။');
    });
  }

  // Award gentle welcome star when entering each island for the first time
  const pageId = document.body.getAttribute('data-page');
  if (pageId && pageId !== 'hub' && pageId !== 'cover' && pageId !== 'welcome') {
    const islandNames = {
      living: 'ကျွန်း (၁) သက်ရှိများ မျိုးပွားခြင်းသို့ ရောက်ရှိပြီ',
      plants: 'ကျွန်း (၂) အပင်များ မျိုးပွားခြင်းသို့ ရောက်ရှိပြီ',
      animals: 'ကျွန်း (၃) သတ္တဝါများ မျိုးပွားခြင်းသို့ ရောက်ရှိပြီ',
      review: 'ကျွန်း (၄) အခန်းသုံးသပ်ချက်သို့ ရောက်ရှိပြီ',
      games: 'ကျွန်း (၆) သိပ္ပံလေ့ကျင့်ခန်း ဂိမ်းကစားကွင်းသို့ ရောက်ရှိပြီ',
      quiz: 'ကျွန်း (၅) ဉာဏ်စမ်းပြိုင်ပွဲကွင်းသို့ ရောက်ရှိပြီ',
    };
    awardDiscovery(`visit_${pageId}`, 1, islandNames[pageId] || '');
  }
}

// ---------- Textbook Image Lightbox Viewer ----------
function initLightbox() {
  const triggers = document.querySelectorAll('[data-lightbox-src]');
  if (!triggers.length) return;

  let modal = document.getElementById('textbook-lightbox');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'textbook-lightbox';
    modal.className = 'lightbox-backdrop';
    modal.setAttribute('hidden', '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lightbox-title');
    modal.innerHTML = `
      <div class="lightbox-dialog">
        <div class="lightbox-head">
          <h3 id="lightbox-title" style="margin:0;">ဖတ်စာအုပ်ပုံ</h3>
          <button type="button" id="lightbox-close" class="btn btn-outline">✕ ပိတ်မည်</button>
        </div>
        <div class="lightbox-body">
          <img id="lightbox-img" src="" alt="" />
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const imgEl = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  const closeBtn = document.getElementById('lightbox-close');

  const closeModal = () => {
    modal.setAttribute('hidden', '');
    SFX.click();
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-lightbox-src') || '';
      const title = btn.getAttribute('data-lightbox-title') || 'ကျောင်းသုံးဖတ်စာအုပ် စာမျက်နှာ';
      if (imgEl) {
        imgEl.setAttribute('src', src);
        imgEl.setAttribute('alt', title);
      }
      if (titleEl) titleEl.textContent = title;
      modal.removeAttribute('hidden');
      SFX.click();
      const dId = btn.getAttribute('data-discovery-id');
      if (dId) {
        awardDiscovery(dId, 1, title);
      }
    });
  });
}

// ---------- Interactive Chapter 6 Data Graphs ----------
function initCharts() {
  const chartContainer = document.getElementById('repro-bar-chart');
  if (!chartContainer) return;

  const datasets = {
    all: [
      { label: 'ပင်ပိုင်းမျိုးပွားသော အပင်များ (Vegetative)', count: 9, color: '#FFD166', examples: 'ရွက်ကျပင်ပေါက်၊ ဝါး၊ ရွက်လှ၊ ကြံ၊ နှင်းဆီ၊ ပုဏ္ဏရိပ်၊ မြင်းခွာရွက်၊ အာလူး၊ ချင်း' },
      { label: 'လိင်ရှိမျိုးပွားသော သတ္တဝါများ (Sexual Animals)', count: 6, color: '#FF6B6B', examples: 'ပန်ဒါဝက်ဝံ၊ မြင်း၊ လူ (အတွင်း) | ငါး၊ ဖား၊ ရေပုတ်သင် (ပြင်ပ)' },
      { label: 'လိင်ရှိမျိုးပွားသော အပင်များ (Sexual Plants)', count: 4, color: '#06D6A0', examples: 'စွယ်တော်ပင်၊ သရက်ပင်၊ သင်္ဘောပင်၊ ပဲပင်အမျိုးမျိုး' },
      { label: 'လိင်မဲ့မျိုးပွားသော သတ္တဝါများ (Asexual Animals)', count: 4, color: '#118AB2', examples: 'ဟိုက်ဒရာ (ဖူးထွက်)၊ အမီးဗား/ပါရာမီစီယမ် (စုံကွဲ)၊ ပလန်နေးရီးယား (အပိုင်းပြတ်)' },
      { label: 'စပိုးဖြင့် မျိုးပွားသော အပင်များ (Spore Plants)', count: 2, color: '#1D3557', examples: 'ဖန်းပင်၊ မော့စ်ပင်' },
    ],
    plants: [
      { label: 'ပင်ပိုင်းမျိုးပွားခြင်း (အမြစ်၊ အရွက်၊ အကိုင်း၊ မြေအောက်ပင်စည်)', count: 9, color: '#FFD166', examples: 'ရွက်ကျပင်ပေါက်၊ ဝါး၊ ရွက်လှ၊ ကြံ၊ နှင်းဆီ၊ ပုဏ္ဏရိပ်၊ မြင်းခွာရွက်၊ အာလူး၊ ချင်း' },
      { label: 'လိင်ရှိမျိုးပွားခြင်း (ပန်းပွင့်နှင့် အစေ့)', count: 4, color: '#06D6A0', examples: 'စွယ်တော်ပင်၊ သရက်ပင်၊ သင်္ဘောပင်၊ ပဲပင်အမျိုးမျိုး' },
      { label: 'လိင်မဲ့မျိုးပွားခြင်း (စပိုး - Spores)', count: 2, color: '#1D3557', examples: 'ဖန်းပင်၊ မော့စ်ပင်' },
    ],
    animals: [
      { label: 'အတွင်းသန္ဓေအောင်ခြင်း (Internal Fertilization)', count: 3, color: '#FF6B6B', examples: 'လူ၊ မြင်း၊ ပန်ဒါဝက်ဝံ' },
      { label: 'ပြင်ပသန္ဓေအောင်ခြင်း (External Fertilization)', count: 3, color: '#118AB2', examples: 'ငါး၊ ဖား၊ ရေပုတ်သင်' },
      { label: 'စုံကွဲပွားခြင်း (Binary Fission)', count: 2, color: '#06D6A0', examples: 'အမီးဗား၊ ပါရာမီစီယမ်' },
      { label: 'ဖူးထွက်ခြင်း / အပိုင်းပိုင်းပြတ်ခြင်း', count: 2, color: '#FFD166', examples: 'ဟိုက်ဒရာ (ဖူးထွက်)၊ ပလန်နေးရီးယား (အပိုင်းပိုင်းပြတ်)' },
    ],
  };

  function renderBars(mode) {
    const items = datasets[mode] || datasets.all;
    const maxCount = Math.max(...items.map((i) => i.count), 1);
    chartContainer.innerHTML = items
      .map((item) => {
        const pct = Math.round((item.count / maxCount) * 100);
        return `
          <div class="bar-row">
            <div class="bar-row-head">
              <span>${item.label}</span>
              <span class="en-term" style="color:var(--ocean);">${item.count} မျိုး</span>
            </div>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pct}%; background:${item.color};"></div>
            </div>
            <div class="muted-text" style="font-size:0.84rem;">ဥပမာ: ${item.examples}</div>
          </div>
        `;
      })
      .join('');
  }

  document.querySelectorAll('[data-chart-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-chart-mode]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderBars(btn.getAttribute('data-chart-mode') || 'all');
      SFX.click();
    });
  });

  renderBars('all');
}

// ---------- Full PDF Embed Viewer Toggle ----------
function initPdfViewer() {
  const toggleBtn = document.getElementById('btn-toggle-pdf');
  const wrap = document.getElementById('pdf-viewer-wrap');
  if (!toggleBtn || !wrap) return;
  toggleBtn.addEventListener('click', () => {
    const isHidden = wrap.hasAttribute('hidden');
    if (isHidden) {
      wrap.removeAttribute('hidden');
      toggleBtn.textContent = 'ဖတ်စာအုပ် PDF မြင်ကွင်းပိတ်မည်';
      awardDiscovery('view_full_pdf', 1, 'ဆဋ္ဌမတန်း သိပ္ပံဖတ်စာအုပ် PDF အပြည့်အစုံ ဖွင့်ကြည့်ပြီ');
    } else {
      wrap.setAttribute('hidden', '');
      toggleBtn.textContent = 'ဖတ်စာအုပ် PDF တစ်အုပ်လုံး ဖွင့်ဖတ်မည်';
      SFX.click();
    }
  });
}

// ---------- Page: 3 Interactive Exercise Games (games.html) ----------
function initGamesPage() {
  const sortRoot = document.getElementById('game-sort-root');
  const memoryRoot = document.getElementById('game-memory-root');
  const seqRoot = document.getElementById('game-sequence-root');
  if (!sortRoot || !memoryRoot || !seqRoot) return;

  // Game Tab Switcher
  const tabBtns = document.querySelectorAll('[data-game-tab]');
  const panels = {
    sort: document.getElementById('game-panel-sort'),
    memory: document.getElementById('game-panel-memory'),
    sequence: document.getElementById('game-panel-sequence'),
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-game-tab') || 'sort';
      tabBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      Object.keys(panels).forEach((key) => {
        const panel = panels[key];
        if (!panel) return;
        if (key === target) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
      SFX.click();
    });
  });

  // ===== GAME 1: Speed Sort Classifier =====
  const SORT_ITEMS = [
    { name: 'စွယ်တော်ပင်', img: './images/ch6/fig6-1-sweltaw.png', type: 'sexual', hint: 'ပန်းပွင့်နှင့် အစေ့ (စာ ၅၃)' },
    { name: 'ပန်ဒါဝက်ဝံ', img: './images/ch6/fig6-1-panda.png', type: 'sexual', hint: 'အတွင်းသန္ဓေအောင် သတ္တဝါ (စာ ၅၃)' },
    { name: 'ဖား', img: './images/ch6/fig6-8-frog.png', type: 'sexual', hint: 'ရေထဲ ပြင်ပသန္ဓေအောင်ခြင်း (စာ ၅၇)' },
    { name: 'သရက်ပင်', img: './images/ch6/ex56-mango.png', type: 'sexual', hint: 'ပန်းပွင့်ဝတ်မှုန်ကူး အစေ့ (စာ ၅၆)' },
    { name: 'ဟိုက်ဒရာ (Hydra)', img: './images/ch6/fig6-6-hydra.png', type: 'asexual', hint: 'ဖူးထွက်ခြင်း (Budding)' },
    { name: 'ပလန်နေးရီးယား', img: './images/ch6/fig6-7-planaria.png', type: 'asexual', hint: 'အပိုင်းပိုင်းပြတ်ခြင်း (Fragmentation)' },
    { name: 'ဖန်းပင် (Fern)', img: './images/ch6/fig6-3-fern.png', type: 'asexual', hint: 'စပိုး (Spores) များဖြင့် (စာ ၅၅)' },
    { name: 'အမီးဗား (Amoeba)', img: './images/ch6/fig6-5-amoeba.png', type: 'asexual', hint: 'စုံကွဲပွားခြင်း (Binary Fission)' },
    { name: 'ရွက်ကျပင်ပေါက်', img: './images/ch6/ex56-bryophyllum.png', type: 'vegetative', hint: 'အရွက်မှ အပင်သစ်ပေါက် (စာ ၅၅)' },
    { name: 'အာလူးနှင့် ချင်း', img: './images/ch6/ex56-potato.png', type: 'vegetative', hint: 'မြေအောက်ပင်စည်မှ မျိုးပွား (စာ ၅၆)' },
  ];

  const TYPE_LABELS = {
    sexual: 'လိင်ရှိမျိုးပွားခြင်း (Sexual)',
    asexual: 'လိင်မဲ့မျိုးပွားခြင်း (Asexual)',
    vegetative: 'ပင်ပိုင်းမျိုးပွားခြင်း (Vegetative)',
  };

  let sortQueue = [];
  let sortIdx = 0;
  let sortScore = 0;
  let sortStreak = 0;
  let sortTimer = 60;
  let sortTimedMode = true;
  let sortInterval = null;
  let sortLocked = false;

  function stopSortTimer() {
    if (sortInterval) {
      clearInterval(sortInterval);
      sortInterval = null;
    }
  }

  function startSortGame(timed) {
    stopSortTimer();
    sortTimedMode = timed;
    sortQueue = shuffleArray(SORT_ITEMS);
    sortIdx = 0;
    sortScore = 0;
    sortStreak = 0;
    sortTimer = 60;
    sortLocked = false;
    renderSortGame();

    if (sortTimedMode) {
      sortInterval = setInterval(() => {
        sortTimer--;
        const timeEl = document.getElementById('sort-timer-val');
        if (timeEl) timeEl.textContent = `${sortTimer}s`;
        if (sortTimer <= 0) {
          stopSortTimer();
          renderSortSummary(true);
        }
      }, 1000);
    }
  }

  function renderSortGame() {
    if (sortIdx >= sortQueue.length) {
      stopSortTimer();
      renderSortSummary(false);
      return;
    }
    const item = sortQueue[sortIdx];
    sortRoot.innerHTML = `
      <div class="game-hud-bar">
        <div class="game-stat-group">
          <span class="game-stat-pill">နမူနာ <span class="en-term">${sortIdx + 1} / ${sortQueue.length}</span></span>
          <span class="game-stat-pill">ရမှတ် <span class="en-term">${sortScore}</span></span>
          <span class="game-stat-pill">ဆက်တိုက် <span class="en-term">${sortStreak}</span></span>
          ${sortTimedMode ? `<span class="game-stat-pill">အချိန် <span id="sort-timer-val" class="en-term">${sortTimer}s</span></span>` : '<span class="game-stat-pill">အေးဆေးမုဒ်</span>'}
        </div>
        <div class="game-stat-group">
          <button type="button" class="btn btn-outline" id="btn-sort-mode-toggle">
            ${sortTimedMode ? 'အချိန်မကန့်သတ်မုဒ်' : 'စက္ကန့် ၆၀ စိန်ခေါ်မှု'}
          </button>
          <button type="button" class="btn btn-outline" id="btn-sort-restart">↺ အသစ်စမည်</button>
        </div>
      </div>

      <div id="sort-card-box" class="sort-specimen-card">
        <img class="sort-specimen-img" src="${item.img}" alt="${item.name}" />
        <div>
          <span class="chapter-tag" style="margin-bottom:6px;">ဤသက်ရှိ၏ မျိုးပွားနည်းအုပ်စုကို ရွေးပါ</span>
          <h2 style="margin:0;">${item.name}</h2>
          <p class="muted-text" style="margin:4px 0 0 0;">သဲလွန်စ — ${item.hint}</p>
        </div>
      </div>

      <div class="sort-buckets">
        <button type="button" class="sort-bucket-btn" data-bucket="sexual">
          <span>လိင်ရှိမျိုးပွားခြင်း</span>
          <span class="muted-text" style="font-size:0.82rem;">Sexual Reproduction</span>
        </button>
        <button type="button" class="sort-bucket-btn" data-bucket="asexual">
          <span>လိင်မဲ့မျိုးပွားခြင်း</span>
          <span class="muted-text" style="font-size:0.82rem;">စပိုး၊ စုံကွဲ၊ ဖူးထွက်၊ အပိုင်းပြတ်</span>
        </button>
        <button type="button" class="sort-bucket-btn" data-bucket="vegetative">
          <span>ပင်ပိုင်းမျိုးပွားခြင်း</span>
          <span class="muted-text" style="font-size:0.82rem;">အမြစ်၊ အရွက်၊ ပင်စည်</span>
        </button>
      </div>
      <div id="sort-feedback" class="mt-2"></div>
    `;

    const restartBtn = document.getElementById('btn-sort-restart');
    if (restartBtn) restartBtn.addEventListener('click', () => { SFX.click(); startSortGame(sortTimedMode); });
    const toggleBtn = document.getElementById('btn-sort-mode-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => { SFX.click(); startSortGame(!sortTimedMode); });

    sortRoot.querySelectorAll('[data-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (sortLocked) return;
        sortLocked = true;
        const chosen = btn.getAttribute('data-bucket');
        const isRight = chosen === item.type;
        const cardBox = document.getElementById('sort-card-box');
        const fb = document.getElementById('sort-feedback');

        if (isRight) {
          sortScore++;
          sortStreak++;
          if (cardBox) cardBox.classList.add('is-ok');
          if (fb) fb.innerHTML = `<div class="quiz-feedback quiz-feedback--ok">မှန်ကန်ပါသည် — ${item.name} သည် ${TYPE_LABELS[item.type]} ဖြစ်ပါသည်။</div>`;
          SFX.success();
          addBonusStars(1, `${item.name} မှန်ကန်စွာ ခွဲခြားနိုင်ပြီ!`);
        } else {
          sortStreak = 0;
          if (cardBox) cardBox.classList.add('is-err');
          if (fb) fb.innerHTML = `<div class="quiz-feedback quiz-feedback--err">${item.name} သည် <strong>${TYPE_LABELS[item.type]}</strong> အုပ်စုဖြစ်ပါသည်။</div>`;
          SFX.error();
        }

        setTimeout(() => {
          sortIdx++;
          sortLocked = false;
          renderSortGame();
        }, 850);
      });
    });
  }

  function renderSortSummary(timedOut) {
    const passed = sortScore >= 7;
    if (passed) {
      SFX.celebrate();
      launchConfetti();
      awardDiscovery('game_sort_master', 3, 'ဂိမ်း (၁) မျိုးပွားနည်း ခွဲခြားဂိမ်း အောင်မြင်ပြီ!');
    }
    sortRoot.innerHTML = `
      <div style="text-align:center; padding:12px;">
        <div style="font-size:2.6rem;">${passed ? '🎯' : '⏱️'}</div>
        <h2>${timedOut ? 'အချိန်စေ့သွားပါပြီ!' : passed ? 'အထူးကောင်းမွန်ပါသည်!' : 'ထပ်မံကြိုးစားကြည့်ရအောင်!'}</h2>
        <p class="mt-1" style="font-size:1.1rem;">
          သင်ခွဲခြားနိုင်ခဲ့သော ရမှတ် — <strong class="en-term" style="color:var(--ocean); font-size:1.35rem;">${sortScore} / ${sortQueue.length}</strong>
        </p>
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;" class="mt-2">
          <button type="button" class="btn btn-primary" id="btn-sort-play-again">↺ ပြန်လည်ကစားမည်</button>
          <button type="button" class="btn btn-outline" id="btn-sort-play-relaxed">အချိန်မကန့်သတ်မုဒ်ဖြင့် ကစားမည်</button>
        </div>
      </div>
    `;
    const again = document.getElementById('btn-sort-play-again');
    if (again) again.addEventListener('click', () => { SFX.click(); startSortGame(sortTimedMode); });
    const relaxed = document.getElementById('btn-sort-play-relaxed');
    if (relaxed) relaxed.addEventListener('click', () => { SFX.click(); startSortGame(false); });
  }

  // ===== GAME 2: Memory Match Pairs =====
  const MEMORY_PAIRS = [
    { id: 'p1', left: 'ဟိုက်ဒရာ (Hydra)', right: 'ဖူးထွက်ခြင်း (Budding)' },
    { id: 'p2', left: 'ပလန်နေးရီးယား', right: 'အပိုင်းပိုင်းပြတ်ခြင်း (Fragmentation)' },
    { id: 'p3', left: 'ဖန်းပင် (Fern)', right: 'စပိုး (Spores) များဖြင့် မျိုးပွား' },
    { id: 'p4', left: 'ပါရာမီစီယမ်', right: 'စုံကွဲပွားခြင်း (Binary Fission)' },
    { id: 'p5', left: 'ဝတ်မှုန်အိတ် (Anther)', right: 'အဖိုဂမိ (Male gamete)' },
    { id: 'p6', left: 'အစေ့အိမ် (Ovary)', right: 'အမဂမိ (Female gamete)' },
    { id: 'p7', left: 'ငါး နှင့် ဖား', right: 'ပြင်ပသန္ဓေအောင်ခြင်း' },
    { id: 'p8', left: 'လူ နှင့် မြင်း', right: 'အတွင်းသန္ဓေအောင်ခြင်း' },
  ];

  let memPairCount = 6;
  let memCards = [];
  let memFlipped = [];
  let memMatched = 0;
  let memMoves = 0;
  let memBusy = false;

  function startMemoryGame(pairCount) {
    memPairCount = pairCount;
    const chosen = MEMORY_PAIRS.slice(0, pairCount);
    const deck = [];
    chosen.forEach((pair) => {
      deck.push({ pairId: pair.id, text: pair.left, kind: 'သက်ရှိ / အင်္ဂါ' });
      deck.push({ pairId: pair.id, text: pair.right, kind: 'မျိုးပွားနည်း / ဂမိ' });
    });
    memCards = shuffleArray(deck);
    memFlipped = [];
    memMatched = 0;
    memMoves = 0;
    memBusy = false;
    renderMemoryBoard();
  }

  function renderMemoryBoard() {
    memoryRoot.innerHTML = `
      <div class="game-hud-bar">
        <div class="game-stat-group">
          <span class="game-stat-pill">တွဲမိပြီး <span id="mem-matched-val" class="en-term">${memMatched} / ${memPairCount}</span></span>
          <span class="game-stat-pill">လှန်ကြည့်မှု <span id="mem-moves-val" class="en-term">${memMoves}</span></span>
        </div>
        <div class="game-stat-group">
          <button type="button" class="btn btn-outline ${memPairCount === 6 ? 'is-active' : ''}" id="btn-mem-6">၆ တွဲ (၁၂ ကတ်)</button>
          <button type="button" class="btn btn-outline ${memPairCount === 8 ? 'is-active' : ''}" id="btn-mem-8">၈ တွဲ (၁၆ ကတ်)</button>
          <button type="button" class="btn btn-outline" id="btn-mem-reset">↺ အသစ်စီမည်</button>
        </div>
      </div>
      <div class="memory-grid" id="memory-grid-list">
        ${memCards
          .map(
            (card, idx) => `
          <div role="button" tabindex="0" class="memory-card" data-mem-idx="${idx}" aria-label="မှတ်ဉာဏ်ကတ် ${idx + 1}">
            <div class="memory-card-inner">
              <div class="memory-face memory-front">
                <div class="en-term" style="font-size:1.35rem; opacity:0.9;">?</div>
                <div style="font-size:0.84rem;">လှန်ကြည့်မည်</div>
              </div>
              <div class="memory-face memory-back">
                <span class="muted-text" style="font-size:0.74rem; margin-bottom:4px;">${card.kind}</span>
                <span>${card.text}</span>
              </div>
            </div>
          </div>`
          )
          .join('')}
      </div>
    `;

    const b6 = document.getElementById('btn-mem-6');
    const b8 = document.getElementById('btn-mem-8');
    const br = document.getElementById('btn-mem-reset');
    if (b6) b6.addEventListener('click', () => { SFX.click(); startMemoryGame(6); });
    if (b8) b8.addEventListener('click', () => { SFX.click(); startMemoryGame(8); });
    if (br) br.addEventListener('click', () => { SFX.click(); startMemoryGame(memPairCount); });

    const grid = document.getElementById('memory-grid-list');
    if (!grid) return;

    grid.querySelectorAll('.memory-card').forEach((cardEl) => {
      const handleFlip = () => {
        if (memBusy) return;
        if (cardEl.classList.contains('is-flipped') || cardEl.classList.contains('is-matched')) return;

        cardEl.classList.add('is-flipped');
        SFX.click();
        memFlipped.push(cardEl);

        if (memFlipped.length === 2) {
          memMoves++;
          const movesEl = document.getElementById('mem-moves-val');
          if (movesEl) movesEl.textContent = String(memMoves);

          const [c1, c2] = memFlipped;
          const idx1 = parseInt(c1.getAttribute('data-mem-idx') || '0', 10);
          const idx2 = parseInt(c2.getAttribute('data-mem-idx') || '0', 10);

          if (memCards[idx1].pairId === memCards[idx2].pairId) {
            c1.classList.add('is-matched');
            c2.classList.add('is-matched');
            memMatched++;
            const matchEl = document.getElementById('mem-matched-val');
            if (matchEl) matchEl.textContent = `${memMatched} / ${memPairCount}`;
            memFlipped = [];
            SFX.success();
            addBonusStars(1, 'သိပ္ပံအတွဲ မှန်ကန်စွာ တွဲမိပြီ!');

            if (memMatched === memPairCount) {
              SFX.celebrate();
              launchConfetti();
              awardDiscovery('game_memory_master', 3, 'ဂိမ်း (၂) မှတ်ဉာဏ်အတွဲညှိဂိမ်း အောင်မြင်ပြီ!');
            }
          } else {
            memBusy = true;
            setTimeout(() => {
              c1.classList.remove('is-flipped');
              c2.classList.remove('is-flipped');
              memFlipped = [];
              memBusy = false;
            }, 800);
          }
        }
      };

      cardEl.addEventListener('click', handleFlip);
      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleFlip();
        }
      });
    });
  }

  // ===== GAME 3: Life Cycle & Process Sequencer =====
  const SEQUENCE_LEVELS = [
    {
      id: 'flower',
      title: 'အဆင့် (၁) ပန်းပွင့်အပင် လိင်ရှိမျိုးပွားပုံ (စာမျက်နှာ ၅၄)',
      img: './images/ch6/fig6-2-flower.png',
      steps: [
        '၁။ ဝတ်မှုန်အိတ် (Anther) ထဲတွင် အဖိုဂမိပါဝင်သော ဝတ်မှုန်များ ဖြစ်ပေါ်သည်။',
        '၂။ ဝတ်မှုန်များသည် ဝတ်မှုန်ခံတိုင် (Stigma) ပေါ်သို့ ရောက်ရှိသည် (ဝတ်မှုန်ကူးခြင်း)။',
        '၃။ ဝတ်မှုန်ပြွန်မှတစ်ဆင့် အဖိုဂမိသည် အစေ့အိမ်ရှိ အစေ့လောင်းထဲသို့ ဆင်းသက်သည်။',
        '၄။ အဖိုဂမိနှင့် အမဂမိတို့ ပေါင်းစပ်၍ သန္ဓေအောင်ခြင်း (Fertilization) ဖြစ်ပေါ်သည်။',
        '၅။ အစေ့လောင်းသည် အစေ့ဖြစ်လာပြီး အစေ့အိမ်သည် အသီးအဖြစ် ဖွံ့ဖြိုးလာသည်။',
      ],
    },
    {
      id: 'frog',
      title: 'အဆင့် (၂) ဖား၏ ပြင်ပသန္ဓေအောင်ခြင်း ဖြစ်စဉ် (ပုံ ၆-၈ • စာ ၅၇)',
      img: './images/ch6/fig6-8-frog.png',
      steps: [
        '၁။ ဖားအမကြီးသည် ရေထဲသို့ မျိုးဥ (Eggs) အမြောက်အမြား ဥချသည်။',
        '၂။ ဖားအထီးကြီးသည် ထိုမျိုးဥများပေါ်သို့ သုက်ကောင် (Sperms) များ စွန့်ထုတ်သည်။',
        '၃။ ခန္ဓာကိုယ်ပြင်ပ ရေထဲတွင် သုက်ကောင်နှင့် မျိုးဥတို့ ပေါင်းစပ်သန္ဓေအောင်သည်။',
        '၄။ သန္ဓေအောင်ဥ (Zygote) မှ ဖားလောင်း (Tadpole) အဖြစ် ပေါက်ဖွားလာသည်။',
        '၅။ ဖားလောင်းသည် တဖြည်းဖြည်း ကြီးထွားပြောင်းလဲပြီး အရွယ်ရောက် ဖားကြီးဖြစ်လာသည်။',
      ],
    },
    {
      id: 'human',
      title: 'အဆင့် (၃) လူသား၏ အတွင်းသန္ဓေအောင်ခြင်း ဖြစ်စဉ် (ပုံ ၆-၈ • စာ ၅၇)',
      img: './images/ch6/fig6-8-human.png',
      steps: [
        '၁။ အဖိုသုက်ကောင်သည် အမမျိုးပွားအင်္ဂါ ခန္ဓာကိုယ်အတွင်းသို့ ဝင်ရောက်သည်။',
        '၂။ ခန္ဓာကိုယ်အတွင်း၌ သုက်ကောင်နှင့် မျိုးဥတို့ ပေါင်းစပ်သန္ဓေအောင်သည်။',
        '၃။ သန္ဓေအောင်ဥ (Zygote) သည် သန္ဓေသားလောင်းအဖြစ် သားအိမ်အတွင်း ကြီးထွားသည်။',
        '၄။ အချိန်စေ့သောအခါ လူသားရင်သွေးငယ်အဖြစ် မွေးဖွားလာသည်။',
      ],
    },
  ];

  let seqLevelIdx = 0;
  let seqCurrentOrder = [];
  let seqSelectedIdx = null;
  let seqCheckedStates = null;

  function loadSequenceLevel(idx) {
    seqLevelIdx = idx;
    const level = SEQUENCE_LEVELS[seqLevelIdx];
    const items = level.steps.map((text, correctIdx) => ({ text, correctIdx }));
    // Ensure shuffled order isn't already completely solved
    let shuffled = shuffleArray(items);
    if (shuffled.every((s, i) => s.correctIdx === i) && shuffled.length > 1) {
      const tmp = shuffled[0];
      shuffled[0] = shuffled[1];
      shuffled[1] = tmp;
    }
    seqCurrentOrder = shuffled;
    seqSelectedIdx = null;
    seqCheckedStates = null;
    renderSequenceGame();
  }

  function swapSeq(a, b) {
    if (a < 0 || b < 0 || a >= seqCurrentOrder.length || b >= seqCurrentOrder.length) return;
    const tmp = seqCurrentOrder[a];
    seqCurrentOrder[a] = seqCurrentOrder[b];
    seqCurrentOrder[b] = tmp;
    seqSelectedIdx = null;
    seqCheckedStates = null;
    SFX.click();
    renderSequenceGame();
  }

  function renderSequenceGame(showDiagram = false) {
    const level = SEQUENCE_LEVELS[seqLevelIdx];
    seqRoot.innerHTML = `
      <div class="game-hud-bar">
        <div class="game-stat-group">
          ${SEQUENCE_LEVELS.map(
            (lvl, idx) => `
            <button type="button" class="btn btn-outline ${idx === seqLevelIdx ? 'is-active' : ''}" data-seq-level="${idx}">
              အဆင့် (${idx + 1})
            </button>`
          ).join('')}
        </div>
        <button type="button" class="btn btn-outline" id="btn-seq-reshuffle">↺ ပြန်မွှေမည်</button>
      </div>

      <h3>${level.title}</h3>
      <p class="muted-text" style="margin-bottom:14px;">
        အောက်ပါဖြစ်စဉ်အဆင့်များကို ▲ ▼ ခလုတ်နှိပ်၍ (သို့မဟုတ် ကတ် ၂ ခုကို ဆက်တိုက်နှိပ်၍) မှန်ကန်သောအစီအစဉ်အတိုင်း စီပါ။
      </p>

      <div class="seq-list">
        ${seqCurrentOrder
          .map((item, idx) => {
            let stateClass = '';
            if (seqSelectedIdx === idx) stateClass = 'is-selected';
            if (seqCheckedStates) {
              stateClass = seqCheckedStates[idx] ? 'is-right' : 'is-wrong';
            }
            const cleanText = item.text.replace(/^[၁-၅]။\s*/, '');
            return `
              <div class="seq-step-card ${stateClass}">
                <div class="seq-step-main" data-seq-tap="${idx}" role="button" tabindex="0" aria-label="အဆင့်ကတ် ${idx + 1}">
                  <span class="seq-num-badge en-term">${idx + 1}</span>
                  <span style="font-weight:700;">${cleanText}</span>
                </div>
                <div class="seq-step-controls">
                  <button type="button" class="seq-move-btn" data-seq-up="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="အပေါ်သို့ရွှေ့မည်">▲</button>
                  <button type="button" class="seq-move-btn" data-seq-down="${idx}" ${idx === seqCurrentOrder.length - 1 ? 'disabled' : ''} aria-label="အောက်သို့ရွှေ့မည်">▼</button>
                </div>
              </div>`;
          })
          .join('')}
      </div>

      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px;" class="mt-2">
        <button type="button" class="btn btn-primary" id="btn-seq-check">အစီအစဉ် မှန်/မမှန် စစ်ဆေးမည်</button>
        ${seqLevelIdx < SEQUENCE_LEVELS.length - 1 ? '<button type="button" class="btn btn-teal" id="btn-seq-next-lvl">နောက်အဆင့်သို့ →</button>' : ''}
      </div>

      <div id="seq-result-slot" class="mt-2">
        ${
          showDiagram
            ? `<div class="quiz-feedback quiz-feedback--ok">
                🎉 အံ့ဩဖွယ်ကောင်းပါသည် — ဖြစ်စဉ်အဆင့်အားလုံး ၁၀၀% မှန်ကန်ပါသည်။
                <div class="figure-frame mt-1" style="max-width:420px; margin-left:auto; margin-right:auto;">
                  <img src="${level.img}" alt="${level.title}" />
                </div>
              </div>`
            : ''
        }
      </div>
    `;

    seqRoot.querySelectorAll('[data-seq-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        SFX.click();
        loadSequenceLevel(parseInt(btn.getAttribute('data-seq-level') || '0', 10));
      });
    });

    const reshuffleBtn = document.getElementById('btn-seq-reshuffle');
    if (reshuffleBtn) reshuffleBtn.addEventListener('click', () => { SFX.click(); loadSequenceLevel(seqLevelIdx); });

    const nextLvlBtn = document.getElementById('btn-seq-next-lvl');
    if (nextLvlBtn) nextLvlBtn.addEventListener('click', () => { SFX.click(); loadSequenceLevel(seqLevelIdx + 1); });

    seqRoot.querySelectorAll('[data-seq-up]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-seq-up') || '0', 10);
        swapSeq(idx, idx - 1);
      });
    });

    seqRoot.querySelectorAll('[data-seq-down]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-seq-down') || '0', 10);
        swapSeq(idx, idx + 1);
      });
    });

    seqRoot.querySelectorAll('[data-seq-tap]').forEach((row) => {
      const handleTap = () => {
        const idx = parseInt(row.getAttribute('data-seq-tap') || '0', 10);
        if (seqSelectedIdx === null) {
          seqSelectedIdx = idx;
          SFX.click();
          renderSequenceGame();
        } else if (seqSelectedIdx === idx) {
          seqSelectedIdx = null;
          SFX.click();
          renderSequenceGame();
        } else {
          swapSeq(seqSelectedIdx, idx);
        }
      };
      row.addEventListener('click', handleTap);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTap();
        }
      });
    });

    const checkBtn = document.getElementById('btn-seq-check');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        seqCheckedStates = seqCurrentOrder.map((item, idx) => item.correctIdx === idx);
        const allCorrect = seqCheckedStates.every(Boolean);
        if (allCorrect) {
          SFX.celebrate();
          launchConfetti();
          awardDiscovery(`game_seq_${level.id}`, 3, `${level.title} မှန်ကန်စွာ စီနိုင်ပြီ!`);
          renderSequenceGame(true);
        } else {
          SFX.error();
          renderSequenceGame(false);
          const slot = document.getElementById('seq-result-slot');
          if (slot) {
            const rightCount = seqCheckedStates.filter(Boolean).length;
            slot.innerHTML = `<div class="quiz-feedback quiz-feedback--err">💡 လက်ရှိ ${rightCount} / ${seqCurrentOrder.length} ခု နေရာမှန်နေပါပြီ။ အနီရောင်ကတ်များကို ▲ ▼ နှိပ်ပြီး ပြန်ညှိကြည့်ပါ။</div>`;
          }
        }
      });
    }
  }

  // Initialize all 3 games cleanly
  startSortGame(true);
  startMemoryGame(6);
  loadSequenceLevel(0);
}

// ---------- Ambient Animated Lesson Plants & Animals Background ----------
function initAmbientLessonBackground() {
  if (document.querySelector('.ambient-lesson-bg')) return;
  const pageId = document.body.getAttribute('data-page') || 'hub';

  const svgs = {
    flower: `<svg viewBox="0 0 90 90" fill="none"><g transform="translate(45 45)"><ellipse cx="0" cy="-22" rx="11" ry="18" fill="#FF6B6B"/><ellipse cx="21" cy="-7" rx="11" ry="18" transform="rotate(72 21 -7)" fill="#FF8585"/><ellipse cx="13" cy="18" rx="11" ry="18" transform="rotate(144 13 18)" fill="#FF6B6B"/><ellipse cx="-13" cy="18" rx="11" ry="18" transform="rotate(216 -13 18)" fill="#FF8585"/><ellipse cx="-21" cy="-7" rx="11" ry="18" transform="rotate(288 -21 -7)" fill="#FF6B6B"/><circle cx="0" cy="0" r="9" fill="#FFD166"/><circle cx="-4" cy="-5" r="2.2" fill="#1D3557"/><circle cx="4" cy="-4" r="2.2" fill="#1D3557"/></g></svg>`,
    fern: `<svg viewBox="0 0 110 130" fill="none"><path d="M55 125 Q54 68 62 12" stroke="#049A73" stroke-width="5" stroke-linecap="round"/><ellipse cx="42" cy="96" rx="18" ry="6" transform="rotate(-22 42 96)" fill="#06D6A0"/><ellipse cx="70" cy="94" rx="18" ry="6" transform="rotate(22 70 94)" fill="#06D6A0"/><ellipse cx="43" cy="72" rx="16" ry="5.5" transform="rotate(-22 43 72)" fill="#049A73"/><ellipse cx="71" cy="70" rx="16" ry="5.5" transform="rotate(22 71 70)" fill="#049A73"/><ellipse cx="45" cy="48" rx="13" ry="5" transform="rotate(-20 45 48)" fill="#06D6A0"/><ellipse cx="71" cy="46" rx="13" ry="5" transform="rotate(20 71 46)" fill="#06D6A0"/><ellipse cx="52" cy="26" rx="10" ry="4" transform="rotate(-14 52 26)" fill="#049A73"/><ellipse cx="68" cy="25" rx="10" ry="4" transform="rotate(14 68 25)" fill="#049A73"/><circle cx="38" cy="96" r="2.2" fill="#FFD166"/><circle cx="72" cy="70" r="2.2" fill="#FFD166"/><circle cx="43" cy="48" r="2" fill="#FFD166"/></svg>`,
    bryophyllum: `<svg viewBox="0 0 110 90" fill="none"><path d="M18 52 Q52 16 94 36 Q66 76 18 52 Z" fill="#06D6A0" stroke="#049A73" stroke-width="3"/><path d="M18 52 Q55 46 88 38" stroke="#03664C" stroke-width="2.5" stroke-linecap="round"/><circle cx="38" cy="28" r="4.5" fill="#FFD166"/><circle cx="62" cy="22" r="4.5" fill="#FFD166"/><circle cx="80" cy="54" r="4.5" fill="#FFD166"/></svg>`,
    spores: `<svg viewBox="0 0 80 80" fill="none"><circle cx="24" cy="28" r="7" fill="#FFD166"/><circle cx="52" cy="20" r="5" fill="#FFB703"/><circle cx="44" cy="52" r="8" fill="#FFD166"/><circle cx="18" cy="60" r="4.5" fill="#06D6A0"/></svg>`,
    fish: `<svg viewBox="0 0 120 70" fill="none"><ellipse cx="54" cy="35" rx="34" ry="20" fill="#118AB2"/><polygon points="84,35 112,18 112,52" fill="#0E7294"/><path d="M44 16 Q56 4 64 17" fill="#FFD166"/><circle cx="34" cy="31" r="4" fill="#FFFFFF"/><circle cx="33" cy="31" r="2" fill="#1D3557"/></svg>`,
    frog: `<svg viewBox="0 0 110 90" fill="none"><ellipse cx="55" cy="54" rx="30" ry="22" fill="#06D6A0"/><circle cx="40" cy="34" r="10" fill="#06D6A0"/><circle cx="70" cy="34" r="10" fill="#06D6A0"/><circle cx="40" cy="33" r="5" fill="#FFFFFF"/><circle cx="70" cy="33" r="5" fill="#FFFFFF"/><circle cx="40" cy="33" r="2.5" fill="#1D3557"/><circle cx="70" cy="33" r="2.5" fill="#1D3557"/><path d="M43 56 Q55 65 67 56" stroke="#035941" stroke-width="3" stroke-linecap="round"/><ellipse cx="26" cy="66" rx="11" ry="6" fill="#049A73"/><ellipse cx="84" cy="66" rx="11" ry="6" fill="#049A73"/></svg>`,
    amoeba: `<svg viewBox="0 0 100 90" fill="none"><path d="M22 44 C12 24 38 14 54 24 C68 12 88 26 80 46 C92 64 72 80 52 72 C32 82 14 66 22 44 Z" fill="#9EE6FA" stroke="#118AB2" stroke-width="3"/><circle cx="48" cy="46" r="10" fill="#1D3557" opacity="0.65"/><circle cx="64" cy="36" r="5" fill="#FFFFFF"/></svg>`,
    hydra: `<svg viewBox="0 0 90 120" fill="none"><path d="M45 112 L45 48" stroke="#049A73" stroke-width="10" stroke-linecap="round"/><path d="M45 72 Q62 62 68 50" stroke="#06D6A0" stroke-width="6" stroke-linecap="round"/><path d="M45 48 Q28 24 18 16" stroke="#049A73" stroke-width="4" stroke-linecap="round"/><path d="M45 48 Q38 18 36 10" stroke="#049A73" stroke-width="4" stroke-linecap="round"/><path d="M45 48 Q54 18 58 10" stroke="#049A73" stroke-width="4" stroke-linecap="round"/><path d="M45 48 Q64 26 74 18" stroke="#049A73" stroke-width="4" stroke-linecap="round"/></svg>`,
    planaria: `<svg viewBox="0 0 120 60" fill="none"><path d="M16 30 Q36 12 66 22 Q94 26 108 30 Q94 36 66 40 Q36 48 16 30 Z" fill="#FFB3B3" stroke="#FF6B6B" stroke-width="3"/><circle cx="28" cy="26" r="2.6" fill="#1D3557"/><circle cx="28" cy="34" r="2.6" fill="#1D3557"/></svg>`,
  };

  const presets = {
    plants: [
      { type: 'fern', cls: 'ambient-sprite--sway', style: 'left:2%; bottom:6%; width:92px; animation-delay:-1s;' },
      { type: 'fern', cls: 'ambient-sprite--sway', style: 'right:3%; bottom:8%; width:104px; animation-delay:-4s;' },
      { type: 'flower', cls: 'ambient-sprite--float', style: 'left:7%; top:18%; width:76px; animation-delay:-2s;' },
      { type: 'flower', cls: 'ambient-sprite--float', style: 'right:8%; top:24%; width:68px; animation-delay:-7s;' },
      { type: 'bryophyllum', cls: 'ambient-sprite--glide-right', style: 'top:42%; width:86px; animation-duration:28s; animation-delay:-6s;' },
      { type: 'spores', cls: 'ambient-sprite--spore', style: 'left:14%; top:62%; width:64px; animation-delay:-3s;' },
      { type: 'spores', cls: 'ambient-sprite--spore', style: 'right:16%; top:55%; width:58px; animation-delay:-8s;' },
    ],
    animals: [
      { type: 'fish', cls: 'ambient-sprite--glide-right', style: 'top:22%; width:92px; animation-duration:24s; animation-delay:-5s;' },
      { type: 'planaria', cls: 'ambient-sprite--glide-left', style: 'top:64%; width:88px; animation-duration:28s; animation-delay:-11s;' },
      { type: 'frog', cls: 'ambient-sprite--float', style: 'right:5%; top:28%; width:86px; animation-delay:-2s;' },
      { type: 'amoeba', cls: 'ambient-sprite--float', style: 'left:4%; top:34%; width:82px; animation-delay:-6s;' },
      { type: 'hydra', cls: 'ambient-sprite--sway', style: 'left:3%; bottom:6%; width:76px; animation-delay:-1s;' },
      { type: 'hydra', cls: 'ambient-sprite--sway', style: 'right:4%; bottom:8%; width:82px; animation-delay:-4s;' },
    ],
    mixed: [
      { type: 'fern', cls: 'ambient-sprite--sway', style: 'left:2%; bottom:6%; width:92px; animation-delay:-1s;' },
      { type: 'hydra', cls: 'ambient-sprite--sway', style: 'right:3%; bottom:8%; width:78px; animation-delay:-3s;' },
      { type: 'flower', cls: 'ambient-sprite--float', style: 'left:6%; top:20%; width:72px; animation-delay:-2s;' },
      { type: 'frog', cls: 'ambient-sprite--float', style: 'right:6%; top:24%; width:80px; animation-delay:-5s;' },
      { type: 'fish', cls: 'ambient-sprite--glide-right', style: 'top:48%; width:88px; animation-duration:27s; animation-delay:-8s;' },
      { type: 'bryophyllum', cls: 'ambient-sprite--glide-left', style: 'top:72%; width:84px; animation-duration:31s; animation-delay:-12s;' },
      { type: 'amoeba', cls: 'ambient-sprite--float', style: 'left:8%; top:66%; width:70px; animation-delay:-9s;' },
    ],
  };

  const list = pageId === 'plants' ? presets.plants : pageId === 'animals' ? presets.animals : presets.mixed;
  const layer = document.createElement('div');
  layer.className = 'ambient-lesson-bg';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = list
    .map((item) => `<div class="ambient-sprite ${item.cls}" style="${item.style}">${svgs[item.type] || ''}</div>`)
    .join('');

  document.body.insertBefore(layer, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
  initAmbientLessonBackground();
  initGlobalControls();
  initRevealButtons();
  initClassifiers();
  initPlantsPage();
  initAnimalsPage();
  initConceptMapPage();
  initQuizPage();
  initGamesPage();
  initLightbox();
  initCharts();
  initPdfViewer();
});
