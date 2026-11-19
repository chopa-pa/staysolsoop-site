// 스테이솔숲 홈페이지 동작: 펼침 메뉴, 탭(주변·사용법), 사용법 접기, 이용안내 동의 → 예약 버튼, 주소 복사
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 펼침 메뉴(1024px 미만)
  const menu = $("#menu"), burger = $(".burger"), closeBtn = $(".menu-x");
  const setMenu = (on) => {
    menu.hidden = !on;
    burger.setAttribute("aria-expanded", String(on));
    document.documentElement.classList.toggle("lock", on);
    (on ? closeBtn : burger).focus();
  };
  burger.addEventListener("click", () => setMenu(true));
  closeBtn.addEventListener("click", () => setMenu(false));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });
  // 넓어지면 메뉴 강제로 닫음
  matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches && !menu.hidden) { menu.hidden = true; burger.setAttribute("aria-expanded", "false"); document.documentElement.classList.remove("lock"); }
  });

  // 탭(주변 분류·이용안내 사용법): 탭 묶음마다 같은 칸 안의 .grp만 바꿈
  $$(".tabs").forEach((bar) => {
    const tabs = $$('[role="tab"]', bar), grps = $$(".grp", bar.parentElement);
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.setAttribute("aria-selected", String(x === t)));
      grps.forEach((g) => { g.hidden = t.dataset.f !== "all" && g.dataset.g !== t.dataset.f; });
    }));
  });

  // 사용법 그림 넘기기: 그림 2장 이상이면 아래 점으로 몇 번째인지 표시(넘칠 때만)
  $$(".grp.toons").forEach((g) => {
    const imgs = $$("img", g);
    if (imgs.length < 2) return;
    const dots = document.createElement("div");
    dots.className = "dots"; dots.hidden = g.hidden;
    dots.innerHTML = imgs.map(() => "<span></span>").join("");
    g.after(dots);
    const sync = () => {
      dots.hidden = g.hidden || g.scrollWidth <= g.clientWidth + 2;
      const mid = g.scrollLeft + g.clientWidth / 2;
      let k = 0, best = Infinity;
      imgs.forEach((im, i) => { const d = Math.abs(im.offsetLeft + im.offsetWidth / 2 - mid); if (d < best) { best = d; k = i; } });
      $$("span", dots).forEach((s, i) => s.classList.toggle("on", i === k));
    };
    g.addEventListener("scroll", sync, { passive: true });
    new MutationObserver(sync).observe(g, { attributes: true, attributeFilter: ["hidden"] });
    addEventListener("resize", sync);
    imgs.forEach((im) => im.addEventListener("load", sync));
    sync();
  });

  // 이용안내 사용법: 접힌 채 시작, 제목 누르면 펼침/접음
  $$(".manual").forEach((m) => {
    const btn = $(".manual-toggle", m), inner = $(".manual-in", m);
    const set = (open) => { m.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); inner.inert = !open; };
    m.classList.add("fold"); set(false);
    btn.addEventListener("click", () => set(!m.classList.contains("open")));
  });

  // 이용안내 동의 → 예약 버튼
  const agree = $("#agree"), book = $("#agree-book");
  if (agree && book) {
    const sync = () => book.setAttribute("aria-disabled", String(!agree.checked));
    agree.addEventListener("change", sync); sync();
    book.addEventListener("click", (e) => { if (!agree.checked) e.preventDefault(); });
  }

  // 주소 복사 → 2초 동안 「복사했어요」(인앱 브라우저 등 clipboard 막히면 예전 방식)
  const copyText = async (s) => {
    try { await navigator.clipboard.writeText(s); return true; } catch {}
    const ta = document.createElement("textarea");
    ta.value = s; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  };
  $$(".copy").forEach((b) => {
    let t;
    b.addEventListener("click", async () => {
      if (!(await copyText(b.dataset.copy))) return;
      b.textContent = "복사했어요";
      clearTimeout(t); t = setTimeout(() => (b.textContent = "주소 복사"), 2000);
    });
  });
})();

// 안내 글 줄 내림(11-15 쵸파파 「말 단위로」): span.s 한 줄이 넘치면 화면 폭을 재서 「~이며,」「~하거나」「~는」 같은 말 단위 뒤에서 내림
(() => {
  const PR = [/(?<=\S)(며|고|서|면|지만|는데|니다|어|여|라|로|에), /g, /(?<!그리)(거나|면서|는데|지만|어서|아서|니까|도록|려고|으며|며|고|면|서|다가|이라|있어|없어|해서|하여|위해|의해|따라|경우|때|때문에) /g,
    /(?<=\S)(는|은|이|가|을|를|에서|에는|도) |, /g, / /g];
  const wrap = () => {
    for (const s of document.querySelectorAll('span.s')) {
      if (!s.dataset.t) s.dataset.t = s.textContent;
      const p = s.parentElement, cs = getComputedStyle(p);
      const W = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (!W || s.dataset.w == W) continue;   // 숨은 탭은 열릴 때, 같은 폭이면 그대로
      s.dataset.w = W;
      s.textContent = s.dataset.t;
      const pr = document.createElement('span');
      pr.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      p.appendChild(pr);
      const w = (t) => { pr.textContent = t; return pr.getBoundingClientRect().width; };
      let rest = s.dataset.t, out = [], g = 0;
      while (w(rest) > W && g++ < 8) {
        let best = -1;
        for (const [pi, rx] of PR.entries()) {
          rx.lastIndex = 0; let m;
          while ((m = rx.exec(rest))) {
            const k = m.index + m[0].length, head = rest.slice(0, k).trimEnd(), hw = w(head);
            if (hw > W) break;
            if (rest.length - k >= 9 && (hw >= W * 0.35 || (pi <= 1 && w(rest.slice(k)) <= W))) best = k;   // 이음말 뒤는 나머지가 한 줄이면 첫 줄이 짧아도 됨
          }
          if (best > 0) break;
        }
        if (best < 0) break;
        out.push(rest.slice(0, best).trimEnd()); rest = rest.slice(best);
      }
      out.push(rest);
      pr.remove();
      if (out.length > 1) { s.textContent = ''; out.forEach((t, i) => { if (i) s.appendChild(document.createElement('br')); s.appendChild(document.createTextNode(t)); }); }
    }
  };
  let lastW = 0, tm;
  const run = () => { if (innerWidth !== lastW) { lastW = innerWidth; wrap(); } };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(run);
  addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(run, 150); });
  addEventListener('click', () => setTimeout(wrap, 60));   // 탭·접기 열린 뒤
})();

// 공간 슬라이드: 작은 사진 누르면 이동, 지금 사진 표시, 화면에 보일 때만 6초마다 자동으로 넘김(손대면 멈춤)
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.gallery, .hero-gl').forEach(g => {   // .hero-gl = 주변 첫 사진 여러 장(점으로 표시)
    const tr = g.querySelector('.gl-track'), th = [...g.querySelectorAll('.gl-thumb')], n = th.length;
    let cur = 0, auto = !still, seen = false;
    const go = i => { cur = (i + n) % n; tr.scrollTo({ left: cur * tr.clientWidth }); };
    const mark = () => { cur = Math.round(tr.scrollLeft / tr.clientWidth); th.forEach((b, i) => b.classList.toggle('on', i === cur)); };
    th.forEach((b, i) => b.addEventListener('click', () => { auto = false; go(i); }));
    tr.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    ['pointerdown', 'wheel', 'keydown'].forEach(ev => tr.addEventListener(ev, () => { auto = false; }, { passive: true }));
    new IntersectionObserver(es => { seen = es[0].isIntersecting; }, { threshold: .6 }).observe(tr);
    mark();
    if (n > 1) setInterval(() => { if (auto && seen && !document.hidden) go(cur + 1); }, 6000);
  });
})();
