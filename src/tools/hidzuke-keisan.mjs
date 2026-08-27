export default {
  category: "datetime",
  updated: "2026-08-21",
  title: "日数計算ツール｜2つの日付の間の日数・○日後の日付を計算",
  h1: "日数計算ツール",
  description:
    "2つの日付の間が何日あるかを数えたり、今日から○日後・○日前の日付を求めたりできます。土日を除いた営業日数の計算にも対応した無料ツールです。",
  cardText: "日付の差、○日後の日付、営業日数を計算。",
  keywords: [
    "日数計算", "日付計算", "何日後", "何日前", "日数", "営業日", "期間", "カウントダウン", "締切",
  ],
  related: ["nenrei-keisan", "wareki-seireki"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="diff" checked>2つの日付の間の日数</label>
    <label><input type="radio" name="mode" value="add">○日後・○日前の日付</label>
  </div>
</div>

<div id="paneDiff">
  <div class="row">
    <div class="field"><label for="d1">開始日</label><input type="date" id="d1"></div>
    <div class="field"><label for="d2">終了日</label><input type="date" id="d2"></div>
  </div>
  <div class="field">
    <label><input type="checkbox" id="includeEnd"> 終了日も日数に含める（初日・末日の両端を数える）</label>
  </div>
</div>

<div id="paneAdd" hidden>
  <div class="row">
    <div class="field"><label for="base">基準日</label><input type="date" id="base"></div>
    <div class="field"><label for="delta">日数</label>
      <input type="number" id="delta" value="100" step="1"></div>
    <div class="field">
      <span class="field-label">方向</span>
      <div class="pills">
        <label><input type="radio" name="dir" value="after" checked>後</label>
        <label><input type="radio" name="dir" value="before">前</label>
      </div>
    </div>
  </div>
  <div class="field">
    <label><input type="checkbox" id="bizOnly"> 土日を除いて数える（営業日で計算）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">日数</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">週数</div><div class="v" id="weekVal">-</div></div>
    <div><div class="k">土日を除く日数</div><div class="v" id="bizVal">-</div></div>
    <div><div class="k">おおよその月数</div><div class="v" id="monthVal">-</div></div>
    <div><div class="k">時間に直すと</div><div class="v" id="hourVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  var WD = "日月火水木金土";

  function parse(el) {
    if (!el || !el.value) return null;
    var p = el.value.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmt(d) {
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" +
      WD.charAt(d.getDay()) + "）";
  }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
  }
  // 期間内の平日数（開始日を含み、終了日は含まない）
  function bizDays(from, to) {
    var n = 0;
    var cur = new Date(from.getTime());
    while (cur < to) {
      var w = cur.getDay();
      if (w !== 0 && w !== 6) n++;
      cur.setDate(cur.getDate() + 1);
    }
    return n;
  }
  function clear(msg) {
    ["mainVal","weekVal","bizVal","monthVal","hourVal"].forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("paneDiff").hidden = mode !== "diff";
    ST.$("paneAdd").hidden = mode !== "add";

    if (mode === "diff") {
      var a = parse(ST.$("d1")), b = parse(ST.$("d2"));
      if (!a || !b) return clear("開始日と終了日を入力してください。");
      var inc = ST.$("includeEnd").checked;
      var days = Math.round((b - a) / 86400000);
      var abs = Math.abs(days) + (inc ? 1 : 0);
      var biz = days >= 0 ? bizDays(a, b) : bizDays(b, a);
      if (inc) {
        var last = days >= 0 ? b : a;
        if (last.getDay() !== 0 && last.getDay() !== 6) biz++;
      }
      ST.$("mainLabel").textContent = days >= 0 ? "その間の日数" : "その間の日数（開始日のほうが後）";
      ST.set("mainVal", ST.num(abs, 0) + "日");
      ST.set("weekVal", ST.num(Math.floor(abs / 7), 0) + "週" + (abs % 7) + "日");
      ST.set("bizVal", ST.num(biz, 0) + "日");
      ST.set("monthVal", ST.num(abs / 30.44, 1) + "か月");
      ST.set("hourVal", ST.num(abs * 24, 0) + "時間");
      ST.set("detail", fmt(a) + " から " + fmt(b) + " まで" +
        (inc ? "（両端を含む）" : "（終了日は含まない）") + "。");
    } else {
      var base = parse(ST.$("base"));
      if (!base) return clear("基準日を入力してください。");
      var delta = Math.round(ST.n(ST.$("delta")));
      var sign = ST.pick("dir") === "before" ? -1 : 1;
      var biz2 = ST.$("bizOnly").checked;
      var res = new Date(base.getTime());

      if (biz2) {
        var moved = 0;
        while (moved < Math.abs(delta)) {
          res.setDate(res.getDate() + sign);
          var w = res.getDay();
          if (w !== 0 && w !== 6) moved++;
        }
      } else {
        res.setDate(res.getDate() + sign * delta);
      }

      var span = Math.abs(Math.round((res - base) / 86400000));
      ST.$("mainLabel").textContent = fmt(base) + " の " + ST.num(Math.abs(delta), 0) +
        (biz2 ? "営業日" : "日") + (sign > 0 ? "後" : "前");
      ST.set("mainVal", fmt(res));
      ST.set("weekVal", ST.num(Math.floor(span / 7), 0) + "週" + (span % 7) + "日");
      ST.set("bizVal", ST.num(bizDays(sign > 0 ? base : res, sign > 0 ? res : base), 0) + "日");
      ST.set("monthVal", ST.num(span / 30.44, 1) + "か月");
      ST.set("hourVal", ST.num(span * 24, 0) + "時間");
      ST.set("detail", "カレンダー上では " + span + "日ぶんの移動です（" + iso(res) + "）。");
    }
  });

  // 日付欄の初期値を入れる
  var now = new Date();
  function isoNow(offset) {
    var d = new Date(now.getTime());
    d.setDate(d.getDate() + (offset || 0));
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
  }
  [["d1", 0], ["d2", 30], ["base", 0]].forEach(function (pair) {
    var el = ST.$(pair[0]);
    if (el && !el.value) el.value = isoNow(pair[1]);
  });
  ST.$("d1").dispatchEvent(new Event("change", { bubbles: true }));
})();
`,

  intro: `
2つの日付の間が何日あるか、あるいは基準日から数えて何日後がいつになるかを計算します。土日を除いた営業日での計算にも対応しています。
`,

  guide: `
## 「両端を含む」かどうかで1日ずれる

日数の数え方には2通りあり、これが食い違いのもとになります。

- **片端（かたはし）入れ**: 終了日を含めない数え方。4月1日から4月3日までは **2日**
- **両端（りょうたん）入れ**: 初日も末日も数える方法。4月1日から4月3日までは **3日**

宿泊日数や、システムの日付差分は片端入れです。一方、「◯日間開催」といったイベントの日数や、法律上の期間の一部は両端入れで数えます。このツールでは、チェックボックスでどちらにも切り替えられます。

## 法律上の期間の数え方

契約や手続きの期限を計算するときは、民法の考え方が使われます。

- **初日不算入の原則**: 期間の初日は数えず、翌日から数え始めます。4月1日に「10日以内」と言われたら、期限は4月11日です。
- **例外**: 期間が午前0時から始まる場合（例: 「4月1日から」と明示された場合）は初日を含みます。
- **末日が休日のとき**: 期限の日が日曜・祝日などで、その日に取引をしない慣習がある場合は、翌営業日まで延びます。

年齢の計算だけは別のルール（年齢計算ニ関スル法律）で初日を算入します。誕生日の前日に1つ年をとるのはこのためです。

## 営業日と稼働日の違い

このツールの「土日を除く」は、土曜・日曜だけを除外します。祝日・年末年始・お盆は含まれたままです。

実務で言う「営業日」は、その会社の休業日をすべて除いた日数を指すことが多く、業種によって中身が変わります。

- **銀行の営業日**: 土日祝と12月31日〜1月3日を除く日
- **一般企業**: 会社カレンダーによる（土日祝＋夏季・年末年始休暇）
- **配送業者の営業日**: 業者ごとに異なり、日曜配送を行う会社もある

「5営業日以内に発送」といった案内を見たときは、間に祝日が入っていないかを確認すると、到着日の見込みが正確になります。

## 覚えておくと便利な日数

| 期間 | 日数 |
|---|---|
| 1週間 | 7日 |
| 1か月 | 28〜31日（平均30.44日） |
| 四半期 | 約91日 |
| 半年 | 約183日 |
| 1年 | 365日（うるう年は366日） |
| 100日 | 約3.3か月 |
| 1,000日 | 約2年9か月 |

「100日後」「1,000日記念」のような区切りを知りたいときは、このツールの「○日後・○日前の日付」を使うと一度で分かります。

## うるう年の判定

うるう年は次の3つのルールで決まります。

1. 西暦年が4で割り切れる年はうるう年
2. ただし100で割り切れる年は平年
3. ただし400で割り切れる年はうるう年

2000年は400で割り切れるためうるう年でしたが、1900年と2100年は平年です。このツールはブラウザの日付計算を使っているため、これらは自動的に考慮されます。
`,

  faq: [
    {
      q: "日数が想定と1日ずれます。",
      a: "終了日を数に含めるかどうかの違いです。「終了日も日数に含める」にチェックを入れると、初日と末日の両方を数える計算になります。宿泊日数などは含めない数え方が一般的です。",
    },
    {
      q: "「10日以内」の期限はいつまでですか？",
      a: "法律上は初日を数えないため、4月1日に言われた場合は4月11日までです。ただし契約書に「4月1日から」と明記されている場合は初日を含めることがあります。",
    },
    {
      q: "営業日の計算に祝日は含まれますか？",
      a: "このツールは土曜・日曜のみを除外します。祝日や年末年始は除外されないため、実際の営業日数はこれより少なくなることがあります。",
    },
    {
      q: "過去の日付でも計算できますか？",
      a: "できます。開始日より前の終了日を指定した場合も日数が表示されます。「○日前」を選べば、基準日からさかのぼった日付も求められます。",
    },
  ],
};
