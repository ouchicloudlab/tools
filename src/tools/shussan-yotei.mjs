export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "出産予定日の計算｜最終月経から妊娠週数と予定日を出す",
  h1: "出産予定日・妊娠週数の計算ツール",
  description:
    "最終月経開始日から出産予定日と現在の妊娠週数を計算します。今日が妊娠何週何日か、安定期や産休の開始日の目安も同時に確認できる無料ツールです。",
  cardText: "最終月経から予定日・妊娠週数を計算。",
  keywords: [
    "出産予定日", "妊娠週数", "計算", "最終月経", "妊娠", "何週", "安定期", "産休", "臨月",
  ],
  related: ["nenrei-keisan", "hidzuke-keisan"],

  ui: `
<div class="field">
  <span class="field-label">計算のもとにするもの</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="lmp" checked>最終月経の開始日</label>
    <label><input type="radio" name="mode" value="due">出産予定日（すでに分かっている）</label>
  </div>
</div>

<div class="row">
  <div class="field" id="fLmp">
    <label for="lmp">最終月経の開始日</label>
    <input type="date" id="lmp">
  </div>
  <div class="field" id="fDue" hidden>
    <label for="due">出産予定日</label>
    <input type="date" id="due">
  </div>
  <div class="field">
    <label for="cycle">生理周期（日）</label>
    <input type="number" id="cycle" inputmode="numeric" value="28" step="1">
    <p class="hint">28日と大きく違う場合は補正されます。</p>
  </div>
  <div class="field">
    <label for="today">今日の日付</label>
    <input type="date" id="today">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">出産予定日</div>
  <div class="result-main" id="dueVal">-</div>
  <div class="result-grid">
    <div><div class="k">現在の妊娠週数</div><div class="v" id="weekVal">-</div></div>
    <div><div class="k">予定日まで</div><div class="v" id="restVal">-</div></div>
    <div><div class="k">妊娠期間の区分</div><div class="v" id="periodVal">-</div></div>
    <div><div class="k">推定の受精日</div><div class="v" id="conceptVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>これからの予定</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>時期</th><th>妊娠週数</th><th>日付</th><th>目安</th></tr></thead>
    <tbody id="scheduleTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var DAY = 86400000;

  function parse(el) {
    if (!el || !el.value) return null;
    var p = el.value.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
  }
  function fmt(d) {
    var w = "日月火水木金土".charAt(d.getDay());
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" + w + "）";
  }
  function addDays(d, n) {
    var r = new Date(d.getTime());
    r.setDate(r.getDate() + n);
    return r;
  }
  function weekText(days) {
    if (days < 0) return "妊娠前";
    return Math.floor(days / 7) + "週" + (days % 7) + "日";
  }
  function periodOf(week) {
    if (week < 4) return "妊娠超初期";
    if (week < 16) return "初期（〜15週）";
    if (week < 28) return "中期（16〜27週）";
    if (week < 36) return "後期（28〜35週）";
    if (week < 40) return "臨月（36週〜）";
    return "予定日を過ぎています";
  }

  function clear(msg) {
    ["dueVal","weekVal","restVal","periodVal","conceptVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
    ST.$("scheduleTable").innerHTML = "";
  }

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("fLmp").hidden = mode !== "lmp";
    ST.$("fDue").hidden = mode !== "due";

    var today = parse(ST.$("today"));
    if (!today) return clear("今日の日付を入力してください。");

    var cycle = ST.n(ST.$("cycle"), 28);
    if (cycle < 20 || cycle > 45) cycle = 28;
    var adjust = Math.round(cycle - 28); // 周期のずれを補正する日数

    var lmp, due;
    if (mode === "lmp") {
      lmp = parse(ST.$("lmp"));
      if (!lmp) return clear("最終月経の開始日を入力してください。");
      // ネーゲレ概算法: 最終月経初日 + 280日。周期のずれを足す
      due = addDays(lmp, 280 + adjust);
    } else {
      due = parse(ST.$("due"));
      if (!due) return clear("出産予定日を入力してください。");
      lmp = addDays(due, -280 - adjust);
    }

    var elapsed = Math.floor((today - lmp) / DAY);
    var week = Math.floor(elapsed / 7);
    var rest = Math.round((due - today) / DAY);

    ST.set("dueVal", fmt(due));
    ST.set("weekVal", weekText(elapsed));
    ST.set("restVal", rest > 0 ? "あと " + rest + "日"
      : (rest === 0 ? "今日が予定日" : Math.abs(rest) + "日 経過"));
    ST.set("periodVal", periodOf(week));
    ST.set("conceptVal", fmt(addDays(lmp, 14 + adjust)));
    ST.set("detail",
      "最終月経の開始日を0週0日として、280日後（40週0日）を予定日とする計算です（ネーゲレ概算法）。" +
      (adjust !== 0 ? "周期" + cycle + "日ぶんの補正として" + (adjust > 0 ? "+" : "") + adjust + "日を加えています。" : "") +
      "実際に予定日どおりに生まれるのは全体の数%で、多くは前後2週間の範囲に収まります。");

    var rows = [
      [0, "妊娠0週0日", "最終月経の開始日"],
      [4 * 7, "妊娠4週0日", "妊娠検査薬が使える時期"],
      [8 * 7, "妊娠8週0日", "つわりのピークになりやすい"],
      [11 * 7, "妊娠11週0日", "初期の区切り。母子手帳の交付時期"],
      [16 * 7, "妊娠16週0日", "安定期に入る"],
      [20 * 7, "妊娠20週0日", "妊娠の中間点"],
      [28 * 7, "妊娠28週0日", "後期に入る"],
      [34 * 7, "妊娠34週0日", "産前休業の開始（予定日の6週前）"],
      [36 * 7, "妊娠36週0日", "臨月に入る"],
      [37 * 7, "妊娠37週0日", "正期産の始まり"],
      [40 * 7, "妊娠40週0日", "出産予定日"],
      [42 * 7, "妊娠42週0日", "過期産となる"]
    ];
    ST.$("scheduleTable").innerHTML = rows.map(function (r) {
      var d = addDays(lmp, r[0]);
      var passed = d < today;
      var style = passed ? ' style="opacity:.5"' : (Math.abs((d - today) / DAY) < 7 ? ' style="font-weight:700"' : "");
      return "<tr" + style + "><td>" + r[2] + "</td><td>" + r[1] + "</td><td>" +
        fmt(d) + "</td><td>" + (passed ? "済" : "") + "</td></tr>";
    }).join("");
  });

  // 日付の初期値
  var now = new Date();
  var t = ST.$("today");
  if (t && !t.value) t.value = iso(now);
  var l = ST.$("lmp");
  if (l && !l.value) {
    var d = new Date(now.getTime());
    d.setDate(d.getDate() - 70);
    l.value = iso(d);
  }
  var du = ST.$("due");
  if (du && !du.value) {
    var d2 = new Date(now.getTime());
    d2.setDate(d2.getDate() + 210);
    du.value = iso(d2);
  }
  t.dispatchEvent(new Event("change", { bubbles: true }));
})();
`,

  intro: `
最終月経の開始日から、出産予定日と現在の妊娠週数を計算します。**生理周期が28日と違う場合の補正**にも対応しています。すでに予定日が分かっている場合は、そこから逆算して週数を出すこともできます。
`,

  guide: `
## 出産予定日の計算方法

医療機関で使われているのは **ネーゲレ概算法** という計算です。

> **出産予定日 = 最終月経の開始日 ＋ 280日（40週0日）**

日本では、最終月経の開始日を「妊娠0週0日」として数えます。実際に受精するのはその約2週間後なので、**受精した時点ですでに妊娠2週0日** ということになります。この2週間のずれが、週数の理解をややこしくしている原因です。

暗算用の簡易法として、次の方法もあります。

- 最終月経の月に **9を足す**（13を超えたら12を引く）
- 最終月経の日に **7を足す**

例: 最終月経が4月10日 → 月に9を足して1月、日に7を足して17日 → **翌年1月17日ごろ**

ただしこの方法は各月の日数を考慮していないため、280日を正確に足した日付とは **1〜3日ずれます**（上の例では実際には1月15日）。このツールは280日を足す正確な計算をしているので、簡易法の結果と数日違っても誤りではありません。

## 周期が28日でない場合

ネーゲレ概算法は、生理周期が28日であることを前提にしています。周期が長い人は排卵が遅いため、予定日も後ろにずれます。

- 周期35日の人 → 排卵が1週間遅い → 予定日を **7日後ろ** に補正
- 周期21日の人 → 排卵が1週間早い → 予定日を **7日前** に補正

このツールでは周期を入力すると、28日との差を自動で補正します。

ただし実際の診察では、**妊娠初期の超音波検査で測った胎児の大きさ（CRL）** をもとに予定日が修正されることがよくあります。特に妊娠8〜11週の測定は誤差が小さく、この時期に確定した予定日が最終的なものになります。医師から告げられた予定日がある場合は、そちらを優先してください。

## 妊娠期間の区分

| 区分 | 週数 | 主な出来事 |
|---|---|---|
| 初期 | 〜15週 | つわり、母子手帳の交付、心拍の確認 |
| 中期 | 16〜27週 | 安定期、胎動を感じ始める、性別が分かる |
| 後期 | 28〜35週 | 体が重くなる、健診の間隔が短くなる |
| 臨月 | 36週〜 | いつ生まれてもおかしくない時期 |

出産の時期は次のように分類されます。

- **早産**: 22週0日〜36週6日
- **正期産**: **37週0日〜41週6日**（この期間の出産が最も安全とされます）
- **過期産**: 42週0日以降

**予定日ちょうどに生まれるのは全体の約4%** で、多くは正期産の5週間の範囲に分散します。予定日は「その日に生まれる日」ではなく、週数を数えるための基準点と考えてください。

## 産休・育休の期間

| 制度 | 期間 | 備考 |
|---|---|---|
| 産前休業 | 予定日の6週間前から（双子以上は14週間前） | 本人の請求による |
| 産後休業 | 出産の翌日から8週間 | **最初の6週間は強制**。本人が希望し医師が認めれば7週目から就業可 |
| 育児休業 | 産後休業の翌日から原則1歳まで | 保育所に入れない場合は最長2歳まで延長可 |

産前休業の起算日は **出産予定日** なので、実際の出産が遅れた場合、その分は産前休業として扱われます。産後休業は **実際の出産日の翌日** から数えます。

出産手当金は産休期間中、出産育児一時金は出産時に支給されます。手続きの期限があるため、勤務先の担当部署に早めに確認してください。

## 妊娠中に受ける健診の回数

母子健康手帳の交付とあわせて、自治体から健診の補助券が交付されます。標準的な回数は14回程度です。

| 時期 | 健診の間隔 |
|---|---|
| 〜23週 | 4週間に1回 |
| 24〜35週 | 2週間に1回 |
| 36週〜 | 1週間に1回 |

> このツールの計算は一般的な方法による目安です。実際の出産予定日は医療機関の診断によります。体調に不安がある場合は、自己判断せず産婦人科にご相談ください。
`,

  faq: [
    {
      q: "出産予定日はどう計算しますか？",
      a: "最終月経の開始日に280日（40週）を足します。簡易的には、最終月経の月に9を足し（13を超えたら12を引く）、日に7を足す方法もあります。ただし生理周期が28日でない場合は補正が必要です。",
    },
    {
      q: "受精した日が妊娠2週目になるのはなぜですか？",
      a: "日本では最終月経の開始日を「妊娠0週0日」として数えるためです。排卵と受精はその約2週間後に起こるので、受精の時点ですでに妊娠2週0日ということになります。",
    },
    {
      q: "生理周期が長い場合、予定日はずれますか？",
      a: "ずれます。周期が35日なら排卵が約1週間遅いため、予定日も7日後ろになります。このツールでは周期を入力すると自動で補正します。ただし超音波検査による予定日が優先されます。",
    },
    {
      q: "予定日どおりに生まれる人はどれくらいいますか？",
      a: "約4%です。多くは正期産（37週0日〜41週6日）の5週間の範囲に分散します。予定日は「その日に生まれる日」ではなく、週数を数える基準点と考えてください。",
    },
    {
      q: "産休はいつから取れますか？",
      a: "産前休業は出産予定日の6週間前（双子以上は14週間前）から、本人の請求により取得できます。産後休業は出産の翌日から8週間で、最初の6週間は本人が希望しても就業できません。",
    },
  ],
};
