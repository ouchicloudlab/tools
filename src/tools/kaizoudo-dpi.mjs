export default {
  category: "unit",
  updated: "2026-08-27",
  title: "画像解像度とDPIの計算｜印刷できるサイズがわかる",
  h1: "解像度・印刷サイズの計算ツール",
  description:
    "画像のピクセル数から、きれいに印刷できる用紙サイズを計算します。逆に、必要な印刷サイズから何ピクセル必要かも求められる無料ツールです。",
  cardText: "ピクセル数⇔印刷サイズをDPIから計算。",
  keywords: [
    "解像度", "DPI", "ピクセル", "印刷", "サイズ", "画像", "ppi", "画素数", "計算",
  ],
  related: ["yoshi-size", "inch-cm"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="toSize" checked>ピクセル数から印刷サイズ</label>
    <label><input type="radio" name="mode" value="toPixel">印刷サイズから必要なピクセル数</label>
  </div>
</div>

<div class="row" id="panePixel">
  <div class="field"><label for="pw">横（ピクセル）</label>
    <input type="number" id="pw" inputmode="numeric" value="4000" step="100"></div>
  <div class="field"><label for="ph">縦（ピクセル）</label>
    <input type="number" id="ph" inputmode="numeric" value="3000" step="100"></div>
</div>

<div class="row" id="paneSize" hidden>
  <div class="field"><label for="mw">横（mm）</label>
    <input type="number" id="mw" inputmode="decimal" value="297" step="1"></div>
  <div class="field"><label for="mh">縦（mm）</label>
    <input type="number" id="mh" inputmode="decimal" value="210" step="1"></div>
</div>

<div class="row">
  <div class="field">
    <label for="dpi">解像度（DPI）</label>
    <select id="dpi">
      <option value="72">72（Web・画面表示）</option>
      <option value="150">150（簡易印刷・ポスター）</option>
      <option value="300" selected>300（写真・商業印刷の標準）</option>
      <option value="350">350（高品質な印刷）</option>
      <option value="600">600（線画・文字の印刷）</option>
    </select>
  </div>
  <div class="field">
    <label for="customDpi">または自分で入力</label>
    <input type="number" id="customDpi" inputmode="numeric" value="" placeholder="空欄なら上の選択を使用">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">印刷できるサイズ</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">インチ換算</div><div class="v" id="inchVal">-</div></div>
    <div><div class="k">総画素数</div><div class="v" id="mpVal">-</div></div>
    <div><div class="k">縦横比</div><div class="v" id="ratioVal">-</div></div>
    <div><div class="k">印刷できる最大の用紙</div><div class="v" id="paperVal">-</div></div>
    <div><div class="k">ファイルサイズの目安</div><div class="v" id="fileVal">-</div></div>
    <div><div class="k">Web表示での大きさ</div><div class="v" id="webVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>用紙サイズごとに必要なピクセル数（300DPI）</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>用紙</th><th>寸法</th><th>必要なピクセル</th><th>判定</th></tr></thead>
    <tbody id="paperTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var INCH = 25.4;
  var PAPERS = [
    ["名刺", 91, 55], ["L判", 127, 89], ["はがき", 148, 100],
    ["2L判", 178, 127], ["A5", 210, 148], ["A4", 297, 210],
    ["A3", 420, 297], ["A2", 594, 420], ["A1", 841, 594], ["A0", 1189, 841]
  ];

  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("panePixel").hidden = mode !== "toSize";
    ST.$("paneSize").hidden = mode !== "toPixel";

    var custom = ST.n(ST.$("customDpi"), 0);
    var dpi = custom > 0 ? custom : Number(ST.$("dpi").value) || 300;

    var pw, ph, mmW, mmH;

    if (mode === "toSize") {
      pw = Math.max(0, Math.round(ST.n(ST.$("pw"))));
      ph = Math.max(0, Math.round(ST.n(ST.$("ph"))));
      mmW = pw / dpi * INCH;
      mmH = ph / dpi * INCH;
    } else {
      mmW = Math.max(0, ST.n(ST.$("mw")));
      mmH = Math.max(0, ST.n(ST.$("mh")));
      pw = Math.ceil(mmW / INCH * dpi);
      ph = Math.ceil(mmH / INCH * dpi);
    }

    if (pw <= 0 || ph <= 0) {
      ["mainVal","inchVal","mpVal","ratioVal","paperVal","fileVal","webVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "0より大きい値を入力してください。");
      ST.$("paperTable").innerHTML = "";
      return;
    }

    var mp = pw * ph / 1000000;
    var g = gcd(pw, ph) || 1;
    var rw = pw / g, rh = ph / g;
    // よくある比に丸めて表示する
    var ratioText = (rw > 30 || rh > 30)
      ? ST.num(pw / ph, 2) + " : 1"
      : rw + " : " + rh;

    // 指定したDPIで印刷できる最大の用紙（下の表の判定と同じ基準にする）
    var fit = "この解像度では不足";
    for (var i = PAPERS.length - 1; i >= 0; i--) {
      var p = PAPERS[i];
      var nw = Math.ceil(p[1] / INCH * dpi);
      var nh = Math.ceil(p[2] / INCH * dpi);
      if ((pw >= nw && ph >= nh) || (pw >= nh && ph >= nw)) {
        fit = p[0] + " まで印刷できる";
        break;
      }
    }

    ST.$("mainLabel").textContent = mode === "toSize"
      ? dpi + "DPIで印刷できるサイズ" : "必要なピクセル数";
    ST.set("mainVal", mode === "toSize"
      ? ST.num(mmW, 1) + " × " + ST.num(mmH, 1) + " mm"
      : ST.num(pw, 0) + " × " + ST.num(ph, 0) + " px");
    ST.set("inchVal", ST.num(mmW / INCH, 2) + " × " + ST.num(mmH / INCH, 2) + " インチ");
    ST.set("mpVal", ST.num(mp, 2) + " メガピクセル");
    ST.set("ratioVal", ratioText);
    ST.set("paperVal", fit);
    // JPEGは1画素あたり約0.3バイト、非圧縮は3バイト
    ST.set("fileVal", "JPEG 約" + ST.num(pw * ph * 0.3 / 1024 / 1024, 1) +
      "MB / 非圧縮 約" + ST.num(pw * ph * 3 / 1024 / 1024, 1) + "MB");
    ST.set("webVal", ST.num(pw, 0) + " × " + ST.num(ph, 0) + " px（" +
      (pw > 1920 ? "フルHDより大きい" : pw > 1280 ? "フルHD以下" : "一般的なWeb画像") + "）");
    ST.set("detail",
      "計算式: ピクセル数 ÷ DPI × 25.4 = ミリメートル。" +
      dpi + "DPIは1インチ（25.4mm）あたり" + dpi + "個の点で表現する解像度です。");

    // 用紙ごとの判定
    ST.$("paperTable").innerHTML = PAPERS.map(function (p) {
      var needW = Math.ceil(p[1] / INCH * dpi);
      var needH = Math.ceil(p[2] / INCH * dpi);
      var ok = (pw >= needW && ph >= needH) || (pw >= needH && ph >= needW);
      return "<tr" + (ok ? "" : ' style="opacity:.5"') + "><td>" + p[0] +
        "</td><td>" + p[1] + "×" + p[2] + "mm</td><td>" + ST.num(needW, 0) +
        "×" + ST.num(needH, 0) + "</td><td>" + (ok ? "足りる" : "不足") + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
画像のピクセル数から、きれいに印刷できるサイズを計算します。逆に「A4で印刷したいけれど何ピクセル必要か」も調べられます。
`,

  guide: `
## DPIとは

**Dots Per Inch** の略で、1インチ（25.4mm）あたりに何個の点を並べるかを表します。数値が大きいほど密度が高く、なめらかに見えます。

> **印刷サイズ(mm) = ピクセル数 ÷ DPI × 25.4**
> **必要なピクセル数 = 印刷サイズ(mm) ÷ 25.4 × DPI**

4000×3000ピクセルの写真を300DPIで印刷すると、

- 4000 ÷ 300 × 25.4 = **338.7mm**
- 3000 ÷ 300 × 25.4 = **254mm**

A4（297×210mm）より大きいので、A4なら余裕を持って印刷できます。

## 用途ごとの目安

| 用途 | DPI |
|---|---|
| Web・画面表示 | 72〜96 |
| 家庭用プリンタの普通紙 | 150〜200 |
| 写真プリント・商業印刷 | **300** |
| 高品質な印刷物 | 350 |
| 線画・細かい文字 | 600 |

**印刷物の標準は300DPI** です。人間の目が識別できる限界に近く、これ以上上げても見た目の差はほとんど出ません（用紙やインクの性能が先に頭打ちになります）。

ポスターのように離れて見るものは、150DPI程度でも十分です。見る距離が遠いほど、必要な解像度は下がります。

## よく使う用紙に必要なピクセル数（300DPI）

| 用紙 | 寸法 | 必要なピクセル |
|---|---|---|
| 名刺 | 91×55mm | 1075×650 |
| L判 | 127×89mm | 1500×1051 |
| はがき | 148×100mm | 1748×1181 |
| A5 | 210×148mm | 2481×1748 |
| A4 | 297×210mm | 3508×2481 |
| A3 | 420×297mm | 4961×3508 |

**A4を300DPIで印刷するには約3500×2500ピクセル、およそ870万画素** が必要です。最近のスマートフォンのカメラは1200万画素以上あるので、A4印刷には十分足ります。

## DPIとPPIの違い

厳密には別の用語です。

- **PPI（Pixels Per Inch）**: 画面や画像データの画素密度
- **DPI（Dots Per Inch）**: 印刷時のインクの点の密度

画像データについて語るときは本来PPIが正確ですが、実務ではDPIと呼ばれることがほとんどです。混同しても大きな問題は起きません。

なお、**画像ファイルに記録されているDPIの値そのものには、ほとんど意味がありません。** 印刷時にどのサイズで出すかを決めるための情報にすぎず、画質を左右するのはあくまで **総ピクセル数** です。同じ画像のDPI設定だけを300に変えても、画質は1ミリも良くなりません。

## 拡大すると画質は戻らない

小さい画像を引き伸ばしても、失われた情報は復元されません。

- 1000×750の画像をA4（3500×2500必要）に引き伸ばす → 約3.5倍に拡大 → ぼやける

AIによる超解像技術で見た目を改善することはできますが、それは「もっともらしい細部を作り出している」のであって、元の情報を取り戻しているわけではありません。**大きく印刷する予定があるなら、最初から高解像度で撮影・作成する** のが確実です。

## 印刷時の塗り足し

用紙のふちまで色を入れる場合は、仕上がりより **上下左右に3mmずつ大きく** データを作ります。A4なら216×303mmです。

このぶんも300DPIで用意する必要があるため、必要なピクセル数は3579×2551になります。印刷所に入稿する場合は、この寸法で作成してください。
`,

  faq: [
    {
      q: "A4で印刷するには何ピクセル必要ですか？",
      a: "300DPIなら約3508×2481ピクセル（約870万画素）です。最近のスマートフォンは1200万画素以上あるため、A4印刷には十分足ります。",
    },
    {
      q: "DPIはいくつに設定すればいいですか？",
      a: "写真や商業印刷は300DPI、家庭用プリンタの普通紙なら150〜200DPI、Web用は72DPIが目安です。ポスターのように離れて見るものは150DPI程度で十分です。",
    },
    {
      q: "画像のDPI設定を300に変えれば画質が良くなりますか？",
      a: "なりません。画質を決めるのは総ピクセル数だけで、ファイルに記録されたDPIの値は印刷サイズを指定する情報にすぎません。",
    },
    {
      q: "小さい画像を大きく印刷するとどうなりますか？",
      a: "ぼやけます。拡大しても失われた情報は戻りません。AIの超解像処理で見た目を改善することはできますが、細部を推測で作り出しているだけです。大きく印刷する予定があるなら、最初から高解像度で用意してください。",
    },
    {
      q: "DPIとPPIは何が違いますか？",
      a: "PPIは画像データの画素密度、DPIは印刷時のインクの点の密度を指します。厳密には別の用語ですが、実務ではどちらもDPIと呼ばれることがほとんどです。",
    },
  ],
};
