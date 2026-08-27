export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "時間の計算ツール｜時刻の足し算引き算と労働時間の集計",
  h1: "時間の計算ツール",
  description:
    "「9時30分から18時15分まで働いて休憩1時間」のような勤務時間の計算や、時刻の足し算・引き算、分と時間の相互変換ができます。日をまたぐ夜勤の計算にも対応した無料ツールです。",
  cardText: "勤務時間の集計、時刻の加減算、分↔時間の変換。",
  keywords: [
    "時間計算", "労働時間", "勤務時間", "時刻", "足し算", "引き算", "分", "何時間", "夜勤", "残業",
  ],
  related: ["hidzuke-keisan", "jikyu-nensyu"],

  ui: `
<h3 style="margin-top:0">① 勤務時間を計算する</h3>
<div class="row">
  <div class="field"><label for="start">開始時刻</label>
    <input type="time" id="start" value="09:30"></div>
  <div class="field"><label for="end">終了時刻</label>
    <input type="time" id="end" value="18:15"></div>
  <div class="field"><label for="breakMin">休憩（分）</label>
    <input type="number" id="breakMin" inputmode="numeric" value="60" step="5"></div>
</div>
<div class="field">
  <label><input type="checkbox" id="overnight"> 終了が翌日になる（夜勤・日またぎ）</label>
</div>
<div class="result" aria-live="polite">
  <div class="result-label">実働時間</div>
  <div class="result-main" id="workVal">-</div>
  <div class="result-grid">
    <div><div class="k">拘束時間</div><div class="v" id="spanVal">-</div></div>
    <div><div class="k">10進数の時間</div><div class="v" id="decimalVal">-</div></div>
    <div><div class="k">分に直すと</div><div class="v" id="minVal">-</div></div>
    <div><div class="k">法定時間(8h)との差</div><div class="v" id="overVal">-</div></div>
  </div>
  <p class="result-sub" id="workDetail"></p>
</div>

<h3>② 時刻に時間を足す・引く</h3>
<div class="row">
  <div class="field"><label for="base">基準の時刻</label>
    <input type="time" id="base" value="09:00"></div>
  <div class="field"><label for="addH">時間</label>
    <input type="number" id="addH" inputmode="numeric" value="7"></div>
  <div class="field"><label for="addM">分</label>
    <input type="number" id="addM" inputmode="numeric" value="45"></div>
  <div class="field">
    <span class="field-label">操作</span>
    <div class="pills">
      <label><input type="radio" name="op" value="add" checked>足す</label>
      <label><input type="radio" name="op" value="sub">引く</label>
    </div>
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="opVal" style="font-size:26px">-</div>
  <p class="result-sub" id="opDetail"></p>
</div>

<h3>③ 分と時間を相互に変換する</h3>
<div class="row">
  <div class="field"><label for="totalMin">分</label>
    <input type="number" id="totalMin" inputmode="numeric" value="450"></div>
  <div class="field"><label for="hhmm">時間:分</label>
    <input type="text" id="hhmm" value="7:30" placeholder="7:30"></div>
  <div class="field"><label for="dec">10進数の時間</label>
    <input type="number" id="dec" inputmode="decimal" value="7.5" step="0.01"></div>
</div>
<p class="hint">給与計算では10進数の時間（7.5時間）が使われます。7時間30分は7.5時間です。</p>
`,

  script: `
(function () {
  var lock = false;

  function toMin(v) {
    if (!v) return null;
    var p = v.split(":").map(Number);
    if (p.length < 2 || isNaN(p[0]) || isNaN(p[1])) return null;
    return p[0] * 60 + p[1];
  }
  function fmt(min) {
    var sign = min < 0 ? "-" : "";
    min = Math.abs(Math.round(min));
    return sign + Math.floor(min / 60) + "時間" + (min % 60) + "分";
  }
  function fmtClock(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    return String(Math.floor(min / 60)).padStart(2, "0") + ":" +
      String(min % 60).padStart(2, "0");
  }

  // ① 勤務時間
  function calcWork() {
    var s = toMin(ST.$("start").value);
    var e = toMin(ST.$("end").value);
    if (s === null || e === null) {
      ["workVal","spanVal","decimalVal","minVal","overVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("workDetail", "開始時刻と終了時刻を入力してください。");
      return;
    }
    var over = ST.$("overnight").checked;
    var span = e - s;
    if (over || span < 0) span += 1440;
    var br = Math.max(0, ST.n(ST.$("breakMin")));
    var work = span - br;
    if (work < 0) work = 0;

    ST.set("workVal", fmt(work));
    ST.set("spanVal", fmt(span));
    ST.set("decimalVal", ST.num(work / 60, 2) + "時間");
    ST.set("minVal", ST.num(work, 0) + "分");
    // 所定8時間との差。不足のときに "-0時間45分" と出ると読みにくいので
    // 1時間未満は「45分不足」のように分だけで表す。
    var diff = work - 480;
    var gap = Math.abs(diff);
    var gapText = gap < 60 ? gap + "分" : fmt(gap);
    ST.set("overVal", diff === 0 ? "ちょうど8時間"
      : (diff > 0 ? gapText + "の残業" : gapText + "不足"));
    ST.set("workDetail",
      "拘束 " + fmt(span) + " から休憩 " + br + "分を引いて実働 " + fmt(work) + "。" +
      (over || (e - s) < 0 ? "翌日にまたぐ計算をしています。" : "") +
      (span > 480 && br < 60 ? " ※労働時間が8時間を超える場合、休憩は60分以上必要です。"
        : (span > 360 && br < 45 ? " ※労働時間が6時間を超える場合、休憩は45分以上必要です。" : "")));
  }

  // ② 時刻の加減算
  function calcOp() {
    var b = toMin(ST.$("base").value);
    if (b === null) { ST.set("opVal", "-"); return; }
    var delta = Math.round(ST.n(ST.$("addH"))) * 60 + Math.round(ST.n(ST.$("addM")));
    var sign = ST.pick("op") === "sub" ? -1 : 1;
    var res = b + sign * delta;
    var dayShift = Math.floor(res / 1440);
    ST.set("opVal", fmtClock(res) +
      (dayShift > 0 ? "（翌日）" : (dayShift < 0 ? "（前日）" : "")));
    ST.set("opDetail", ST.$("base").value + " の " + fmt(delta) +
      (sign > 0 ? "後" : "前") + " は " + fmtClock(res) + " です。");
  }

  // ③ 分・時間:分・10進数の相互変換
  function render(min, from) {
    lock = true;
    if (from !== "totalMin") ST.$("totalMin").value = Math.round(min);
    if (from !== "hhmm") {
      var sign = min < 0 ? "-" : "";
      var a = Math.abs(Math.round(min));
      ST.$("hhmm").value = sign + Math.floor(a / 60) + ":" + String(a % 60).padStart(2, "0");
    }
    if (from !== "dec") ST.$("dec").value = Math.round(min / 60 * 1000) / 1000;
    lock = false;
  }

  ST.$("totalMin").addEventListener("input", function () {
    if (!lock) render(ST.n(ST.$("totalMin")), "totalMin");
  });
  ST.$("hhmm").addEventListener("input", function () {
    if (lock) return;
    var v = ST.$("hhmm").value.trim();
    var neg = v.charAt(0) === "-";
    var m = toMin(neg ? v.slice(1) : v);
    if (m === null) return;
    render(neg ? -m : m, "hhmm");
  });
  ST.$("dec").addEventListener("input", function () {
    if (!lock) render(ST.n(ST.$("dec")) * 60, "dec");
  });

  ST.live(function () { calcWork(); calcOp(); });
})();
`,

  intro: `
勤務時間の集計、時刻の足し算・引き算、分と時間の相互変換をまとめています。日をまたぐ夜勤や、給与計算で使う10進数の時間表記にも対応しています。
`,

  guide: `
## 勤務時間の計算

実働時間は次の式で求めます。

> **実働時間 = 終了時刻 − 開始時刻 − 休憩時間**

9:30から18:15まで働き、休憩60分の場合は、

- 拘束時間: 18:15 − 9:30 = 8時間45分
- 実働時間: 8時間45分 − 1時間 = **7時間45分**

日をまたぐ夜勤（22:00〜翌6:00など）は、終了時刻に24時間を足して計算します。このツールでは「終了が翌日になる」にチェックを入れるか、終了時刻が開始時刻より前の場合に自動でこの処理を行います。

## 10進数の時間表記

給与計算や工数管理では、**7時間30分を「7.5時間」** と表記します。分をそのまま書くと計算できないためです。

| 分 | 10進数 |
|---|---|
| 15分 | 0.25 |
| 20分 | 0.333… |
| 30分 | 0.5 |
| 40分 | 0.667… |
| 45分 | 0.75 |
| 50分 | 0.833… |

**7時間30分は「7.30時間」ではありません。** 7.5時間です。この読み替えを忘れると、時給計算で大きくずれます。時給1,200円で7時間30分働いた場合、正しくは 1,200 × 7.5 = 9,000円ですが、7.3で計算すると8,760円になり、240円の差が出ます。

## 休憩時間のルール（労働基準法第34条）

労働時間の長さに応じて、与えなければならない休憩時間が決まっています。

| 労働時間 | 必要な休憩 |
|---|---|
| 6時間以下 | 不要 |
| 6時間を超え8時間以下 | 45分以上 |
| 8時間を超える | 60分以上 |

注意点として、これは **労働時間** に対する基準です。「拘束8時間・休憩45分・実働7時間15分」は問題ありませんが、「拘束9時間・休憩45分・実働8時間15分」は労働時間が8時間を超えているため60分の休憩が必要になります。

また、休憩は労働時間の途中に与える必要があり、「終業後に休憩」という扱いは認められません。電話番をしながらの休憩も、労働から完全に解放されていないため休憩とみなされない場合があります。

## 残業時間の計算

法定労働時間は **1日8時間・週40時間** です。これを超えた分が時間外労働（残業）となり、割増賃金の対象になります。

| 種類 | 割増率 |
|---|---|
| 時間外労働（法定8時間超） | 25%以上 |
| 時間外労働が月60時間を超える部分 | 50%以上 |
| 深夜労働（22時〜翌5時） | 25%以上 |
| 休日労働（法定休日） | 35%以上 |
| 時間外＋深夜 | 50%以上 |

深夜の割増は時間外とは別に加算されます。22時以降に残業した場合、25%（時間外）＋25%（深夜）で50%増しになります。

なお、所定労働時間が7時間の会社で8時間働いた場合、超過した1時間は「法定内残業」となり、割増のない通常の時給が支払われるのが原則です（会社の規定でそれ以上を支払う場合もあります）。

## 労働時間の端数処理

**1日ごとの労働時間を切り捨てるのは違法** です。「17時58分に退勤したので17時30分として扱う」といった処理は認められません。

認められているのは、**1か月の合計** に対して30分未満を切り捨て、30分以上を1時間に切り上げる処理のみです（昭和63年通達）。1日単位や1週間単位での端数処理はできません。

## 時刻の表記

24時間制では、深夜0時を「0:00」と書くのが正式です。ただし放送業界や飲食店では、日付をまたがない表記として「25:00」「26:00」といった書き方（30時間制）も使われます。

- 24:00 = 翌日の0:00（その日の終わり）
- 25:00 = 翌日の1:00
- 27:00 = 翌日の3:00

深夜営業の店の「営業時間 18:00〜26:00」は、翌朝2時までという意味です。
`,

  faq: [
    {
      q: "7時間30分は10進数で何時間ですか？",
      a: "7.5時間です。7.30ではありません。分を60で割った値が小数部分になります。15分なら0.25、45分なら0.75です。給与計算ではこの表記が使われます。",
    },
    {
      q: "夜勤の勤務時間はどう計算しますか？",
      a: "終了時刻に24時間を足して計算します。22:00〜翌6:00なら、6:00 + 24:00 = 30:00として、30:00 − 22:00 = 8時間です。このツールでは終了時刻が開始時刻より前の場合、自動で翌日として計算します。",
    },
    {
      q: "休憩は何分取らなければいけませんか？",
      a: "労働時間が6時間を超える場合は45分以上、8時間を超える場合は60分以上です。労働時間の途中に与える必要があり、終業後にまとめて取る扱いは認められません。",
    },
    {
      q: "残業代の割増率はどれくらいですか？",
      a: "法定労働時間を超える時間外労働は25%以上、深夜（22時〜翌5時）はさらに25%以上が加算されます。月60時間を超える時間外労働は50%以上、法定休日の労働は35%以上です。",
    },
    {
      q: "毎日の労働時間を15分単位で切り捨てるのは合法ですか？",
      a: "違法です。1日ごとの端数の切り捨ては認められていません。認められているのは1か月の合計時間に対して、30分未満を切り捨て30分以上を切り上げる処理だけです。",
    },
  ],
};
