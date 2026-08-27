export default {
  category: "unit",
  updated: "2026-08-27",
  title: "ネット速度の目安｜Mbpsで何ができるか・ダウンロード時間",
  h1: "通信速度・ダウンロード時間の計算ツール",
  description:
    "回線速度からファイルのダウンロード時間を計算します。Mbpsとメガバイトの違いや、動画視聴・オンライン会議に必要な速度の目安も確認できる無料ツールです。",
  cardText: "Mbpsからダウンロード時間と用途の可否を判定。",
  keywords: [
    "通信速度", "Mbps", "ダウンロード", "時間", "計算", "回線速度", "光回線", "目安", "遅い",
  ],
  related: ["data-yoryo", "sokudo-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="speed">回線速度</label>
    <input type="number" id="speed" inputmode="decimal" value="100" step="1">
  </div>
  <div class="field">
    <label for="unit">単位</label>
    <select id="unit">
      <option value="0.001">Kbps</option>
      <option value="1" selected>Mbps</option>
      <option value="1000">Gbps</option>
    </select>
  </div>
  <div class="field">
    <label for="size">ファイルサイズ</label>
    <input type="number" id="size" inputmode="decimal" value="5" step="0.1">
  </div>
  <div class="field">
    <label for="sizeUnit">単位</label>
    <select id="sizeUnit">
      <option value="1">MB</option>
      <option value="1024" selected>GB</option>
      <option value="1048576">TB</option>
    </select>
  </div>
</div>

<div class="field">
  <div class="pills">
    <label><input type="checkbox" id="realistic" checked>実効速度で計算する（理論値の6〜7割）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">ダウンロードにかかる時間</div>
  <div class="result-main" id="timeVal">-</div>
  <div class="result-grid">
    <div><div class="k">1秒あたりの転送量</div><div class="v" id="mbpsVal">-</div></div>
    <div><div class="k">計算に使った速度</div><div class="v" id="realVal">-</div></div>
    <div><div class="k">ファイルサイズ</div><div class="v" id="sizeVal">-</div></div>
    <div><div class="k">1時間で送れる量</div><div class="v" id="hourVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>この速度でできること</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>用途</th><th>必要な速度</th><th>判定</th></tr></thead>
    <tbody id="useTable"></tbody>
  </table>
</div>

<h3>よくあるファイルのダウンロード時間</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>ファイル</th><th>サイズ</th><th>時間</th></tr></thead>
    <tbody id="fileTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  // [用途, 必要なMbps]
  var USES = [
    ["メール・Webページの閲覧", 1],
    ["音楽ストリーミング", 1.5],
    ["SNS・画像の閲覧", 3],
    ["動画視聴（標準画質）", 3],
    ["オンライン会議（1対1）", 3],
    ["動画視聴（HD・1080p）", 5],
    ["オンライン会議（複数人）", 8],
    ["動画視聴（4K）", 25],
    ["オンラインゲーム", 30],
    ["ライブ配信（送信側・HD）", 10],
    ["大容量ファイルの送受信", 100]
  ];
  var FILES = [
    ["写真1枚（高画質）", 5],
    ["音楽アルバム1枚", 100],
    ["動画（HD・1時間）", 3000],
    ["映画（4K）", 20000],
    ["ゲームソフト（大作）", 80000],
    ["OSのアップデート", 5000]
  ];

  function fmtTime(sec) {
    if (!isFinite(sec) || sec <= 0) return "-";
    if (sec < 1) return ST.num(sec * 1000, 0) + " ミリ秒";
    if (sec < 60) return ST.num(sec, 1) + " 秒";
    if (sec < 3600) return Math.floor(sec / 60) + "分" + Math.round(sec % 60) + "秒";
    if (sec < 86400) return Math.floor(sec / 3600) + "時間" + Math.round((sec % 3600) / 60) + "分";
    return ST.num(sec / 86400, 1) + " 日";
  }

  ST.live(function () {
    var raw = ST.n(ST.$("speed")) * Number(ST.$("unit").value);
    var useReal = ST.$("realistic").checked;
    // 実効速度は理論値の6〜7割程度になることが多い
    var mbps = useReal ? raw * 0.65 : raw;
    var sizeMB = ST.n(ST.$("size")) * Number(ST.$("sizeUnit").value);

    if (raw <= 0 || sizeMB <= 0) {
      ["timeVal","mbpsVal","realVal","sizeVal","hourVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "回線速度とファイルサイズを入力してください。");
      ST.$("useTable").innerHTML = "";
      ST.$("fileTable").innerHTML = "";
      return;
    }

    // Mbps は「メガビット毎秒」。バイトに直すには8で割る
    var mbPerSec = mbps / 8;
    var seconds = sizeMB / mbPerSec;

    ST.set("timeVal", fmtTime(seconds));
    ST.set("mbpsVal", ST.num(mbPerSec, 2) + " MB/秒");
    ST.set("realVal", ST.num(mbps, 1) + " Mbps" + (useReal ? "（実効）" : "（理論値）"));
    ST.set("sizeVal", sizeMB >= 1024
      ? ST.num(sizeMB / 1024, 2) + " GB" : ST.num(sizeMB, 1) + " MB");
    ST.set("hourVal", ST.num(mbPerSec * 3600 / 1024, 1) + " GB");
    ST.set("detail",
      "Mbps は「メガビット毎秒」で、MB（メガバイト）とは8倍の差があります。" +
      ST.num(mbps, 1) + "Mbps ÷ 8 = " + ST.num(mbPerSec, 2) + "MB/秒 です。" +
      (useReal
        ? "実効速度として理論値の65%で計算しています。"
        : "理論値で計算しています。実際はこれより遅くなります。"));

    ST.$("useTable").innerHTML = USES.map(function (u) {
      var ok = mbps >= u[1];
      return "<tr" + (ok ? "" : ' style="opacity:.5"') + "><td>" + u[0] +
        "</td><td>" + u[1] + " Mbps</td><td>" +
        (ok ? "快適に使える" : "不足") + "</td></tr>";
    }).join("");

    ST.$("fileTable").innerHTML = FILES.map(function (f) {
      return "<tr><td>" + f[0] + "</td><td>" +
        (f[1] >= 1024 ? ST.num(f[1] / 1024, 1) + " GB" : f[1] + " MB") +
        "</td><td>" + fmtTime(f[1] / mbPerSec) + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
回線速度からファイルのダウンロード時間を計算します。**Mbps（メガビット）とMB（メガバイト）は8倍違う**ため、ここを取り違えると計算が合いません。
`,

  guide: `
## MbpsとMBは8倍違う

最も間違えやすい点です。

- **Mbps** = メガ **ビット** 毎秒（通信速度の単位）
- **MB** = メガ **バイト**（ファイルサイズの単位）
- **1バイト = 8ビット**

> **ダウンロード速度(MB/秒) = 回線速度(Mbps) ÷ 8**

100Mbpsの回線でも、実際にファイルが落ちてくる速さは **12.5MB/秒** です。「100Mbpsなのに100MBのファイルが1秒で落ちない」のは、単位が違うためです。

小文字の **b がビット**、大文字の **B がバイト** という区別があります。Mbps と MB/s は見た目が似ていますが、8倍の差があります。

## 理論値と実効速度

契約書に書かれている「最大1Gbps」は **理論上の上限** で、実際にはそこまで出ません。

| 要因 | 影響 |
|---|---|
| 通信規格上のオーバーヘッド | 常に1〜2割 |
| 回線の混雑（夜間） | 大きい |
| Wi-Fiの電波状況 | 大きい |
| 相手側サーバーの性能 | 大きい |
| ルーターやLANケーブルの規格 | 古いと頭打ち |

**実効速度は理論値の5〜7割** が一般的です。1Gbps契約で実測300〜600Mbps出ていれば正常な範囲といえます。

## 用途ごとに必要な速度

| 用途 | 必要な速度 |
|---|---|
| メール・Web閲覧 | 1Mbps |
| 音楽ストリーミング | 1.5Mbps |
| 動画（標準画質） | 3Mbps |
| オンライン会議（1対1） | 3Mbps |
| 動画（HD・1080p） | 5Mbps |
| オンライン会議（複数人） | 8Mbps |
| 動画（4K） | 25Mbps |
| オンラインゲーム | 30Mbps |

**実は、日常の用途にはそれほど速度は要りません。** 4K動画でも25Mbpsで足ります。1Gbpsの契約が必要なのは、大容量ファイルを頻繁にやり取りする場合や、家族が同時に多くの機器を使う場合です。

## 速度より重要な「応答速度（Ping）」

オンラインゲームやビデオ通話では、速度（帯域）より **遅延（Ping値）** のほうが体感に影響します。

| Ping値 | 体感 |
|---|---|
| 15ms以下 | 非常に快適 |
| 15〜30ms | 快適 |
| 30〜50ms | 標準 |
| 50〜100ms | やや遅延を感じる |
| 100ms以上 | ゲームでは厳しい |

「速度は速いのにゲームで不利」という場合、Ping値が原因です。**光回線でもマンションの共用設備が古いと遅延が大きくなる** ことがあります。

## 遅いと感じたときの確認順

1. **Wi-Fiではなく有線で測る** — 原因の切り分けができます。有線で速ければWi-Fi側の問題です
2. **時間帯を変えて測る** — 夜間だけ遅いなら回線の混雑が原因です
3. **他の機器で測る** — 特定の端末だけ遅いなら端末側の問題です
4. **ルーターを再起動する** — 単純ですが効果があることが多い方法です
5. **LANケーブルの規格を確認** — カテゴリ5（Cat5）は100Mbpsが上限です

**古いLANケーブルが原因で1Gbps契約が100Mbpsに制限されている**、というケースは珍しくありません。ケーブルに印字された「CAT5e」「CAT6」の表記を確認してください。Cat5e以上なら1Gbpsに対応します。

## 通信量の目安

| 用途 | 1時間あたり |
|---|---|
| Web閲覧 | 約20MB |
| 音楽ストリーミング | 約60MB |
| 動画（標準画質） | 約450MB |
| 動画（HD） | 約1.5GB |
| 動画（4K） | 約7GB |
| オンライン会議 | 約500MB〜1GB |

スマートフォンの契約が月3GBなら、HD画質の動画は2時間ほどで使い切ります。自宅のWi-Fiに接続する習慣をつけるだけで、大きく節約できます。
`,

  faq: [
    {
      q: "100Mbpsの回線で1GBのファイルは何秒で落ちますか？",
      a: "理論値なら約82秒、実効速度（65%として）なら約2分です。100Mbps ÷ 8 = 12.5MB/秒なので、1024MB ÷ 12.5 = 約82秒になります。",
    },
    {
      q: "MbpsとMBは何が違いますか？",
      a: "8倍違います。Mbpsはメガ「ビット」毎秒、MBはメガ「バイト」で、1バイト = 8ビットです。100Mbpsの回線でも、実際の転送速度は12.5MB/秒です。",
    },
    {
      q: "1Gbpsの契約なのに300Mbpsしか出ません。",
      a: "正常な範囲です。実効速度は理論値の5〜7割になるのが一般的で、通信規格のオーバーヘッド、回線の混雑、Wi-Fiの電波状況などが影響します。",
    },
    {
      q: "動画を見るのに必要な速度はどれくらいですか？",
      a: "HD画質で5Mbps、4Kでも25Mbpsあれば足ります。日常の用途にはそれほど速度は必要なく、1Gbpsが要るのは大容量ファイルを頻繁にやり取りする場合などです。",
    },
    {
      q: "速度は出ているのにゲームが重いのはなぜですか？",
      a: "応答速度（Ping値）が原因の可能性があります。ゲームでは帯域より遅延のほうが体感に影響し、50msを超えると不利になります。有線接続にすると改善することが多いです。",
    },
  ],
};
