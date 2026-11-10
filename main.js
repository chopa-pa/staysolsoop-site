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
