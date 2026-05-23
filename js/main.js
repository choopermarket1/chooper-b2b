// ═══════════════════════════════════════════════════════════════
// CHOOPER B2B · main.js
// 폼 제출 + 5가지 전환 치트키
// ═══════════════════════════════════════════════════════════════

const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL';

// ───────── 폼 제출 ─────────
document.querySelectorAll('form[data-form]').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('formStatus');
    const submitBtn = form.querySelector('button[type=submit]');
    const formType = form.dataset.form;

    submitBtn.disabled = true;
    submitBtn.textContent = '전송 중...';
    if (status) { status.className = 'form-status'; status.textContent = ''; }

    const data = { _form: formType, _at: new Date().toISOString() };
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) {
      if (data[k]) {
        data[k] = Array.isArray(data[k]) ? [...data[k], v] : [data[k], v];
      } else {
        data[k] = v;
      }
    }
    Object.keys(data).forEach(k => {
      if (Array.isArray(data[k])) data[k] = data[k].join(', ');
    });

    try {
      if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL') {
        // mailto fallback
        const mailBody = Object.entries(data)
          .filter(([k]) => !k.startsWith('_'))
          .map(([k, v]) => `${k}: ${v}`).join('\n');
        const subject = `[CHOOPER B2B] ${formType} 신청 — ${data.company || '거래처'}`;
        window.location.href = `mailto:choopermarket1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
        if (status) { status.classList.add('success'); status.textContent = '✓ 메일 앱이 열립니다. 그대로 발송해 주세요.'; }
        submitBtn.disabled = false;
        submitBtn.textContent = '전송 완료';
        return;
      }

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });

      if (status) {
        status.classList.add('success');
        status.innerHTML = '✓ 신청이 접수되었습니다.<br>1영업일 내 등록하신 이메일로 회신드리겠습니다.';
      }
      form.reset();
      if (typeof updateQuote === 'function') updateQuote();
      submitBtn.textContent = '✓ 접수 완료';
      setTimeout(() => {
        submitBtn.disabled = false;
        const labels = { brochure: '제품 소개서 받기', sample: '무료 샘플 신청', inquiry: '거래 문의 보내기' };
        submitBtn.textContent = labels[formType] || '제출';
      }, 4000);
    } catch (err) {
      console.error(err);
      if (status) {
        status.classList.add('error');
        status.textContent = '✗ 일시적 오류 발생. choopermarket1@gmail.com 으로 직접 연락 부탁드립니다.';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = '다시 시도';
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 🎯 CONVERSION CHEATS
// ═══════════════════════════════════════════════════════════════

// ───────── 1. 스크롤 진행 게이지 + 스티키 바 ─────────
const scrollProgress = document.getElementById('scrollProgress');
const stickyBar = document.getElementById('stickyBar');
let stickyBarShown = false;

window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  if (scrollProgress) scrollProgress.style.width = scrolled + '%';

  // 스티키 바: 25% 이상 스크롤 시 등장, 95% 도달 시 사라짐
  if (stickyBar) {
    if (scrolled > 25 && scrolled < 92) {
      if (!stickyBarShown) {
        stickyBar.classList.add('show');
        stickyBarShown = true;
      }
    } else if (stickyBarShown && (scrolled <= 25 || scrolled >= 92)) {
      stickyBar.classList.remove('show');
      stickyBarShown = false;
    }
  }
}, { passive: true });

// ───────── 2. 실시간 소셜 프루프 토스트 ─────────
const TOAST_DATA = [
  { emoji: '🍷', region: '강남구', biz: '와인바', action: '샘플 신청', time: '방금 전' },
  { emoji: '🏨', region: '해운대', biz: '5성 호텔', action: '거래 문의', time: '5분 전' },
  { emoji: '💒', region: '청담동', biz: '웨딩홀', action: '제품 소개서 다운로드', time: '12분 전' },
  { emoji: '☕', region: '성수동', biz: '프리미엄 카페', action: '샘플 박스 신청', time: '23분 전' },
  { emoji: '🍽', region: '한남동', biz: '파인 다이닝', action: '거래 문의', time: '35분 전' },
  { emoji: '🛍', region: '서울', biz: '백화점 식품관', action: '대량 발주 견적', time: '1시간 전' },
  { emoji: '🏢', region: '판교', biz: 'IT 기업 후생복지', action: '제품 소개서 요청', time: '2시간 전' },
  { emoji: '🤰', region: '강남', biz: '산후조리원', action: '샘플 박스 신청', time: '3시간 전' },
];
const toastStack = document.getElementById('toastStack');
let toastIdx = 0;
function showToast() {
  if (!toastStack) return;
  const t = TOAST_DATA[toastIdx % TOAST_DATA.length];
  toastIdx++;

  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <span class="toast-emoji">${t.emoji}</span>
    <div class="toast-body">
      <strong>${t.region}</strong> ${t.biz}에서 <br>${t.action}
      <small>${t.time}</small>
    </div>
  `;
  toastStack.appendChild(el);

  // 5초 후 사라짐
  setTimeout(() => {
    el.classList.add('exit');
    setTimeout(() => el.remove(), 350);
  }, 5000);
}
// 첫 토스트는 8초 뒤, 이후 14초마다
setTimeout(() => {
  showToast();
  setInterval(showToast, 14000);
}, 8000);

// ───────── 3. 이탈 의도 팝업 (마우스 위로 빠져나갈 때) ─────────
const exitPop = document.getElementById('exitPop');
let exitShown = sessionStorage.getItem('exitShown') === '1';
let exitMinTime = false;

// 페이지 진입 후 8초가 지난 다음에만 활성화 (너무 빨리 뜨면 짜증)
setTimeout(() => { exitMinTime = true; }, 8000);

document.addEventListener('mouseleave', (e) => {
  if (e.clientY > 0) return; // 상단으로만
  if (exitShown || !exitMinTime || !exitPop) return;
  showExitPop();
});

// 모바일에서는 빠른 위로 스크롤 시 등장 (이탈 시그널)
let lastScrollY = window.scrollY;
let upScrollFast = 0;
window.addEventListener('scroll', () => {
  const dy = lastScrollY - window.scrollY;
  if (dy > 30) upScrollFast += dy;
  else upScrollFast *= 0.5;
  lastScrollY = window.scrollY;
  if (upScrollFast > 200 && !exitShown && exitMinTime && window.innerWidth < 768) {
    showExitPop();
    upScrollFast = 0;
  }
}, { passive: true });

function showExitPop() {
  if (!exitPop) return;
  exitPop.hidden = false;
  exitShown = true;
  sessionStorage.setItem('exitShown', '1');
}
function closeExitPop() {
  if (!exitPop) return;
  exitPop.hidden = true;
}
window.closeExitPop = closeExitPop;

// 팝업 외부 클릭 시 닫기
exitPop?.addEventListener('click', (e) => {
  if (e.target === exitPop) closeExitPop();
});
// ESC 키로 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && exitPop && !exitPop.hidden) closeExitPop();
});

// 팝업 폼 제출
document.getElementById('exitForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const btn = e.target.querySelector('button');
  btn.textContent = '발송 중...';
  btn.disabled = true;

  // 데이터 (현재는 mailto fallback)
  const subject = '[CHOOPER B2B] 제품 소개서 요청 (Exit 팝업)';
  const body = `이메일: ${email}\n\n자동: 이탈 시점 소개서 요청`;
  const mailto = `mailto:choopermarket1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  setTimeout(() => {
    window.open(mailto, '_blank');
    btn.textContent = '✓ 발송됨';
    setTimeout(closeExitPop, 1200);
  }, 600);
});

// ───────── 4. 스크롤 페이드인 (섹션 등장 효과) ─────────
const fadeTargets = document.querySelectorAll('.story-text, .story-img, .award, .prod, .step, .apps li, .quote-section');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
fadeTargets.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity .8s cubic-bezier(.16,1,.3,1) ${i * 60}ms, transform .8s cubic-bezier(.16,1,.3,1) ${i * 60}ms`;
  observer.observe(el);
});

// ═══════════════════════════════════════════════════════════════
// 🔊 클릭감 + 사운드 — 리플 효과 + Web Audio 클릭음
// ═══════════════════════════════════════════════════════════════

const TACTILE_SELECTOR = '.btn, .nav-cta, .sticky-cta, .float-btn, .step, .vn, .rnd-card, .faq-item summary, button[type=submit], a.btn-cream, a.btn-line';

// ───────── Web Audio 컨텍스트 (lazy init on first gesture) ─────────
let audioCtx = null;
let soundEnabled = true;

function ensureAudio() {
  if (audioCtx) return audioCtx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  } catch (_) {
    return null;
  }
  return audioCtx;
}

function playClickSound(opts = {}) {
  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const isHeavy = opts.heavy === true;

  // 1) 낮은 톡(투명한 어택)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(isHeavy ? 180 : 220, now);
  osc1.frequency.exponentialRampToValueAtTime(isHeavy ? 60 : 80, now + 0.08);
  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.exponentialRampToValueAtTime(isHeavy ? 0.18 : 0.12, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.1);

  // 2) 높은 핑(소프트 클릭 sparkle)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(isHeavy ? 900 : 1400, now);
  osc2.frequency.exponentialRampToValueAtTime(isHeavy ? 600 : 1000, now + 0.05);
  gain2.gain.setValueAtTime(0.0001, now);
  gain2.gain.exponentialRampToValueAtTime(isHeavy ? 0.04 : 0.06, now + 0.003);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.07);
}

// ───────── 호버 사운드 (살짝 더 조용) ─────────
function playHoverSound() {
  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') return; // 첫 제스처 전엔 호버 무시

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2200, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.025, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

// ───────── 리플 생성 ─────────
function spawnRipple(e) {
  const target = e.currentTarget;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  // 클릭 좌표 (touch / mouse 둘 다 대응)
  const point = e.touches?.[0] || e.changedTouches?.[0] || e;
  const x = (point.clientX || rect.left + rect.width/2) - rect.left - size/2;
  const y = (point.clientY || rect.top + rect.height/2) - rect.top - size/2;

  const ripple = document.createElement('span');
  ripple.className = 'tap-ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  // overflow:hidden 강제 (스타일 충돌 회피)
  const prevPos = getComputedStyle(target).position;
  if (prevPos === 'static') target.style.position = 'relative';
  const prevOverflow = getComputedStyle(target).overflow;
  if (prevOverflow !== 'hidden') target.style.overflow = 'hidden';

  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ───────── 바인딩 ─────────
function bindTactile() {
  document.querySelectorAll(TACTILE_SELECTOR).forEach(el => {
    if (el.dataset.tactileBound) return;
    el.dataset.tactileBound = '1';

    el.addEventListener('pointerdown', (e) => {
      spawnRipple(e);
      const heavy = el.classList.contains('float-btn') || el.tagName === 'BUTTON';
      playClickSound({ heavy });
      // 햅틱 (모바일)
      if (navigator.vibrate) navigator.vibrate(heavy ? 18 : 10);
    });

    el.addEventListener('mouseenter', playHoverSound);
  });
}

bindTactile();
// 동적으로 추가되는 요소(토스트 등)는 한 번 더 바인딩
setTimeout(bindTactile, 1500);

// ───────── 사운드 토글 (선택) ─────────
window.toggleClickSound = () => {
  soundEnabled = !soundEnabled;
  console.log('CHOOPER click sound:', soundEnabled ? 'ON' : 'OFF');
};
