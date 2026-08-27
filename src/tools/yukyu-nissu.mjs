export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "有給休暇の付与日数｜勤続年数から何日もらえるか計算",
  h1: "有給休暇の日数 計算ツール",
  description:
    "入社日から有給休暇が何日付与されるかを計算します。週の勤務日数が少ないパート・アルバイトの比例付与にも対応した無料ツールです。",
  cardText: "入社日から有給の付与日数と次回付与日を計算。",
  keywords: [
    "有給休暇", "日数", "計算", "付与", "勤続年数", "パート", "比例付与", "年次有給休暇", "時効",
  ],
  yomi: "ゆうきゅう ゆうきゅうきゅうか",
  related: ["hidzuke-keisan", "zangyodai"],

  ui: `
<div class="row">
  <div class="field">
    <label for="joined">入社日</label>
    <input type="date" id="joined" value="2023-04-01">
  </div>
  <div class="field">
    <label for="today">基準日（この日時点で計算）</label>
    <input type="date" id="today">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="days">週の所定労働日数</label>
    <select id="days">
      <option value="5" selected>週5日以上（または週30時間以上）</option>
      <option value="4">週4日</option>
      <option value="3">週3日</option>
      <option value="2">週2日</option>
      <option value="1">週1日</option>
    </select>
  </div>
  <div class="field">
    <label for="used">これまでに使った日数</label>
    <input type="number" id="used" inputmode="numeric" value="0" step="1">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">直近に付与された日数</div>
  <div class="result-main" id="grantVal">-</div>
  <div class="result-grid">
    <div><div class="k">勤続年数</div><div class="v" id="tenureVal">-</div></div>
    <div><div class="k">次回の付与日</div><div class="v" id="nextVal">-</div></div>
    <div><div class="k">次回の付与日数</div><div class="v" id="nextDaysVal">-</div></div>
    <div><div class="k">前年の繰越を含む上限</div><div class="v" id="maxVal">-</div></div>
    <div><div class="k">残っている見込み</div><div class="v" id="restVal">-</div></div>
    <div><div class="k">年5日の取得義務</div><div class="v" id="dutyVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>付与日数の表</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>勤続年数</th><th>週5日以上</th><th>週4日</th><th>週3日</th><th>週2日</th><th>週1日</th></tr></thead>
    <tbody id="grantTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  // 労働基準法の付与日数。[勤続の節目, 週5, 週4, 週3, 週2, 週1]
  var TABLE = [
    ["6か月", 10, 7, 5, 3, 1],
    ["1年6か月", 11, 8, 6, 4, 2],
    ["2年6か月", 12, 9, 6, 4, 2],
    ["3年6か月", 14, 10, 8, 5, 2],
    ["4年6か月", 16, 12, 9, 6, 3],
    ["5年6か月", 18, 13, 10, 6, 3],
    ["6年6か月以上", 20, 15, 11, 7, 3]
  ];
  var COL = { "5": 1, "4": 2, "3": 3, "2": 4, "1": 5 };

  function parse(el) {
    if (!el || !el.value) return null;
    var p = el.value.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmt(d) {
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }
  function addMonths(d, n) {
    var r = new Date(d.getTime());
    r.setMonth(r.getMonth() + n);
    return r;
  }

  ST.live(function () {
    var joined = parse(ST.$("joined"));
    var today = parse(ST.$("today"));
    var col = COL[ST.$("days").value] || 1;
    var used = Math.max(0, ST.n(ST.$("used")));

    if (!joined || !today) {
      ["grantVal","tenureVal","nextVal","nextDaysVal","maxVal","restVal","dutyVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "入社日と基準日を入力してください。");
      ST.$("grantTable").innerHTML = "";
      return;
    }
    if (today < joined) {
      ["grantVal","tenureVal","nextVal","nextDaysVal","maxVal","restVal","dutyVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "基準日が入社日より前になっています。");
      ST.$("grantTable").innerHTML = "";
      return;
    }

    // 経過月数
    var months = (today.getFullYear() - joined.getFullYear()) * 12 +
      (today.getMonth() - joined.getMonth());
    if (today.getDate() < joined.getDate()) months--;

    // 最初の付与は6か月後、その後は1年ごと
    // 6か月で TABLE[0]、以後1年ごとに1つ進む。最後の行（6年6か月以上）で頭打ち。
    var idx = months < 6 ? -1 : Math.min(TABLE.length - 1, Math.floor((months - 6) / 12));
    var grant = idx >= 0 ? TABLE[idx][col] : 0;
    // 前年の付与日数は「1年前の時点の勤続月数」から求める。
    // テーブルの1つ前の行を見ると、20日で頭打ちになった後に18日と誤る。
    var prevIdx = (months - 12) < 6
      ? -1 : Math.min(TABLE.length - 1, Math.floor((months - 18) / 12));
    var prevGrant = prevIdx >= 0 ? TABLE[prevIdx][col] : 0;

    // 次回付与日
    var nextMonths = months < 6 ? 6 : 6 + (Math.floor((months - 6) / 12) + 1) * 12;
    var nextDate = addMonths(joined, nextMonths);
    var nextIdx = Math.min(TABLE.length - 1, Math.floor((nextMonths - 6) / 12));
    var nextGrant = TABLE[Math.max(0, nextIdx)][col];

    var y = Math.floor(months / 12), m = months % 12;

    ST.set("grantVal", idx >= 0 ? grant + " 日" : "まだ付与されていません");
    ST.set("tenureVal", y + "年" + m + "か月");
    ST.set("nextVal", fmt(nextDate));
    ST.set("nextDaysVal", nextGrant + " 日");
    ST.set("maxVal", idx >= 0 ? (grant + prevGrant) + " 日" : "—");
    ST.set("restVal", idx >= 0
      ? Math.max(0, grant + prevGrant - used) + " 日（使用 " + ST.num(used, 0) + " 日）"
      : "—");
    ST.set("dutyVal", grant >= 10
      ? (used >= 5 ? "達成（5日以上取得済み）" : "あと " + (5 - used) + " 日の取得が必要")
      : "対象外（付与10日未満）");

    ST.set("detail", idx >= 0
      ? "入社から6か月で最初の付与があり、以後は1年ごとに付与されます。" +
        "有給休暇の時効は2年なので、前年ぶんまでが繰り越せます（上限 " +
        (grant + prevGrant) + "日）。"
      : "最初の付与は入社から6か月後（" + fmt(addMonths(joined, 6)) + "）です。" +
        "それまでに全労働日の8割以上出勤していることが条件になります。");

    // 表
    ST.$("grantTable").innerHTML = TABLE.map(function (r, i) {
      var hit = i === idx;
      return "<tr" + (hit ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" +
        r[3] + "</td><td>" + r[4] + "</td><td>" + r[5] + "</td></tr>";
    }).join("");
  });

  var t = ST.$("today");
  if (t && !t.value) {
    var now = new Date();
    t.value = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
  }
  t.dispatchEvent(new Event("change", { bubbles: true }));
})();
`,

  intro: `
入社日から、有給休暇が何日付与されているかを計算します。**週の勤務日数が少ないパート・アルバイトの比例付与**にも対応しています。
`,

  guide: `
## 付与のタイミング

有給休暇は、**入社から6か月後に最初の付与** があり、その後は **1年ごと** に付与されます。

付与の条件は2つです。

1. 雇い入れの日から6か月継続して勤務していること
2. 全労働日の **8割以上** 出勤していること

正社員・パート・アルバイトの区別なく、条件を満たせば必ず付与されます。**「うちはアルバイトに有給はない」という説明は誤り** です。

## 付与日数（週5日以上勤務の場合）

| 勤続年数 | 付与日数 |
|---|---|
| 6か月 | **10日** |
| 1年6か月 | 11日 |
| 2年6か月 | 12日 |
| 3年6か月 | 14日 |
| 4年6か月 | 16日 |
| 5年6か月 | 18日 |
| 6年6か月以上 | **20日** |

6年6か月で上限の20日に達し、それ以降は毎年20日ずつ付与されます。

## パート・アルバイトの比例付与

週の所定労働日数が4日以下（かつ週30時間未満）の場合、日数に応じて比例した日数が付与されます。

| 勤続 | 週4日 | 週3日 | 週2日 | 週1日 |
|---|---|---|---|---|
| 6か月 | 7日 | 5日 | 3日 | 1日 |
| 1年6か月 | 8日 | 6日 | 4日 | 2日 |
| 2年6か月 | 9日 | 6日 | 4日 | 2日 |
| 3年6か月 | 10日 | 8日 | 5日 | 2日 |
| 4年6か月 | 12日 | 9日 | 6日 | 3日 |
| 5年6か月 | 13日 | 10日 | 6日 | 3日 |
| 6年6か月以上 | 15日 | 11日 | 7日 | 3日 |

**週30時間以上働いている場合は、勤務日数が少なくても週5日と同じ日数** が付与されます。週3日勤務でも1日10時間なら30時間なので、10日付与の対象です。

## 時効は2年

有給休暇の権利は **2年で時効** になります（労働基準法115条）。

つまり、繰り越せるのは前年分までです。今年20日付与され、前年の未消化が20日残っていれば、合計40日が上限になります。それ以上は積み上がりません。

古い分から先に使うか、新しい分から使うかは法律で定められていませんが、**古い分から消化する運用が一般的** です（労働者に有利なため）。就業規則を確認してください。

## 年5日の取得義務

2019年4月から、**年10日以上の有給が付与される労働者には、年5日以上を取得させることが義務** になりました。

- 対象は、付与日数が10日以上の人（パートでも該当すれば対象）
- 企業側の義務であり、達成できないと **1人あたり30万円以下の罰金**
- 労働者が自分で取得しない場合、会社が時季を指定して取得させる必要があります

「忙しくて休めない」という状況でも、会社側に取得させる義務があります。

## よくある誤解

| 誤解 | 実際 |
|---|---|
| 有給の取得に理由が必要 | **不要**。理由を告げる義務はありません |
| 会社が拒否できる | 原則できません。**時季変更権**で日をずらせるだけです |
| 退職時に消化できない | できます。ただし引き継ぎとの調整は必要です |
| 買い取ってもらえる | 原則不可。**時効消滅分・退職時の残日数などは例外的に可** |
| パートには付与されない | 条件を満たせば付与されます |

**時季変更権** は「事業の正常な運営を妨げる場合」にのみ認められ、単に忙しいという理由では認められません。代替要員の確保が困難といった具体的な事情が必要です。

## 半休・時間単位の取得

- **半日単位**: 法律上の定めはなく、会社が制度として設けていれば可能
- **時間単位**: 労使協定を結べば、**年5日を上限** に時間単位で取得できます

いずれも会社の制度次第です。就業規則を確認してください。

> 実際の付与日や運用は、就業規則や労使協定によって法定を上回る内容になっている場合があります（入社日に一律付与する「斉一的取扱い」など）。詳細は勤務先の担当部署にご確認ください。
`,

  faq: [
    {
      q: "有給休暇はいつからもらえますか？",
      a: "入社から6か月経過し、全労働日の8割以上出勤していれば付与されます。週5日勤務なら最初は10日です。その後は1年ごとに付与されます。",
    },
    {
      q: "アルバイトでも有給休暇はもらえますか？",
      a: "もらえます。雇用形態に関係なく、6か月継続勤務と8割以上の出勤という条件を満たせば必ず付与されます。週の勤務日数が少ない場合は、日数に応じた比例付与になります。",
    },
    {
      q: "有給は何日まで繰り越せますか？",
      a: "時効が2年なので、前年分までです。今年20日・前年20日なら合計40日が上限で、それ以上は積み上がりません。",
    },
    {
      q: "有給を取るのに理由は必要ですか？",
      a: "不要です。理由を告げる義務はなく、会社が理由によって取得を拒むこともできません。会社にできるのは、事業の正常な運営を妨げる場合に日をずらす「時季変更権」の行使だけです。",
    },
    {
      q: "年5日の取得義務とは何ですか？",
      a: "年10日以上付与される人には、年5日以上を取得させることが会社の義務です（2019年4月から）。達成できない場合、会社に1人あたり30万円以下の罰金が科されます。",
    },
  ],
};
