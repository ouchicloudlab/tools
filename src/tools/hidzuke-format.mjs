export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "日付フォーマット変換｜表記の書き換えとエクセル対応",
  h1: "日付の表記変換ツール",
  description:
    "20260827・2026/8/27・August 27, 2026 など、さまざまな形式の日付を相互に変換します。エクセルのシリアル値やUNIX時間にも対応した無料ツールです。",
  cardText: "日付をあらゆる表記に変換。シリアル値も対応。",
  keywords: [
    "日付", "フォーマット", "変換", "書式", "エクセル", "シリアル値", "UNIX時間", "ISO", "表記",
  ],
  related: ["wareki-seireki", "youbi-keisan"],

  ui: `
<div class="field">
  <label for="src">日付を入力（さまざまな形式を受け付けます）</label>
  <input type="text" id="src" value="2026-08-27" placeholder="2026-08-27 / 20260827 / 2026年8月27日 など">
  <p class="hint">数字8桁、スラッシュ区切り、和暦、エクセルのシリアル値なども判別します。</p>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">読み取った日付</div>
  <div class="result-main" id="mainVal">-</div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>各形式での表記</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>形式</th><th>表記</th><th></th></tr></thead>
    <tbody id="formatTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var WD = ["日", "月", "火", "水", "木", "金", "土"];
  var WD_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MON_EN = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var ERAS = [
    { name: "令和", abbr: "R", start: [2019, 5, 1] },
    { name: "平成", abbr: "H", start: [1989, 1, 8] },
    { name: "昭和", abbr: "S", start: [1926, 12, 25] },
    { name: "大正", abbr: "T", start: [1912, 7, 30] },
    { name: "明治", abbr: "M", start: [1868, 1, 25] }
  ];

  function pad(n, w) { return String(n).padStart(w || 2, "0"); }

  // 入力文字列から日付を推測する。判別できた根拠も返す。
  function parseAny(s) {
    s = String(s).trim();
    if (!s) return null;

    // 和暦（令和8年8月27日 / R8.8.27）
    var w = s.match(/^(令和|平成|昭和|大正|明治|R|H|S|T|M)\\s*(\\d{1,2}|元)\\s*[年.\\-\\/]\\s*(\\d{1,2})\\s*[月.\\-\\/]\\s*(\\d{1,2})/);
    if (w) {
      var era = ERAS.filter(function (e) {
        return e.name === w[1] || e.abbr === w[1].toUpperCase();
      })[0];
      if (era) {
        var n = w[2] === "元" ? 1 : Number(w[2]);
        return { d: new Date(era.start[0] + n - 1, Number(w[3]) - 1, Number(w[4])),
                 how: "和暦として解釈" };
      }
    }

    // 数字8桁（20260827）
    if (/^\\d{8}$/.test(s)) {
      return { d: new Date(Number(s.substr(0, 4)), Number(s.substr(4, 2)) - 1,
        Number(s.substr(6, 2))), how: "数字8桁（YYYYMMDD）として解釈" };
    }

    // 年月日区切り（2026-08-27 / 2026/8/27 / 2026年8月27日）
    var m = s.match(/^(\\d{4})\\s*[\\-\\/年.]\\s*(\\d{1,2})\\s*[\\-\\/月.]\\s*(\\d{1,2})/);
    if (m) {
      return { d: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
               how: "年月日の区切りとして解釈" };
    }

    // UNIX時間（10桁）
    if (/^\\d{10}$/.test(s)) {
      return { d: new Date(Number(s) * 1000), how: "UNIX時間（秒）として解釈" };
    }
    // UNIX時間（13桁ミリ秒）
    if (/^\\d{13}$/.test(s)) {
      return { d: new Date(Number(s)), how: "UNIX時間（ミリ秒）として解釈" };
    }

    // エクセルのシリアル値（1〜60000程度）
    if (/^\\d{1,5}(\\.\\d+)?$/.test(s)) {
      var serial = Number(s);
      if (serial >= 1 && serial < 60000) {
        // 1900年1月1日を1とする。ただし1900年をうるう年とみなす仕様のため2日引く
        var base = Date.UTC(1900, 0, 1);
        var d2 = new Date(base + (serial - 2) * 86400000);
        return { d: new Date(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()),
                 how: "エクセルのシリアル値として解釈" };
      }
    }

    // 英語表記など、ブラウザの解釈に任せる
    var d3 = new Date(s);
    if (!isNaN(d3.getTime())) {
      return { d: d3, how: "一般的な日付表記として解釈" };
    }
    return null;
  }

  function wareki(d) {
    var y = d.getFullYear(), mo = d.getMonth() + 1, da = d.getDate();
    for (var i = 0; i < ERAS.length; i++) {
      var e = ERAS[i];
      var s = e.start;
      if (y > s[0] || (y === s[0] && (mo > s[1] || (mo === s[1] && da >= s[2])))) {
        var n = y - s[0] + 1;
        return { name: e.name + (n === 1 ? "元" : n), abbr: e.abbr + pad(n) };
      }
    }
    return { name: "—", abbr: "—" };
  }

  function excelSerial(d) {
    var utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((utc - Date.UTC(1900, 0, 1)) / 86400000) + 2;
  }

  ST.live(function () {
    var r = parseAny(ST.$("src").value);
    if (!r || isNaN(r.d.getTime())) {
      ST.set("mainVal", "-");
      ST.set("detail", "日付として読み取れませんでした。2026-08-27 のような形式でお試しください。");
      ST.$("formatTable").innerHTML = "";
      return;
    }

    var d = r.d;
    var y = d.getFullYear(), mo = d.getMonth() + 1, da = d.getDate();
    var wd = d.getDay();
    var wk = wareki(d);

    ST.set("mainVal", y + "年" + mo + "月" + da + "日（" + WD[wd] + "）");
    ST.set("detail", r.how + "しました。下の表からコピーして使えます。");

    var rows = [
      ["ISO 8601（標準形式）", y + "-" + pad(mo) + "-" + pad(da)],
      ["スラッシュ区切り", y + "/" + pad(mo) + "/" + pad(da)],
      ["ピリオド区切り", y + "." + pad(mo) + "." + pad(da)],
      ["数字8桁", "" + y + pad(mo) + pad(da)],
      ["日本語（漢字）", y + "年" + mo + "月" + da + "日"],
      ["日本語（曜日つき）", y + "年" + mo + "月" + da + "日（" + WD[wd] + "）"],
      ["和暦", wk.name + "年" + mo + "月" + da + "日"],
      ["和暦（短縮）", wk.abbr + "." + pad(mo) + "." + pad(da)],
      ["英語（米国式）", MON_EN[mo - 1] + " " + da + ", " + y],
      ["英語（英国式）", da + " " + MON_EN[mo - 1] + " " + y],
      ["英語（短縮）", MON_EN[mo - 1].substr(0, 3) + " " + da + ", " + y],
      ["曜日（日本語）", WD[wd] + "曜日"],
      ["曜日（英語）", WD_EN[wd]],
      ["エクセルのシリアル値", String(excelSerial(d))],
      ["UNIX時間（秒）", String(Math.floor(new Date(y, mo - 1, da).getTime() / 1000))],
      ["その年の通算日", Math.floor((new Date(y, mo - 1, da) - new Date(y, 0, 1)) / 86400000) + 1 + "日目"]
    ];

    ST.$("formatTable").innerHTML = rows.map(function (row, i) {
      return "<tr><td>" + row[0] + "</td><td id=\\"fmt" + i +
        "\\" style=\\"font-family:ui-monospace,monospace\\">" + row[1] +
        "</td><td><button class=\\"btn sub\\" type=\\"button\\" data-i=\\"" + i +
        "\\" style=\\"font-size:11px;padding:4px 10px\\">コピー</button></td></tr>";
    }).join("");

    // コピーボタン
    Array.prototype.forEach.call(
      ST.$("formatTable").querySelectorAll("button"), function (btn) {
        btn.addEventListener("click", function () {
          ST.copy(ST.$("fmt" + btn.getAttribute("data-i")).textContent, btn);
        });
      });
  });
})();
`,

  intro: `
さまざまな形式の日付を読み取り、他の表記に変換します。**エクセルのシリアル値やUNIX時間** も判別できるので、データを扱っていて日付が数字になってしまった場合にも使えます。
`,

  guide: `
## 日付の書き方は国によって違う

同じ「2026年8月27日」でも、国によって並び順が変わります。

| 形式 | 表記 | 使う地域 |
|---|---|---|
| 年月日 | 2026-08-27 | 日本、中国、ISO標準 |
| 月日年 | 08/27/2026 | **アメリカ** |
| 日月年 | 27/08/2026 | ヨーロッパ、オーストラリア |

**「03/04/2026」は、アメリカでは3月4日、ヨーロッパでは4月3日** を意味します。国際的なやり取りでは、この曖昧さが実際のトラブルにつながります。

避けるには次のいずれかを使ってください。

- **ISO形式（2026-08-27）**: 誤解の余地がなく、並べ替えもできる
- **月名を書く（27 Aug 2026）**: どの順序でも意味が通じる

## ISO 8601形式の利点

**YYYY-MM-DD** という形式は、国際規格ISO 8601で定められています。

- 桁数が固定されているため、**文字列のまま並べ替えると日付順になる**
- 年→月→日と大きい単位から並ぶため、桁の切れ目が明確
- 国による解釈の違いがない

ファイル名に日付を入れるときも、\`20260827_資料.pdf\` のようにすると自然に時系列で並びます。\`8-27-2026\` のような形式では、並べ替えたときにばらばらになります。

## エクセルのシリアル値

エクセルは日付を **1900年1月1日を1とする通算日数** で管理しています。2026年8月27日は 46261 です。

セルの表示形式が「標準」に戻ると日付が5桁の数字になるのは、この内部の値が見えているためです。表示形式を「日付」に変えれば元に戻ります。

なお、エクセルには **1900年をうるう年として扱う** という既知の不具合があります。実在しない1900年2月29日がシリアル値60として存在するため、1900年3月1日以降のすべての日付が1日ずれた状態で記録されています。

これは初期のソフトウェアとの互換性のために意図的に残されているもので、1900年3月以降の日付を扱う限り、計算結果に問題は生じません。

## UNIX時間

**1970年1月1日0時（UTC）からの経過秒数** で時刻を表す方式です。プログラムやログで広く使われています。

- 10桁の数字（1756...）は秒単位
- 13桁の数字はミリ秒単位

タイムゾーンの影響を受けず、単純な引き算で時間差を計算できるのが利点です。

なお、32ビットの符号付き整数で管理しているシステムでは、**2038年1月19日** に上限を超えて桁あふれを起こす問題が知られています（2038年問題）。現在の多くのシステムは64ビットに移行済みです。

## 元号をまたぐ日付の扱い

システムで和暦を扱う場合、改元のたびに対応が必要になります。2019年の改元では、多くの業務システムが修正を迫られました。

内部的には西暦（またはUNIX時間）で持ち、**表示するときだけ和暦に変換する** 設計が推奨されます。データそのものを和暦で保存すると、改元のたびに過去のデータの解釈が必要になります。

## 区切り文字の使い分け

| 区切り | 例 | 主な用途 |
|---|---|---|
| ハイフン | 2026-08-27 | ISO標準、システム間のやり取り |
| スラッシュ | 2026/08/27 | 日本の日常表記 |
| ピリオド | 2026.08.27 | デザイン、印刷物 |
| なし | 20260827 | ファイル名、伝票番号 |

ファイル名にはスラッシュが使えない（パス区切りと解釈される）ため、ハイフンか区切りなしを使います。
`,

  faq: [
    {
      q: "「03/04/2026」はいつを指しますか？",
      a: "国によって変わります。アメリカでは3月4日、ヨーロッパやオーストラリアでは4月3日です。誤解を避けるには、2026-03-04（ISO形式）か、月名を書く形式（4 March 2026）を使ってください。",
    },
    {
      q: "エクセルで日付が5桁の数字になってしまいます。",
      a: "エクセル内部のシリアル値（1900年1月1日を1とする通算日数）が表示されています。セルの表示形式を「標準」から「日付」に変更すれば元に戻ります。",
    },
    {
      q: "ファイル名に日付を入れるならどの形式がいいですか？",
      a: "20260827 または 2026-08-27 がおすすめです。桁数が固定されているため、ファイル名で並べ替えると自然に時系列順になります。スラッシュはパス区切りと解釈されるため使えません。",
    },
    {
      q: "UNIX時間とは何ですか？",
      a: "1970年1月1日0時（UTC）からの経過秒数で時刻を表す方式です。10桁の数字が秒単位、13桁がミリ秒単位です。タイムゾーンの影響を受けず、引き算で時間差を計算できます。",
    },
    {
      q: "システムで和暦を扱うときの注意点は？",
      a: "内部データは西暦で持ち、表示のときだけ和暦に変換する設計が推奨されます。和暦のまま保存すると、改元のたびに過去データの解釈や変換が必要になります。",
    },
  ],
};
