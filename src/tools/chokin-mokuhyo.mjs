export default {
  category: "money",
  updated: "2026-08-27",
  title: "貯金目標の計算｜毎月いくら貯めれば間に合うか",
  h1: "貯金目標の計算ツール",
  description:
    "目標額と期限から、毎月いくら貯めればよいかを計算します。今の貯金額を差し引いた必要額や、達成までの期間も確認できる無料ツールです。",
  cardText: "目標額と期限から毎月の貯金額を逆算。",
  keywords: [
    "貯金", "目標", "計算", "毎月", "いくら", "貯蓄", "積立", "期限", "逆算",
  ],
  related: ["tsumitate-fukuri", "jikyu-nensyu"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="monthly" checked>毎月いくら貯めるか</label>
    <label><input type="radio" name="mode" value="period">いつ達成できるか</label>
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="goal">目標額（円）</label>
    <input type="number" id="goal" inputmode="decimal" value="1000000" step="10000">
  </div>
  <div class="field">
    <label for="current">今ある貯金（円）</label>
    <input type="number" id="current" inputmode="decimal" value="200000" step="10000">
  </div>
  <div class="field" id="fMonths">
    <label for="months">期限（か月）</label>
    <input type="number" id="months" inputmode="numeric" value="24" step="1">
  </div>
  <div class="field" id="fSave" hidden>
    <label for="save">毎月の貯金額（円）</label>
    <input type="number" id="save" inputmode="decimal" value="30000" step="5000">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="bonus">ボーナスからの貯金（円/回）</label>
    <input type="number" id="bonus" inputmode="decimal" value="0" step="10000">
  </div>
  <div class="field">
    <label for="bonusCount">ボーナスの回数（年）</label>
    <input type="number" id="bonusCount" inputmode="numeric" value="2" step="1">
  </div>
  <div class="field">
    <label for="income">月の手取り（任意）</label>
    <input type="number" id="income" inputmode="decimal" value="250000" step="10000">
    <p class="hint">貯蓄率の目安を出すために使います。</p>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">毎月の貯金額</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">あと必要な額</div><div class="v" id="needVal">-</div></div>
    <div><div class="k">ボーナスで貯まる分</div><div class="v" id="bonusTotalVal">-</div></div>
    <div><div class="k">月々で貯める分</div><div class="v" id="monthlyTotalVal">-</div></div>
    <div><div class="k">手取りに占める割合</div><div class="v" id="rateVal">-</div></div>
    <div><div class="k">1日あたり</div><div class="v" id="dailyVal">-</div></div>
    <div><div class="k">達成予定</div><div class="v" id="finishVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>貯まっていく様子</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>経過</th><th>貯金額</th><th>達成率</th></tr></thead>
    <tbody id="progressTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("fMonths").hidden = mode !== "monthly";
    ST.$("fSave").hidden = mode !== "period";

    var goal = Math.max(0, ST.n(ST.$("goal")));
    var current = Math.max(0, ST.n(ST.$("current")));
    var bonus = Math.max(0, ST.n(ST.$("bonus")));
    var bonusCount = Math.max(0, Math.round(ST.n(ST.$("bonusCount"))));
    var income = Math.max(0, ST.n(ST.$("income")));
    var need = Math.max(0, goal - current);

    function clear(msg) {
      ["mainVal","needVal","bonusTotalVal","monthlyTotalVal","rateVal","dailyVal","finishVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", msg);
      ST.$("progressTable").innerHTML = "";
    }

    if (goal <= 0) return clear("目標額を入力してください。");
    if (need === 0) return clear("すでに目標額に達しています。");

    var months, monthly;

    if (mode === "monthly") {
      months = Math.round(ST.n(ST.$("months")));
      if (months <= 0) return clear("期限に1か月以上を入力してください。");
      // 期間中に受け取るボーナスの回数
      var bonusTimes = Math.floor(months / 12 * bonusCount);
      var fromBonus = bonus * bonusTimes;
      monthly = Math.max(0, (need - fromBonus) / months);

      ST.$("mainLabel").textContent = "毎月の貯金額";
      ST.set("mainVal", ST.yen(Math.ceil(monthly / 100) * 100, 0));
      ST.set("bonusTotalVal", ST.yen(fromBonus, 0) + "（" + bonusTimes + "回）");
      ST.set("monthlyTotalVal", ST.yen(Math.round(monthly * months), 0));
      ST.set("detail",
        "目標 " + ST.yen(goal, 0) + " − 今の貯金 " + ST.yen(current, 0) + " = " +
        ST.yen(need, 0) + " を " + months + "か月で貯めます。" +
        (fromBonus > 0 ? "ボーナスから " + ST.yen(fromBonus, 0) + " を差し引いた残りが月々の負担です。" : "") +
        (monthly === 0 ? "ボーナスだけで目標に届きます。" : ""));
    } else {
      monthly = Math.max(0, ST.n(ST.$("save")));
      var perYear = monthly * 12 + bonus * bonusCount;
      if (perYear <= 0) return clear("毎月の貯金額かボーナスの額を入力してください。");
      months = Math.ceil(need / (perYear / 12));

      ST.$("mainLabel").textContent = "達成までの期間";
      ST.set("mainVal", Math.floor(months / 12) + "年" + (months % 12) + "か月");
      var bonusTimes2 = Math.floor(months / 12 * bonusCount);
      ST.set("bonusTotalVal", ST.yen(bonus * bonusTimes2, 0) + "（" + bonusTimes2 + "回）");
      ST.set("monthlyTotalVal", ST.yen(Math.round(monthly * months), 0));
      ST.set("detail",
        "毎月 " + ST.yen(monthly, 0) +
        (bonus > 0 ? " ＋ ボーナス年 " + ST.yen(bonus * bonusCount, 0) : "") +
        " のペースで、" + ST.yen(need, 0) + " を貯めるのにかかる期間です。");
    }

    ST.set("needVal", ST.yen(need, 0));
    ST.set("rateVal", income > 0 ? ST.num(monthly / income * 100, 1) + "%" : "-");
    ST.set("dailyVal", ST.yen(Math.round(monthly / 30), 0));

    var d = new Date();
    d.setMonth(d.getMonth() + months);
    ST.set("finishVal", d.getFullYear() + "年" + (d.getMonth() + 1) + "月");

    // 進捗表
    var rows = "";
    var marks = [];
    for (var i = 1; i <= 6; i++) {
      marks.push(Math.round(months * i / 6));
    }
    marks = marks.filter(function (v, i, arr) { return v > 0 && arr.indexOf(v) === i; });
    marks.forEach(function (m) {
      var bonusTimes3 = Math.floor(m / 12 * bonusCount);
      var saved = current + monthly * m + bonus * bonusTimes3;
      rows += "<tr><td>" + m + "か月後</td><td>" + ST.yen(Math.round(saved), 0) +
        "</td><td>" + ST.num(Math.min(100, saved / goal * 100), 1) + "%</td></tr>";
    });
    ST.$("progressTable").innerHTML = rows;
  });
})();
`,

  intro: `
目標額と期限を入れると、毎月いくら貯めればよいかが出ます。**ボーナスからの貯金**も計算に入れられるので、月々の負担を現実的な額に調整できます。
`,

  guide: `
## 計算のしかた

> **毎月の貯金額 = (目標額 − 今ある貯金 − ボーナスからの合計) ÷ 期間（か月）**

100万円を2年で貯める場合、すでに20万円あるなら、

- 必要額: 100万 − 20万 = 80万円
- 80万 ÷ 24か月 = **月33,400円**

ボーナスから年2回・各10万円を貯めるなら、2年で40万円。残り40万円を24で割って **月16,700円** まで下がります。

## 貯蓄率の目安

手取りに対して何%を貯金に回すか、という考え方です。

| 状況 | 貯蓄率の目安 |
|---|---|
| 単身・実家暮らし | 30〜40% |
| 単身・一人暮らし | 15〜20% |
| 夫婦のみ | 20〜25% |
| 子どもがいる家庭 | 10〜15% |
| 教育費のピーク期 | 5〜10% |

手取り25万円の一人暮らしなら、月4〜5万円が一つの目安になります。ただし住居費の高い地域では下がるのが自然で、無理に高い目標を設定すると続きません。

## 先取り貯金が続く理由

「余ったら貯金する」方法はほとんど機能しません。使えるお金があると、その範囲で生活が広がってしまうためです（パーキンソンの法則）。

有効なのは、**給料が入った時点で先に貯金分を分ける** 方法です。

- 給与振込口座から自動で別口座へ移す（自動積立定期など）
- 財形貯蓄や社内預金を使う（給与天引きなので手元に来ない）
- つみたてNISAやiDeCoの口座引き落としを給料日直後に設定する

引き出しにくい場所に置くほど成功率が上がります。生活口座と貯蓄口座は、できれば別の銀行に分けてください。

## 目的別の目安額

| 目的 | 目安 |
|---|---|
| 生活防衛資金 | 生活費の3〜6か月分 |
| 冠婚葬祭・急な出費 | 20〜30万円 |
| 引っ越し費用 | 家賃の5〜6か月分 |
| 車の購入（中古） | 100〜200万円 |
| 住宅購入の頭金 | 物件価格の1〜2割 |
| 結婚資金 | 100〜300万円（挙式の形式による） |
| 教育資金（大学まで） | 子ども1人あたり500〜1,000万円 |

**まず優先すべきは生活防衛資金** です。病気やケガ、失業で収入が途絶えたときに、慌てて借金をせずに済むための備えです。これがない状態で投資を始めると、下落したタイミングで生活費のために売却する羽目になります。

## 金利を考える必要があるか

このツールは金利を考慮していません。普通預金の金利は年0.001〜0.2%程度で、100万円を1年預けても数十円から2,000円ほどにしかならないためです。

**5年以上先の目標** であれば、運用も選択肢に入ります。年利3〜5%で運用できれば結果は大きく変わります。その場合は[積立・複利計算ツール](/tsumitate-fukuri/)をお使いください。

ただし、運用は元本が減る可能性があります。使う時期が決まっているお金（1〜3年以内に必要なもの）は、預金で確保しておくのが基本です。

## 貯まらないときの見直し方

支出は次の3つに分けると整理しやすくなります。

- **固定費**: 家賃、通信費、保険、サブスク — **ここを削るのが最も効果的**
- **変動費**: 食費、日用品、交際費 — 努力が必要で続きにくい
- **特別費**: 旅行、家電の買い替え — 年間で予算を決めておく

固定費は一度見直せば効果が続きます。格安SIMへの乗り換えで月5,000円、使っていないサブスクの解約で月2,000円削減できれば、それだけで年間84,000円です。食費を毎日削るより、はるかに楽で確実です。
`,

  faq: [
    {
      q: "毎月いくら貯金すればいいですか？",
      a: "手取りに対する割合で考えると目安が立てやすくなります。一人暮らしなら15〜20%、実家暮らしなら30〜40%が一般的です。手取り25万円の一人暮らしなら月4〜5万円が目安になります。",
    },
    {
      q: "貯金が続かないのですが、どうすればいいですか？",
      a: "「余ったら貯金」ではなく、給料が入った時点で先に分ける方法に変えてください。自動積立や財形貯蓄など、手元に来ない仕組みにすると成功率が上がります。生活口座と貯蓄口座を別の銀行にするのも有効です。",
    },
    {
      q: "まず何のために貯めるべきですか？",
      a: "生活防衛資金（生活費の3〜6か月分）が最優先です。収入が途絶えたときの備えで、これがないと急な出費のたびに借入が必要になります。確保できてから、目的別の貯金や投資に進んでください。",
    },
    {
      q: "金利は計算に入っていますか？",
      a: "入っていません。普通預金の金利では、100万円を1年預けても数十円から2,000円程度にしかならないためです。5年以上先の目標で運用を考える場合は、積立・複利計算ツールをお使いください。",
    },
    {
      q: "支出を減らすにはどこから手をつけるべきですか？",
      a: "固定費です。家賃、通信費、保険、サブスクは一度見直せば効果が続きます。格安SIMへの乗り換えと不要なサブスクの解約だけで、年間8万円以上減ることも珍しくありません。",
    },
  ],
};
