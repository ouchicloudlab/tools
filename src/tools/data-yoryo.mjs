export default {
  category: "unit",
  updated: "2026-08-27",
  title: "データ容量の変換ツール｜GB・MB・TBと写真や動画の目安",
  h1: "データ容量の変換ツール",
  description:
    "GB・MB・TBを相互に変換し、その容量に写真や動画がどれくらい入るかの目安を表示します。カタログの1TBが実際は931GBになる理由も解説した無料ツールです。",
  cardText: "GB⇔MB⇔TBの変換と、写真・動画の収納目安。",
  keywords: [
    "GB", "MB", "TB", "容量", "変換", "データ", "ギガ", "バイト", "何枚", "ストレージ",
  ],
  related: ["inch-cm"],

  ui: `
<div class="row">
  <div class="field">
    <label for="value">数値</label>
    <input type="number" id="value" inputmode="decimal" value="1" step="0.001">
  </div>
  <div class="field">
    <label for="unit">単位</label>
    <select id="unit">
      <option value="B">バイト (B)</option>
      <option value="KB">キロバイト (KB)</option>
      <option value="MB">メガバイト (MB)</option>
      <option value="GB" selected>ギガバイト (GB)</option>
      <option value="TB">テラバイト (TB)</option>
      <option value="PB">ペタバイト (PB)</option>
    </select>
  </div>
  <div class="field">
    <span class="field-label">1KBの数え方</span>
    <div class="pills" id="basis">
      <label><input type="radio" name="basis" value="1024" checked>1024（OS表示）</label>
      <label><input type="radio" name="basis" value="1000">1000（カタログ表記）</label>
    </div>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">換算結果</div>
  <div class="result-grid" style="margin-top:8px">
    <div><div class="k">バイト</div><div class="v" id="rB">-</div></div>
    <div><div class="k">KB</div><div class="v" id="rKB">-</div></div>
    <div><div class="k">MB</div><div class="v" id="rMB">-</div></div>
    <div><div class="k">GB</div><div class="v" id="rGB">-</div></div>
    <div><div class="k">TB</div><div class="v" id="rTB">-</div></div>
    <div><div class="k">もう一方の数え方では</div><div class="v" id="rOther">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>この容量に入る量の目安</h3>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">スマホ写真（3MB）</div><div class="v" id="rPhoto">-</div></div>
    <div><div class="k">音楽MP3（5MB）</div><div class="v" id="rMusic">-</div></div>
    <div><div class="k">フルHD動画</div><div class="v" id="rHd">-</div></div>
    <div><div class="k">4K動画</div><div class="v" id="r4k">-</div></div>
    <div><div class="k">Word文書（50KB）</div><div class="v" id="rDoc">-</div></div>
    <div><div class="k">動画配信の視聴（HD）</div><div class="v" id="rStream">-</div></div>
  </div>
  <p class="result-sub">おおよその目安です。実際のファイルサイズは画質や長さによって変わります。</p>
</div>
`,

  script: `
(function () {
  var ORDER = ["B", "KB", "MB", "GB", "TB", "PB"];

  function basis() { return Number(ST.pick("basis")) || 1024; }

  function toBytes(v, unit, k) {
    return v * Math.pow(k, ORDER.indexOf(unit));
  }
  function fromBytes(b, unit, k) {
    return b / Math.pow(k, ORDER.indexOf(unit));
  }

  // 大きな桁は指数表記にせず、桁区切りのまま読めるようにする。
  // 1未満の値を2桁で丸めると "0" になって情報が消えるため、
  // 小さいときほど小数の桁数を増やす。
  function big(n) {
    if (n === 0) return "0";
    if (n >= 1e15) return ST.num(n / 1e12, 0) + "兆";
    if (n >= 1000) return ST.num(n, 0);
    if (n >= 1) return ST.num(n, 2);
    if (n >= 0.001) return ST.num(n, 5);
    return ST.num(n, 9);
  }

  // 「何個入るか」は、1個未満なら小数、多ければ切り捨てで表す
  function count(bytes, per, suffix) {
    var n = bytes / per;
    if (n < 1) return ST.num(n, 2) + suffix;
    if (n >= 1e8) return ST.num(n / 1e8, 1) + "億" + suffix;
    if (n >= 1e4) return ST.num(Math.floor(n / 1e4), 0) + "万" + suffix;
    return ST.num(Math.floor(n), 0) + suffix;
  }

  function hours(bytes, perHour) {
    var h = bytes / perHour;
    if (h * 60 < 1) return "1分未満";
    if (h < 1) return ST.num(h * 60, 0) + "分";
    if (h >= 24 * 30) return ST.num(h / 24, 0) + "日ぶん";
    if (h >= 24) return ST.num(Math.floor(h / 24), 0) + "日" + ST.num(Math.round(h % 24), 0) + "時間";
    return ST.num(h, 1) + "時間";
  }

  ST.live(function () {
    var k = basis();
    var v = ST.n(ST.$("value"));
    var unit = ST.$("unit").value;
    var bytes = toBytes(v, unit, k);
    var other = k === 1024 ? 1000 : 1024;

    ST.set("rB", big(bytes) + " B");
    ST.set("rKB", big(fromBytes(bytes, "KB", k)) + " KB");
    ST.set("rMB", big(fromBytes(bytes, "MB", k)) + " MB");
    ST.set("rGB", big(fromBytes(bytes, "GB", k)) + " GB");
    ST.set("rTB", big(fromBytes(bytes, "TB", k)) + " TB");
    ST.set("rOther", big(fromBytes(bytes, unit, other)) + " " + unit +
      "（1KB=" + other + "換算）");
    ST.set("detail", "1KB = " + k + "バイトとして計算しています。" +
      (k === 1024
        ? "WindowsやmacOSのファイル情報はこの数え方です。"
        : "ハードディスクやSDカードのパッケージ表記はこの数え方です。"));

    // 目安（1MB = 1024×1024 バイトで統一して換算）
    var MB = 1024 * 1024;
    ST.set("rPhoto", count(bytes, 3 * MB, "枚"));
    ST.set("rMusic", count(bytes, 5 * MB, "曲"));
    ST.set("rHd", hours(bytes, 4 * 1024 * MB));    // フルHD 約4GB/時間
    ST.set("r4k", hours(bytes, 20 * 1024 * MB));   // 4K 約20GB/時間
    ST.set("rDoc", count(bytes, 50 * 1024, "件"));
    ST.set("rStream", hours(bytes, 3 * 1024 * MB)); // 配信HD 約3GB/時間
  });
})();
`,

  intro: `
GB・MB・TBを相互に変換します。1KBを1024と数えるか1000と数えるかを切り替えられるので、「買った1TBのHDDが931GBしかない」といった食い違いの正体も確認できます。
`,

  guide: `
## 単位の関係

データ容量は1,024倍ずつ大きくなります。

| 単位 | 読み | 大きさ |
|---|---|---|
| B | バイト | 半角文字1文字ぶん |
| KB | キロバイト | 1,024 B |
| MB | メガバイト | 1,024 KB |
| GB | ギガバイト | 1,024 MB |
| TB | テラバイト | 1,024 GB |
| PB | ペタバイト | 1,024 TB |

1バイトは8ビットで、半角英数字1文字を表せる大きさです。日本語の文字はUTF-8で1文字あたり3バイト使います。

## 1TBのHDDが931GBしかない理由

新品のハードディスクをパソコンにつなぐと、パッケージの表記より少ない容量が表示されます。これは故障でも誤表記でもなく、**数え方の違い** です。

- **メーカーの表記**: 1TB = 1,000,000,000,000 バイト（1000倍で計算）
- **OSの表示**: 1TB = 1,099,511,627,776 バイト（1024倍で計算）

同じ「1TB」でも、後者のほうが約10%大きい数字を指します。そのため、メーカーが1TBとして売った製品をWindowsが数え直すと、

> 1,000,000,000,000 ÷ 1,024 ÷ 1,024 ÷ 1,024 = **931.32GB**

と表示されます。容量が減ったわけではなく、同じバイト数に別の名前が付いているだけです。ずれの大きさは単位が上がるほど広がります。

| 表記 | OS表示 | 差 |
|---|---|---|
| 128GB | 119GB | 約7% |
| 256GB | 238GB | 約7% |
| 512GB | 476GB | 約7% |
| 1TB | 931GB | 約7% |
| 2TB | 1.81TB | 約9% |
| 4TB | 3.63TB | 約9% |

なお、この差とは別に、フォーマットに使われる領域や、システムの復旧用パーティションでさらに数GBが使われます。実際に使える容量はもう少し小さくなります。

## KiB・MiB という表記

紛らわしさを避けるため、1024倍の単位には **KiB（キビバイト）・MiB（メビバイト）・GiB（ギビバイト）** という正式な名称が定められています（IEC規格）。

- 1 KiB = 1,024 バイト
- 1 KB = 1,000 バイト（本来の定義）

Linuxの一部のツールやプログラミングの世界ではこの表記が使われますが、WindowsやmacOSは1024倍で計算した値を「GB」と表示し続けているため、一般利用者が目にする機会は多くありません。

## ファイルサイズの目安

| 種類 | 1つあたり |
|---|---|
| テキストファイル（1000文字） | 約3KB |
| Word文書（文字のみ） | 約50KB |
| PDF（10ページ・文字中心） | 約500KB |
| スマホ写真（1200万画素・JPEG） | 約3MB |
| 一眼レフのRAW画像 | 約25MB |
| 音楽1曲（MP3・320kbps） | 約10MB |
| 音楽1曲（MP3・128kbps） | 約5MB |
| フルHD動画 | 約4GB / 時間 |
| 4K動画 | 約20GB / 時間 |
| ゲームソフト（大作） | 50〜150GB |

## 通信量の目安（1か月のスマホ契約を考えるとき）

| 用途 | 1時間あたり |
|---|---|
| Webページ閲覧 | 約20MB |
| SNSの閲覧（画像中心） | 約100MB |
| 音楽ストリーミング | 約60MB |
| 動画（標準画質） | 約450MB |
| 動画（HD画質） | 約1.5GB |
| 動画（4K） | 約7GB |
| ビデオ通話 | 約500MB |

月3GBのプランなら、HD画質の動画は2時間ほどで使い切ります。動画をよく見る場合は、Wi-Fi接続時のみ高画質にする設定が有効です。
`,

  faq: [
    {
      q: "1TBのHDDを買ったのに931GBしかありません。不良品ですか？",
      a: "不良品ではありません。メーカーは1TB=1兆バイトとして表記し、OSは1024倍で計算して表示するためです。同じバイト数に別の名前が付いているだけで、容量は減っていません。",
    },
    {
      q: "1GBは何MBですか？",
      a: "OSの表示では1,024MB、メーカーのカタログ表記では1,000MBです。どちらの数え方かによって約2.4%の差が出ます。",
    },
    {
      q: "GBとGiBは何が違いますか？",
      a: "GiB（ギビバイト）は1,024倍の単位を正確に表す名称で、1GiB = 1,073,741,824バイトです。本来GBは1,000倍を指しますが、WindowsやmacOSは1024倍の値を「GB」と表示しています。",
    },
    {
      q: "スマホの写真1枚は何MBですか？",
      a: "1200万画素のJPEGでおよそ3MBです。ポートレートモードやHDR、RAW形式ではさらに大きくなり、一眼レフのRAWでは1枚25MB前後になります。",
    },
    {
      q: "動画1時間の容量はどれくらいですか？",
      a: "撮影した動画ならフルHDで約4GB、4Kで約20GBが目安です。動画配信サービスの視聴では圧縮されているため、HD画質で1時間あたり1.5〜3GB程度になります。",
    },
  ],
};
