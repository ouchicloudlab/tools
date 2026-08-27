export default {
  category: "text",
  updated: "2026-08-27",
  title: "カラーコード変換｜HEXとRGBを相互に変換",
  h1: "カラーコード変換ツール",
  description:
    "#FF5733のようなHEXコードとRGB値を相互に変換します。HSLへの変換、明度の調整、文字色とのコントラスト比の判定にも対応した無料ツールです。",
  cardText: "HEX⇔RGB⇔HSLの変換とコントラスト比の判定。",
  keywords: [
    "カラーコード", "変換", "HEX", "RGB", "HSL", "16進数", "色", "コントラスト", "配色",
  ],
  yomi: "からーこーど いろ",
  related: ["url-encode", "moji-henkan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="picker">色を選ぶ</label>
    <input type="color" id="picker" value="#1f6feb" style="height:46px;padding:4px">
  </div>
  <div class="field">
    <label for="hex">HEX</label>
    <input type="text" id="hex" value="#1f6feb" placeholder="#RRGGBB">
  </div>
</div>

<div class="row">
  <div class="field"><label for="r">R（赤 0-255）</label>
    <input type="number" id="r" inputmode="numeric" value="31" min="0" max="255"></div>
  <div class="field"><label for="g">G（緑 0-255）</label>
    <input type="number" id="g" inputmode="numeric" value="111" min="0" max="255"></div>
  <div class="field"><label for="b">B（青 0-255）</label>
    <input type="number" id="b" inputmode="numeric" value="235" min="0" max="255"></div>
</div>

<div id="swatch" style="height:70px;border-radius:10px;border:1px solid var(--border);margin:14px 0"></div>

<div class="result" aria-live="polite">
  <div class="result-label">変換結果</div>
  <div class="result-grid" style="margin-top:8px">
    <div><div class="k">HEX</div><div class="v" id="rHex">-</div></div>
    <div><div class="k">RGB</div><div class="v" id="rRgb">-</div></div>
    <div><div class="k">HSL</div><div class="v" id="rHsl">-</div></div>
    <div><div class="k">明度（輝度）</div><div class="v" id="rLum">-</div></div>
    <div><div class="k">白文字とのコントラスト</div><div class="v" id="rWhite">-</div></div>
    <div><div class="k">黒文字とのコントラスト</div><div class="v" id="rBlack">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<div class="row">
  <button class="btn" type="button" id="copyHex">HEXをコピー</button>
  <button class="btn sub" type="button" id="copyRgb">RGBをコピー</button>
</div>

<h3>明るさを変えた色</h3>
<div id="shades" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"></div>
`,

  script: `
(function () {
  var lock = false;

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function toHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) {
      return clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
    }).join("");
  }

  function parseHex(s) {
    var m = String(s).trim().replace(/^#/, "");
    // 3桁表記（#abc）は6桁に展開する
    if (/^[0-9a-fA-F]{3}$/.test(m)) {
      m = m.split("").map(function (c) { return c + c; }).join("");
    }
    if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
    return {
      r: parseInt(m.substr(0, 2), 16),
      g: parseInt(m.substr(2, 2), 16),
      b: parseInt(m.substr(4, 2), 16)
    };
  }

  function toHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  // 相対輝度（WCAGの定義）。コントラスト比の計算に使う。
  function luminance(r, g, b) {
    var a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  function contrast(l1, l2) {
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function judge(ratio) {
    if (ratio >= 7) return "AAA（十分）";
    if (ratio >= 4.5) return "AA（本文に使える）";
    if (ratio >= 3) return "大きな文字のみ可";
    return "不足";
  }

  function render(r, g, b, from) {
    r = clamp(Math.round(r), 0, 255);
    g = clamp(Math.round(g), 0, 255);
    b = clamp(Math.round(b), 0, 255);
    var hex = toHex(r, g, b);

    lock = true;
    if (from !== "hex") ST.$("hex").value = hex;
    if (from !== "rgb") {
      ST.$("r").value = r; ST.$("g").value = g; ST.$("b").value = b;
    }
    if (from !== "picker") ST.$("picker").value = hex;
    lock = false;

    var hsl = toHsl(r, g, b);
    var lum = luminance(r, g, b);
    var cWhite = contrast(lum, 1);
    var cBlack = contrast(lum, 0);

    ST.$("swatch").style.background = hex;
    ST.set("rHex", hex.toUpperCase());
    ST.set("rRgb", "rgb(" + r + ", " + g + ", " + b + ")");
    ST.set("rHsl", "hsl(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%)");
    ST.set("rLum", ST.num(lum * 100, 1) + "%");
    ST.set("rWhite", ST.num(cWhite, 2) + ":1  " + judge(cWhite));
    ST.set("rBlack", ST.num(cBlack, 2) + ":1  " + judge(cBlack));
    ST.set("detail",
      "この色の背景には " + (cWhite > cBlack ? "白" : "黒") + "文字のほうが読みやすくなります。" +
      "本文として使うにはコントラスト比4.5:1以上が必要です（WCAG AA）。");

    // 明度を変えた色見本
    var box = ST.$("shades");
    box.innerHTML = "";
    [90, 75, 60, hsl.l, 40, 25, 10].sort(function (a, b2) { return b2 - a; })
      .forEach(function (L) {
        var d = document.createElement("div");
        d.style.cssText = "flex:1;min-width:60px;height:44px;border-radius:7px;" +
          "border:1px solid var(--border);display:flex;align-items:center;" +
          "justify-content:center;font-size:11px;cursor:pointer;" +
          "background:hsl(" + hsl.h + "," + hsl.s + "%," + L + "%);" +
          "color:" + (L > 55 ? "#000" : "#fff");
        d.textContent = L + "%";
        d.title = "クリックでこの色に切り替え";
        d.addEventListener("click", function () {
          // HSL → RGB に戻す
          var s2 = hsl.s / 100, l2 = L / 100;
          var c = (1 - Math.abs(2 * l2 - 1)) * s2;
          var x = c * (1 - Math.abs((hsl.h / 60) % 2 - 1));
          var m = l2 - c / 2;
          var t = hsl.h < 60 ? [c, x, 0] : hsl.h < 120 ? [x, c, 0] :
            hsl.h < 180 ? [0, c, x] : hsl.h < 240 ? [0, x, c] :
            hsl.h < 300 ? [x, 0, c] : [c, 0, x];
          render((t[0] + m) * 255, (t[1] + m) * 255, (t[2] + m) * 255, "shade");
        });
        box.appendChild(d);
      });
  }

  ST.$("hex").addEventListener("input", function () {
    if (lock) return;
    var c = parseHex(ST.$("hex").value);
    if (c) render(c.r, c.g, c.b, "hex");
  });
  ["r", "g", "b"].forEach(function (id) {
    ST.$(id).addEventListener("input", function () {
      if (lock) return;
      render(ST.n(ST.$("r")), ST.n(ST.$("g")), ST.n(ST.$("b")), "rgb");
    });
  });
  ST.$("picker").addEventListener("input", function () {
    if (lock) return;
    var c = parseHex(ST.$("picker").value);
    if (c) render(c.r, c.g, c.b, "picker");
  });
  ST.$("copyHex").addEventListener("click", function (e) {
    ST.copy(ST.$("rHex").textContent, e.currentTarget);
  });
  ST.$("copyRgb").addEventListener("click", function (e) {
    ST.copy(ST.$("rRgb").textContent, e.currentTarget);
  });

  render(31, 111, 235, "init");
})();
`,

  intro: `
HEXコードとRGB値を相互に変換します。**文字色とのコントラスト比**も同時に判定するので、背景色として使えるかどうかがその場で分かります。
`,

  guide: `
## HEXとRGBの関係

**#1F6FEB** のようなHEXコードは、RGB各色の値を16進数2桁で並べたものです。

| 部分 | 意味 | 10進数 |
|---|---|---|
| 1F | 赤 | 31 |
| 6F | 緑 | 111 |
| EB | 青 | 235 |

16進数2桁は00〜FF、つまり0〜255の256段階を表せます。3色それぞれ256段階なので、全体では **256³ = 約1,678万色** を表現できます。

3桁の短縮表記（#ABC）は、各桁を2回繰り返した #AABBCC と同じ意味です。

## HSLという表し方

RGBは機械にとって扱いやすい形式ですが、人間が「もう少し明るく」と考えるときには不便です。HSLはその点を補います。

| 記号 | 意味 | 範囲 |
|---|---|---|
| H | 色相（Hue）— 色味そのもの | 0〜360度 |
| S | 彩度（Saturation）— 鮮やかさ | 0〜100% |
| L | 輝度（Lightness）— 明るさ | 0〜100% |

**HとSを固定してLだけ変える** と、同じ色味のまま明暗のバリエーションが作れます。このツールの「明るさを変えた色」がその例です。配色を作るとき、この方法なら統一感が保てます。

主な色相の角度は次のとおりです。

| 角度 | 色 |
|---|---|
| 0° | 赤 |
| 60° | 黄 |
| 120° | 緑 |
| 180° | シアン |
| 240° | 青 |
| 300° | マゼンタ |

## コントラスト比

背景色と文字色の明るさの差を表す数値です。1:1（同じ色）から21:1（白と黒）までの値をとります。

Webアクセシビリティの国際基準（WCAG 2.1）では、次の水準が定められています。

| 水準 | 必要なコントラスト比 | 対象 |
|---|---|---|
| AA | **4.5:1** 以上 | 通常の文字（本文） |
| AA（大きな文字） | 3:1 以上 | 18pt以上、または14pt以上の太字 |
| AAA | 7:1 以上 | より高い水準 |
| — | 3:1 以上 | ボタンの枠線やアイコンなど |

**薄いグレーの文字（#999999 など）は白背景で3:1に届かず、基準を満たしません。** デザイン上「上品」に見えても、明るい場所や視力の弱い方には読めなくなります。

日本では、公的機関のサイトやJIS X 8341-3で同等の基準が参照されています。

## 相対輝度の計算

コントラスト比は、単純な明るさの差ではなく **相対輝度** から計算します。

> 相対輝度 = 0.2126 × R + 0.7152 × G + 0.0722 × B
> （各値はガンマ補正後の0〜1の値）

緑の係数が突出して大きいのは、**人間の目が緑の光を最も明るく感じる** ためです。同じ数値でも、緑は赤や青より明るく見えます。純粋な青（#0000FF）が暗く見えるのはこの性質によるものです。

## そのほかの色の表し方

| 形式 | 例 | 用途 |
|---|---|---|
| HEX | #1F6FEB | Web、デザインツール |
| RGB | rgb(31, 111, 235) | Web、画像編集 |
| RGBA | rgba(31, 111, 235, 0.5) | 透明度つき |
| HSL | hsl(217, 84%, 52%) | 配色の調整 |
| CMYK | C80 M55 Y0 K8 | 印刷 |

**画面の色（RGB）と印刷の色（CMYK）は再現できる範囲が違います。** 画面で鮮やかに見える色が印刷では沈むことがあるのはこのためです。印刷物を作る場合は、CMYKで作業するか、印刷会社の指定に従ってください。
`,

  faq: [
    {
      q: "#1F6FEBのような表記は何を表していますか？",
      a: "赤・緑・青の強さを16進数2桁ずつで並べたものです。1F=31（赤）、6F=111（緑）、EB=235（青）を意味します。各色256段階なので、全体で約1,678万色を表せます。",
    },
    {
      q: "#ABCのような3桁の表記は何ですか？",
      a: "各桁を2回繰り返した6桁表記の短縮形です。#ABCは#AABBCCと同じ色を指します。ただし表現できる色数は限られます。",
    },
    {
      q: "コントラスト比はどれくらい必要ですか？",
      a: "本文の文字は4.5:1以上（WCAG AA）が必要です。18pt以上の大きな文字なら3:1で構いません。より高い水準を求める場合はAAA（7:1）を目指します。",
    },
    {
      q: "薄いグレーの文字は使ってはいけませんか？",
      a: "白背景に#999999だと約2.8:1で基準を下回ります。装飾的な文字なら許容されますが、本文には使わないでください。#767676まで濃くすると4.5:1を満たします。",
    },
    {
      q: "画面の色と印刷の色が違うのはなぜですか？",
      a: "画面は光の三原色（RGB）、印刷はインクの四色（CMYK）で色を作るためです。再現できる色の範囲が異なり、画面で鮮やかに見える色が印刷では沈むことがあります。",
    },
  ],
};
