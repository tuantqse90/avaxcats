"""Build output/preview.html — review page for the AvaxCats collection.

Avalanche treatment: near-black summit terminal, AVAX red #E84142,
marquee ticker, curated 1/1 LEGENDS, and snow-burst confetti on every
click. Embeds thumbs + catalog as data URIs — fully self-contained.
"""

import base64
import json
import os
import random

from engine import save_grid
from generate import render, rarity_score
from traits import CATEGORIES

OUT = "output"
# ❓ dict(CATEGORIES) làm gì?
# → CATEGORIES là list các cặp (tên, list trait); dict() biến nó thành map tên → list
# → để tra cứu nhanh theo tên category (pickt dùng).
CATS = dict(CATEGORIES)

TIER_VI = {"common": "Common", "uncommon": "Uncommon", "rare": "Rare",
           "epic": "Epic", "legendary": "Legendary"}


def datauri(path):
    with open(path, "rb") as f:
        # ❓ Tại sao preview.html nhúng ảnh dạng data URI?
        # → Đọc PNG binary → base64 → gắn tiền tố data:image/png. Trang HTML thành một file duy nhất,
        # → gửi qua Telegram/Zalo mở là xem được, không cần thư mục ảnh đi kèm.
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


def pickt(cat, name):
    return next(t for t in CATS[cat] if t["name"] == name)


# ❓ BASE là gì?
# → Bộ trait "trần" mặc định (mèo cam, ngồi, không phụ kiện). Legends chỉ cần khai báo phần
# → khác biệt, phần còn lại lấy từ đây — giống cách catalog() trong generate.py làm.
BASE = {"Background": "Frost", "Fur": "Orange Tabby",


        "Body": "Sitting", "Head": "Normal", "Ears": "Pointy",
        "Mane": "None", "Whiskers": "Short", "Belly": "Classic",
        "Pattern": "Plain",
        "Eyes": "Normal", "Mouth": "Smile", "Headwear": "None",
        "Eyewear": "None", "Outfit": "None", "Paw Item": "None",
        "Earring": "None", "Tail": "Normal", "Effect": "None"}


def combo(**over):
    # ❓ dict(BASE, **over) hoạt động thế nào?
    # → Copy BASE rồi ghi đè bằng các keyword truyền vào (Fur="Golden"…). Kết quả là dict
    # → tên category → trait dict, đúng định dạng mà generate.render mong đợi.
    names = dict(BASE, **over)
    return {c: pickt(c, n) for c, n in names.items()}


# ❓ Legends khác mèo random ở chỗ nào?
# → 4 con 1/1 được "tay chọn" từng trait, không qua weighted random và không nằm trong 48 con của batch.
# → Dùng cho auction/giveaway; vì tự chọn nên không tính rarity score (score=None).
LEGENDS = [
    ("The Snowfather",
     "Wears The Avalanche Hood, chews a cigar, laser eyes locked on the tape, Red Card in paw. Final boss of the summit.",
     combo(Background="Green Candles", Fur="Avalanche Red", Eyes="Laser Eyes",
           Mouth="Cigar", Headwear="The Avalanche Hood", Tail="Flame Tail",
           Body="Standing", Belly="Bib", Whiskers="Long", Ears="Tufted",
           Effect="Avalanche Aura", **{"Paw Item": "AVAX Red Card"})),
    ("Sir Stonks",
     "Gold from whiskers to tail. Monocle, suit, trophy — old money, new coin.",
     combo(Background="Solid Gold", Fur="Golden", Mouth="Gold Tooth Grin",
           Headwear="Crown", Eyewear="Monocle", Outfit="Suit & Tie",
           Earring="Gold Cross", Tail="Coin Tail", Effect="Coin Rain",
           Body="Standing", Head="Square", Whiskers="Perky", Belly="Chest Star",
           **{"Paw Item": "Golden Trophy"})),
    ("Moon Mission",
     "Diamond eyes, AVAX hoodie, rocket in paw. Not selling. WAGMI.",
     combo(Background="Night Purple", Fur="White", Eyes="Diamond Eyes",
           Outfit="AVAX Hoodie", Earring="Diamond Stud", Tail="Star Tail",
           Body="Wisp", Ears="Big", Whiskers="Long", Belly="Chest Star",
           Effect="To The Moon", **{"Paw Item": "Rocket"})),
    ("Blizzard Bandit",
     "Black cat, summit cap, ice axe — rides the avalanche down, buys the bottom.",
     combo(Background="Avalanche Red", Fur="Black", Mouth="Smirk",
           Headwear="Summit Cap", Outfit="Bandana", Earring="Gold Hoop",
           Body="Slim", Ears="Notched", Mane="Sideburns", Belly="Socks",
           Effect="Snowstorm", **{"Paw Item": "Ice Axe"})),
]


def build_legends():
    ldir = os.path.join(OUT, "legends")
    os.makedirs(ldir, exist_ok=True)
    out = []
    for i, (name, tag, chosen) in enumerate(LEGENDS):
        # ❓ Tại sao vẫn cần Random dù trait đã chọn sẵn?
        # → Vài background/effect (Moon Night, Money Rain) rải pixel bằng rng. Seed cố định 9000+i
        # → để legend render giống hệt mỗi lần build — không đổi hình sau mỗi lần chạy.
        g = render(chosen, random.Random(9000 + i))
        path = os.path.join(ldir, f"legend_{i}.png")
        save_grid(path, g, scale=1)
        save_grid(os.path.join(ldir, f"legend_{i}_512.png"), g, scale=16)
        out.append({
            "name": name, "tag": tag, "img": datauri(path),
            "attrs": [[c, t["name"], t["tier"]] for c, t in chosen.items()],
            "score": None,
        })
    return out


def load_tokens():
    tokens = []
    meta_dir = os.path.join(OUT, "metadata")
    for fn in sorted(os.listdir(meta_dir)):
        if not fn.endswith(".json"):
            continue
        with open(os.path.join(meta_dir, fn)) as f:
            m = json.load(f)
        idx = fn[:-5]
        tokens.append({
            "name": m["name"],
            "img": datauri(os.path.join(OUT, "thumbs", idx + ".png")),
            # ❓ Vì sao chuyển attributes từ dict sang list 3 phần tử?
            # → Gộp trait_type, value và tier thành [cat, name, tier] cho JS hiển thị chip màu theo tier.
            # → Dạng list ngắn hơn dict → preview.html nhẹ hơn khi nhúng cả 48 token.
            "attrs": [[a["trait_type"], a["value"],
                       m["rarity"]["tiers"][a["trait_type"]]]
                      for a in m["attributes"]],
            "score": m["rarity"]["score"],
        })
    return tokens


def load_catalog():
    cdir = os.path.join(OUT, "catalog")
    # ❓ catalog.json từ đâu ra?
    # → Do `python3 generate.py --catalog` sinh: mỗi trait một ảnh trên base cat + index tên/tier/file.
    # → Preview chỉ đọc lại, không render — nên phải chạy --catalog trước khi build preview.
    with open(os.path.join(cdir, "catalog.json")) as f:
        index = json.load(f)
    out = {}
    for cat, items in index.items():
        out[cat] = [{"name": it["name"], "tier": it["tier"],
                     "img": datauri(os.path.join(cdir, it["file"]))}
                    for it in items]
    return out


CSS = """
@import url("https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;900&family=Geist+Mono:wght@400;700&display=swap");
:root {
  color-scheme: dark;
  --avax: #e6212f; --ink: #1f1f1f; --frost: #ebf0fa; --steel: #a2afb2;
  --bg: #0a0a0a; --fg: #fafafa; --muted: #a1a1aa;
  --line: #27272a; --line-strong: #3f3f46; --surface: #09090b; --hover: #18181b;
  --green: #34d399; --gold: #fbbf24; --blue: #60a5fa; --purple: #a78bfa;
  --sans: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
html { -webkit-tap-highlight-color: transparent; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font-family: var(--sans); font-size: 15px; line-height: 1.6;
  -webkit-font-smoothing: antialiased; overflow-x: clip;
}
button { touch-action: manipulation; }
a { color: inherit; }
img.px { image-rendering: pixelated; display: block; }
.wrap { width: 100%; max-width: 80rem; margin: 0 auto; padding: 0 20px 96px; }
::selection { background: rgb(230 33 47 / .25); }
:focus-visible { outline: 2px solid var(--avax); outline-offset: 2px; }
.eyebrow, .tk, .cap, .hero-stats, .cat-head .n, th, .attr .k, footer, .score {
  font-family: var(--mono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase;
}

/* ---- marquee ticker ---- */
.ticker {
  display: flex; overflow: hidden; border-bottom: 1px solid var(--line);
  background: var(--surface); padding: 12px 0;
}
.tk {
  display: flex; gap: 40px; padding-right: 40px; flex: none;
  color: var(--muted); white-space: nowrap;
  animation: tick 40s linear infinite;
}
@keyframes tick { to { transform: translateX(-100%); } }
.tk .up { color: var(--green); }
.tk .dn { color: var(--avax); }
.tk .au { color: var(--gold); }
@media (prefers-reduced-motion: reduce) {
  .tk { animation: none; }
  .tk[aria-hidden] { display: none; }
}

/* ---- hero ---- */
header.hero {
  position: relative; display: flex; gap: 32px; align-items: center; flex-wrap: wrap;
  padding: 48px 0 40px;
}
@media (min-width: 900px) { header.hero { gap: 48px; padding: 80px 0 56px; } }
header.hero::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(var(--line-strong) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse at 50% 40%, black 20%, transparent 72%);
}
.hero-copy { position: relative; flex: 1 1 420px; }
#wordmark { display: flex; align-items: flex-end; gap: 18px; color: var(--fg); }
#wordmark svg.feather { width: 52px; flex: none; }
#wordmark svg.word { width: min(460px, 100%); height: auto; }
.tagline {
  color: var(--muted); font-size: 15px; line-height: 1.7; margin-top: 24px; max-width: 60ch;
}
.tagline b { color: var(--fg); font-weight: 500; }
.hero-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px; background: var(--surface); border: 1px solid var(--line);
  margin-top: 28px; color: var(--muted);
}
.hero-stats > div { display: flex; flex-direction: column-reverse; gap: 6px; padding: 14px 16px; background: var(--surface); outline: 1px solid var(--line); }
.hero-stats b {
  font-family: var(--mono); font-weight: 400; color: var(--fg); font-size: 22px;
  letter-spacing: -.02em; text-transform: none; font-variant-numeric: tabular-nums;
}
.hero-cat { position: relative; flex: none; text-align: center; }
.hero-cat { width: 100%; }
.hero-cat img.px {
  width: 200px; height: 200px; margin: 0 auto; border: 1px solid var(--line); background: var(--surface);
}
@media (min-width: 900px) { .hero-cat { width: auto; } .hero-cat img.px { width: 240px; height: 240px; } }
.hero-cat .cap { color: var(--muted); margin-top: 12px; }

/* ---- sections ---- */
section { margin-top: 88px; }
h2 {
  margin: 0 0 12px; font-size: 1.75rem; font-weight: 900; line-height: .95;
  letter-spacing: -.01em; text-transform: uppercase; color: var(--fg); text-wrap: balance;
}
h2::after { content: "."; color: var(--avax); }
@media (min-width: 640px) { h2 { font-size: 3rem; } }
.sub { color: var(--muted); font-size: 15px; line-height: 1.7; margin: 0 0 28px; max-width: 42rem; }
.sub b { color: var(--fg); font-weight: 500; }

/* ---- legends ---- */
.legends {
  display: grid; gap: 1px; background: var(--surface); border: 1px solid var(--line);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.legend {
  all: unset; cursor: pointer; display: block; box-sizing: border-box;
  background: var(--surface); padding: 16px; outline: 1px solid var(--line); transition: background .15s;
}
.legend:hover, .legend:focus-visible { background: var(--hover); outline: none; }
.legend img.px { width: 100%; height: auto; }
.legend .ln { font-size: 18px; font-weight: 300; letter-spacing: -.02em; color: var(--fg); margin: 14px 0 4px; }
.legend .lt { font-size: 13px; color: var(--muted); line-height: 1.5; min-height: 56px; }
.legend .chip { margin-top: 12px; }

/* ---- sample grid ---- */
.grid {
  display: grid; gap: 1px; background: var(--surface); border: 1px solid var(--line);
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
}
.grid button {
  all: unset; cursor: pointer; box-sizing: border-box; position: relative;
  background: var(--surface); padding: 6px; outline: 1px solid var(--line); transition: background .15s;
}
.grid button:hover, .grid button:focus-visible {
  background: var(--hover); outline: 2px solid var(--avax); outline-offset: 0; z-index: 1;
}
.grid img.px { width: 100%; height: auto; }

/* ---- catalog ---- */
.cat-head {
  display: flex; align-items: baseline; gap: 12px; margin: 40px 0 12px;
  border-bottom: 1px solid var(--line-strong); padding-bottom: 8px;
}
.cat-head h3 {
  margin: 0; font-family: var(--mono); font-size: 11px; letter-spacing: .18em;
  text-transform: uppercase; color: var(--fg); font-weight: 700;
}
.cat-head .n { color: var(--muted); }
.traits {
  display: grid; gap: 1px; background: var(--surface); border: 1px solid var(--line);
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
}
.trait { background: var(--surface); padding: 10px 8px 12px; outline: 1px solid var(--line); }
.trait img.px { width: 92px; height: 92px; margin: 0 auto; }
.trait .tn {
  font-size: 12px; line-height: 1.3; text-align: center; margin-top: 8px;
  color: var(--fg); min-height: 30px;
}
.chip {
  display: block; width: fit-content; margin: 6px auto 0;
  font-family: var(--mono); font-size: 9.5px; letter-spacing: .12em;
  text-transform: uppercase; padding: 2px 7px; border: 1px solid; line-height: 1.5;
}
.t-common    { color: var(--muted);  border-color: var(--line-strong); }
.t-uncommon  { color: var(--green);  border-color: color-mix(in srgb, var(--green) 45%, transparent); }
.t-rare      { color: var(--blue);   border-color: color-mix(in srgb, var(--blue) 45%, transparent); }
.t-epic      { color: var(--purple); border-color: color-mix(in srgb, var(--purple) 45%, transparent); }
.t-legendary { color: var(--gold);   border-color: color-mix(in srgb, var(--gold) 45%, transparent); }
.t-curated   { color: var(--avax);   border-color: var(--avax); }

/* ---- rarity table ---- */
table { width: 100%; border-collapse: collapse; font-size: 14px; background: var(--surface); border: 1px solid var(--line); }
th, td {
  text-align: left; padding: 10px 16px; border-bottom: 1px solid var(--line);
  font-variant-numeric: tabular-nums;
}
tr:last-child td { border-bottom: 0; }
th { color: var(--muted); font-weight: 700; border-bottom: 1px solid var(--line-strong); }

/* ---- run ---- */
pre {
  background: var(--surface); border: 1px solid var(--line);
  padding: 18px 20px; overflow-x: auto; font-family: var(--mono);
  font-size: 13px; line-height: 1.7; color: var(--fg);
}
pre .c { color: var(--muted); }
pre .g { color: var(--green); }

/* ---- inspector ---- */
.overlay {
  position: fixed; inset: 0; background: rgb(0 0 0 / .6); backdrop-filter: blur(4px);
  display: none; align-items: center; justify-content: center; padding: 24px;
  z-index: 10;
}
.overlay.open { display: flex; }
.inspector {
  background: var(--surface); border: 1px solid var(--line);
  max-width: 680px; width: 100%; max-height: 90vh; overflow-y: auto;
  display: flex; gap: 20px; padding: 20px; flex-wrap: wrap;
}
.inspector img.px { width: 160px; height: 160px; flex: none; border: 1px solid var(--line); }
@media (min-width: 640px) { .inspector { gap: 28px; padding: 28px; } .inspector img.px { width: 224px; height: 224px; } }
.overlay { padding: 16px; }
.inspector .meta { flex: 1; min-width: 240px; }
.inspector h3 {
  margin: 0 0 4px; font-size: 24px; font-weight: 300; letter-spacing: -.02em; color: var(--fg);
}
.inspector .score { color: var(--gold); margin-bottom: 16px; }
.attr {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--line); padding: 7px 0; font-size: 13.5px;
}
.attr .k { color: var(--muted); }
.attr .chip { margin: 0; }
.attr .v { display: flex; align-items: center; gap: 8px; }

/* ---- confetti ---- */
.cf {
  position: fixed; width: 6px; height: 11px; z-index: 60;
  pointer-events: none; border-radius: 1px;
}
footer {
  margin-top: 96px; border-top: 1px solid var(--line); padding-top: 24px;
  color: var(--muted); line-height: 2;
}
footer a { color: var(--fg); text-decoration: none; }
footer a:hover { color: var(--avax); }
"""

JS = """
// ---- pixel wordmark + AVAX summit-triangle logo, drawn as SVG rects
const F = {
  C: [" ###", "#   ", "#   ", "#   ", " ###"],
  A: [" ## ", "#  #", "####", "#  #", "#  #"],
  S: [" ###", "#   ", " ## ", "   #", "### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  "],
  V: ["#  #", "#  #", "#  #", "#  #", " ## "],
  X: ["#  #", "#  #", " ## ", "#  #", "#  #"],
};
const TRIANGLE = [
  "....##....", "...####...", "...####...", "..##..##..",
  "..##..##..", ".########.", ".##....##.", "##......##",
  "##########",
];
function bitmapSVG(rows, fill, cls) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  let rects = "";
  rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++)
      if (row[i] === "#") rects += `<rect x="${i}" y="${y}" width="1" height="1"/>`;
  });
  return `<svg class="${cls}" viewBox="-0.5 -0.5 ${w + 1} ${h + 1}"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g fill="${fill}" shape-rendering="crispEdges">${rects}</g></svg>`;
}
(function () {
  const word = "AVAXCATS";
  let rects = [], x = 0;
  for (const ch of word) {
    const glyph = F[ch], w = glyph[0].length;
    glyph.forEach((row, y) => {
      for (let i = 0; i < w; i++)
        if (row[i] === "#")
          rects.push(`<rect x="${x + i}" y="${y}" width="1" height="1"/>`);
    });
    x += w + 1;
  }
  const word_svg = `<svg class="word" viewBox="-0.5 -0.5 ${x} 6"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AVAXCATS">
    <g fill="currentColor" shape-rendering="crispEdges">${rects.join("")}</g>
    <rect x="${x - 2}" y="0" width="1" height="1" fill="#f5c542"/></svg>`;
  document.getElementById("wordmark").innerHTML =
    bitmapSVG(TRIANGLE, "#e6212f", "feather") + word_svg;
})();

// ---- avalanche snow-burst confetti
const CF_COLORS = ["#e84142", "#ffffff", "#ff8a8a", "#a8d8f0", "#f5c542", "#7c2224"];
function burst(x, y) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 26; i++) {
    const p = document.createElement("i");
    p.className = "cf";
    p.style.background = CF_COLORS[i % CF_COLORS.length];
    p.style.left = x + "px"; p.style.top = y + "px";
    document.body.appendChild(p);
    const a = Math.random() * Math.PI * 2, v = 50 + Math.random() * 150;
    const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 130;
    p.animate(
      [{ transform: "translate(0,0) rotate(0deg)", opacity: 1 },
       { transform: `translate(${dx}px,${dy + 280}px) rotate(${420 + Math.random() * 360}deg)`,
         opacity: 0 }],
      { duration: 950 + Math.random() * 550, easing: "cubic-bezier(.15,.6,.4,1)" }
    ).onfinish = () => p.remove();
  }
}

// ---- inspector
const TOKENS = __TOKENS__;
const LEGENDS = __LEGENDS__;
const overlay = document.getElementById("overlay");
const insImg = document.getElementById("ins-img");
const insName = document.getElementById("ins-name");
const insScore = document.getElementById("ins-score");
const insAttrs = document.getElementById("ins-attrs");

function openItem(t) {
  insImg.src = t.img;
  insName.textContent = t.name;
  insScore.textContent = t.score === null
    ? "CURATED 1/1 — OUTSIDE THE RANDOM DISTRIBUTION"
    : "RARITY SCORE " + t.score.toFixed(1);
  insAttrs.innerHTML = t.attrs.map(([k, v, tier]) =>
    `<div class="attr"><span class="k">${k}</span>
     <span class="v">${v}<span class="chip t-${tier}">${tier}</span></span></div>`
  ).join("");
  overlay.classList.add("open");
}
overlay.addEventListener("click", e => {
  if (e.target === overlay) overlay.classList.remove("open");
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") overlay.classList.remove("open");
});
document.querySelectorAll(".grid button").forEach((b, i) =>
  b.addEventListener("click", e => { burst(e.clientX, e.clientY); openItem(TOKENS[i]); }));
document.querySelectorAll(".legend").forEach((b, i) =>
  b.addEventListener("click", e => { burst(e.clientX, e.clientY); openItem(LEGENDS[i]); }));
"""

TICKER = ('<span class="up">$AVAX +420.69% ▲</span>'
          '<span class="up">SUBNETS: LIVE ▲</span>'
          '<span class="au">FINALITY: &lt;1S</span>'
          '<span>__TRAITS__ TRAITS · 12 LAYERS</span>'
          '<span>SUPPLY: TBD</span>'
          '<span class="dn">PAPER HANDS −99.9% ▼</span>'
          '<span>SNOW CONSENSUS: STABLE</span>'
          '<span class="up">TEAM1 VN: WAGMI ▲</span>')


def build():
    tokens = load_tokens()
    catalog = load_catalog()
    legends = build_legends()
    with open(os.path.join(OUT, "collection.json")) as f:
        coll = json.load(f)

    # ❓ hero được chọn thế nào?
    # → Sắp xếp index token theo rarity score giảm dần và lấy con đầu tiên —
    # → con hiếm nhất batch làm ảnh đại diện ở đầu trang.
    hero = sorted(range(len(tokens)), key=lambda i: -tokens[i]["score"])[:1][0]
    total_traits = sum(len(v) for v in catalog.values())
    ticker = TICKER.replace("__TRAITS__", str(total_traits))

    h = []
    h.append('<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
             "<title>AvaxCats — Team1 VN</title>\n<meta name=\"color-scheme\" content=\"dark\">\n<meta name=\"theme-color\" content=\"#0a0a0a\">\n<style>" + CSS + "</style>")

    h.append(f'<div class="ticker"><div class="tk">{ticker}</div>'
             f'<div class="tk" aria-hidden="true">{ticker}</div></div>')

    h.append('<div class="wrap">')


    ht = tokens[hero]
    h.append(
        '<header class="hero"><div class="hero-copy">'
        '<div id="wordmark"></div>'
        '<p class="tagline">32×32 pixel summit cats repping <b>Team '
        'Avalanche</b> — <b>Team1 VN</b> 🇻🇳. Bleeding <b>AVAX red</b>, wearing '
        '<b>The Avalanche Hood</b>, riding candles down the mountain. '
        'Generated by the <b>nullcat</b> workflow: pure Python, zero '
        'dependencies, 100% reproducible from a seed.</p>'
        '<div class="hero-stats">'
        f'<div><b>{total_traits}</b>traits</div>'
        f'<div><b>{len(catalog)}</b>layers</div>'
        '<div><b>5</b>rarity tiers</div>'
        f'<div><b>{len(legends)}</b>1/1 legends</div>'
        f'<div><b>#{coll["seed"]}</b>batch seed</div>'
        '</div></div>'
        f'<div class="hero-cat"><img class="px" src="{ht["img"]}" '
        f'alt="{ht["name"]}" width="240" height="240">'
        f'<div class="cap">{ht["name"]} — RAREST IN BATCH · {ht["score"]:.0f}</div>'
        '</div></header>')


    h.append('<section><h2>Legends — curated 1/1s</h2>'
             '<p class="sub">Four hand-built one-of-ones, outside the random '
             'distribution — save them for auctions or giveaways. Click one to '
             'inspect the fit (<b>snow-burst confetti</b> included 😼).</p>'
             '<div class="legends">')
    for lg in legends:
        h.append(f'<button type="button" class="legend" aria-label="{lg["name"]}">'
                 f'<img class="px" src="{lg["img"]}" alt="" width="200" height="200">'
                 f'<div class="ln">{lg["name"]}</div>'
                 f'<div class="lt">{lg["tag"]}</div>'
                 '<span class="chip t-curated">1/1 CURATED</span></button>')
    h.append('</div></section>')


    h.append(f'<section><h2>Sample batch — {len(tokens)} cats</h2>'
             '<p class="sub">Real rolls straight from the generator — every '
             'trait combo is unique. Click any cat for confetti + full '
             'metadata.</p>'
             '<div class="grid">')
    for t in tokens:
        h.append(f'<button type="button" aria-label="{t["name"]}">'
                 f'<img class="px" src="{t["img"]}" alt="" width="96" height="96">'
                 '</button>')
    h.append('</div></section>')


    h.append(f'<section><h2>Trait catalog — {total_traits} traits / {len(catalog)} layers</h2>'
             '<p class="sub">House specials: <b>The Avalanche Hood</b>, '
             '<b>AVAX Red Card</b>, <b>Ice Axe</b>, <b>Snowflake</b>, '
             '<b>Avalanche Red</b> fur, <b>Snowfall Red</b> background, '
             '<b>Snowstorm</b> effect. '
             'Every trait rendered on the standard base cat for review.</p>')
    for cat, items in catalog.items():
        h.append(f'<div class="cat-head"><h3>{cat}</h3>'
                 f'<span class="n">{len(items)} trait</span></div><div class="traits">')
        for it in items:
            h.append(f'<div class="trait"><img class="px" src="{it["img"]}" '
                     f'alt="{it["name"]}" width="92" height="92">'
                     f'<div class="tn">{it["name"]}</div>'
                     f'<span class="chip t-{it["tier"]}">{TIER_VI[it["tier"]]}</span></div>')
        h.append('</div>')
    h.append('</section>')


    h.append('<section><h2>Rarity system</h2>'
             '<p class="sub">Five tiers, weighted rolls. Fit-coherence rules: '
             'special eyes refuse glasses on top, a VR headset resets eyes to '
             'Normal. Accessory slots get a boosted &quot;None&quot; weight so '
             'the full-swag cats actually stand out.</p>'
             '<table><tr><th>Tier</th><th>Weight</th><th>Examples</th></tr>'
             '<tr><td><span class="chip t-common">Common</span></td><td>100</td>'
             '<td>Orange Tabby, Smile, Frost</td></tr>'
             '<tr><td><span class="chip t-uncommon">Uncommon</span></td><td>55</td>'
             '<td>Cowboy Hat, Snowstorm, Scarf</td></tr>'
             '<tr><td><span class="chip t-rare">Rare</span></td><td>28</td>'
             '<td>Summit Cap, Snowflake, AVAX Hoodie</td></tr>'
             '<tr><td><span class="chip t-epic">Epic</span></td><td>12</td>'
             '<td>The Avalanche Hood, Ice Axe, Snowfall Red, Candle Eyes</td></tr>'
             '<tr><td><span class="chip t-legendary">Legendary</span></td><td>5</td>'
             '<td>AVAX Red Card, Avalanche Red, Laser Eyes, To The Moon</td></tr>'
             '</table></section>')


    h.append('<section><h2>Run the workflow</h2>'
             '<p class="sub">Four files, zero dependencies. Lock supply + seed '
             'and the official drop is mint-ready — images and metadata '
             'included.</p>'
             '<pre><span class="c"># generate the official drop</span>\n'
             'python3 generate.py --count 1000 --seed 42 --out drop\n\n'
             '<span class="c"># quick visual review via contact sheet</span>\n'
             'python3 generate.py --count 48 --sheet\n\n'
             '<span class="c"># re-render the trait catalog after adding traits</span>\n'
             'python3 generate.py --catalog\n\n'
             '<span class="c"># rebuild this preview page</span>\n'
             'python3 build_preview.py\n\n'
             '<span class="c"># each token outputs:</span> <span class="g">images/*.png '
             '(512px) · thumbs/*.png (32px) · metadata/*.json (OpenSea)</span></pre>'
             '</section>')

    h.append('<footer>TEAM AVALANCHE · TEAM1 VN 🇻🇳 — PREVIEW BUILD FOR APPROVAL, '
             'NOT THE FINAL DROP. APPROVE → LOCK SUPPLY + SEED → RUN THE '
             'FINAL BATCH. NFA · DYOR 🏔️😼<br>'
             '<a href="https://t.me/avalanche_vn" target="_blank" rel="noreferrer">TELEGRAM · AVALANCHE VN COMMUNITY</a> · '
             '<a href="https://t.me/Team1VNbuilders" target="_blank" rel="noreferrer">TELEGRAM · TEAM1 VN BUILDERS</a> · '
             '<a href="https://x.com/Team1VN" target="_blank" rel="noreferrer">X @TEAM1VN</a> · '
             '<a href="https://go.team1.network/vietnam-builder" target="_blank" rel="noreferrer">BUILDER HUB</a> · '
             '<a href="https://build.avax.network/academy?ref=HVHXK&amp;utm_source=team1" target="_blank" rel="noreferrer">ACADEMY</a> · '
             '<a href="https://github.com/tuantqse90/avaxcats" target="_blank" rel="noreferrer">GITHUB</a></footer>')
    h.append('</div>')


    h.append('<div class="overlay" id="overlay" role="dialog" aria-modal="true">'
             '<div class="inspector"><img class="px" id="ins-img" src="" alt="">'
             '<div class="meta"><h3 id="ins-name"></h3>'
             '<div class="score" id="ins-score"></div>'
             '<div id="ins-attrs"></div></div></div></div>')

    slim = [{"name": t["name"], "img": t["img"], "attrs": t["attrs"],
             "score": t["score"]} for t in tokens]
    # ❓ Dữ liệu token vào JS bằng cách nào?
    # → json.dumps ra chuỗi JSON rồi thay placeholder __TOKENS__ / __LEGENDS__ trong khối JS.
    # → JSON hợp lệ cũng là JS hợp lệ nên trình duyệt đọc trực tiếp thành mảng object cho inspector.
    js = JS.replace("__TOKENS__", json.dumps(slim))
    js = js.replace("__LEGENDS__", json.dumps(legends))
    h.append("<script>" + js + "</script>")

    path = os.path.join(OUT, "preview.html")
    with open(path, "w") as f:
        f.write("\n".join(h))
    print(f"built {path} ({os.path.getsize(path) // 1024} KB)")


if __name__ == "__main__":
    build()
