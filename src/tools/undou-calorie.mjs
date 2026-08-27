export default {
  category: "health",
  updated: "2026-08-27",
  title: "消費カロリー計算ツール｜運動別のkcalをMETsから算出",
  h1: "運動の消費カロリー計算ツール",
  description:
    "ウォーキング・ランニング・水泳など40種類の運動について、体重と時間から消費カロリーを計算します。ごはん何杯分にあたるかの目安も表示する無料ツールです。",
  cardText: "運動40種の消費カロリーをMETsから計算。",
  keywords: [
    "消費カロリー", "計算", "運動", "METs", "ウォーキング", "ランニング", "ダイエット", "kcal", "有酸素",
  ],
  yomi: "うんどう しょうひかろりー",
  related: ["bmi-keisan", "calorie-hitsuyo"],

  ui: `
<div class="row">
  <div class="field">
    <label for="weight">体重（kg）</label>
    <input type="number" id="weight" inputmode="decimal" value="60" step="0.1">
  </div>
  <div class="field">
    <label for="minutes">運動した時間（分）</label>
    <input type="number" id="minutes" inputmode="decimal" value="30" step="5">
  </div>
</div>

<div class="field">
  <label for="activity">運動の種類</label>
  <select id="activity">
    <optgroup label="歩く・走る">
      <option value="2.8|ゆっくり歩く（3km/h）">ゆっくり歩く（3km/h）</option>
      <option value="3.5|普通に歩く（4km/h）" selected>普通に歩く（4km/h）</option>
      <option value="4.3|やや速く歩く（5.6km/h）">やや速く歩く（5.6km/h）</option>
      <option value="5.0|速歩（6.4km/h）">速歩（6.4km/h）</option>
      <option value="7.0|ジョギング（8km/h）">ジョギング（8km/h）</option>
      <option value="9.8|ランニング（10km/h）">ランニング（10km/h）</option>
      <option value="11.5|ランニング（12km/h）">ランニング（12km/h）</option>
      <option value="8.0|階段を上る">階段を上る</option>
    </optgroup>
    <optgroup label="自転車・水泳">
      <option value="4.0|自転車・通勤（16km/h未満）">自転車・通勤（16km/h未満）</option>
      <option value="6.8|自転車（16〜19km/h）">自転車（16〜19km/h）</option>
      <option value="10.0|自転車（22〜25km/h）">自転車（22〜25km/h）</option>
      <option value="5.3|水中ウォーキング">水中ウォーキング</option>
      <option value="5.8|水泳・平泳ぎ">水泳・平泳ぎ</option>
      <option value="8.3|水泳・クロール（ゆっくり）">水泳・クロール（ゆっくり）</option>
      <option value="10.0|水泳・クロール（速い）">水泳・クロール（速い）</option>
    </optgroup>
    <optgroup label="筋トレ・体操">
      <option value="3.5|筋トレ（軽・中程度）">筋トレ（軽・中程度）</option>
      <option value="6.0|筋トレ（高強度）">筋トレ（高強度）</option>
      <option value="2.8|ストレッチ">ストレッチ</option>
      <option value="2.5|ヨガ">ヨガ</option>
      <option value="3.0|ピラティス">ピラティス</option>
      <option value="7.0|エアロビクス">エアロビクス</option>
      <option value="8.0|腕立て・腹筋（激しい）">腕立て・腹筋（激しい）</option>
      <option value="8.0|なわとび（ゆっくり）">なわとび（ゆっくり）</option>
      <option value="12.3|なわとび（速い）">なわとび（速い）</option>
    </optgroup>
    <optgroup label="スポーツ">
      <option value="6.5|バドミントン">バドミントン</option>
      <option value="7.3|テニス（シングルス）">テニス（シングルス）</option>
      <option value="6.0|卓球">卓球</option>
      <option value="6.5|バスケットボール">バスケットボール</option>
      <option value="7.0|サッカー（レクリエーション）">サッカー（レクリエーション）</option>
      <option value="5.0|野球・ソフトボール">野球・ソフトボール</option>
      <option value="3.0|ボウリング">ボウリング</option>
      <option value="4.8|ゴルフ（カートなし）">ゴルフ（カートなし）</option>
      <option value="7.0|スキー">スキー</option>
      <option value="5.3|バレーボール">バレーボール</option>
      <option value="10.3|武道・武術">武道・武術</option>
    </optgroup>
    <optgroup label="家事・日常">
      <option value="2.0|料理・皿洗い">料理・皿洗い</option>
      <option value="3.3|掃除機をかける">掃除機をかける</option>
      <option value="3.5|風呂掃除">風呂掃除</option>
      <option value="4.0|庭の草むしり">庭の草むしり</option>
      <option value="5.5|雪かき">雪かき</option>
      <option value="3.0|子どもと遊ぶ（中強度）">子どもと遊ぶ（中強度）</option>
      <option value="1.3|デスクワーク">デスクワーク</option>
      <option value="1.0|静かに座る">静かに座る</option>
    </optgroup>
  </select>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">消費カロリー</div>
  <div class="result-main" id="kcalVal">-</div>
  <div class="result-grid">
    <div><div class="k">運動強度（METs）</div><div class="v" id="metsVal">-</div></div>
    <div><div class="k">1時間あたり</div><div class="v" id="hourVal">-</div></div>
    <div><div class="k">安静時より多い分</div><div class="v" id="netVal">-</div></div>
    <div><div class="k">ごはん（1杯234kcal）</div><div class="v" id="riceVal">-</div></div>
    <div><div class="k">脂肪に換算すると</div><div class="v" id="fatVal">-</div></div>
    <div><div class="k">運動強度の目安</div><div class="v" id="exVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>この運動で消費した分の食べ物</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>食品</th><th>カロリー</th><th>この運動で消費するのに必要な時間</th></tr></thead>
    <tbody id="foodTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var FOODS = [
    ["ごはん 茶碗1杯（150g）", 234],
    ["食パン 6枚切り1枚", 149],
    ["おにぎり 1個", 180],
    ["カップラーメン 1個", 350],
    ["ラーメン 1杯", 500],
    ["カレーライス 1皿", 700],
    ["ハンバーガー 1個", 260],
    ["ポテトチップス 1袋（60g）", 335],
    ["板チョコ 1枚", 280],
    ["ショートケーキ 1個", 340],
    ["ビール 500ml", 200],
    ["缶コーヒー 微糖 1本", 60]
  ];

  function info() {
    var p = ST.$("activity").value.split("|");
    return { mets: Number(p[0]), name: p[1] };
  }

  ST.live(function () {
    var w = ST.n(ST.$("weight"));
    var min = ST.n(ST.$("minutes"));
    var it = info();

    if (w <= 0 || min < 0) {
      ["kcalVal","metsVal","hourVal","netVal","riceVal","fatVal","exVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "体重と時間を入力してください。");
      return;
    }

    var h = min / 60;
    // 消費カロリー = METs × 時間 × 体重 × 1.05
    var kcal = it.mets * h * w * 1.05;
    var rest = 1.0 * h * w * 1.05;       // 同じ時間じっとしていた場合
    var net = kcal - rest;
    var ex = it.mets * h;                 // エクササイズ（METs・時）

    ST.set("kcalVal", ST.num(Math.round(kcal), 0) + " kcal");
    ST.set("metsVal", it.mets + " METs");
    ST.set("hourVal", ST.num(Math.round(it.mets * w * 1.05), 0) + " kcal");
    ST.set("netVal", ST.num(Math.round(net), 0) + " kcal");
    ST.set("riceVal", ST.num(kcal / 234, 2) + " 杯分");
    ST.set("fatVal", ST.num(kcal / 7.2, 0) + " g");
    ST.set("exVal", ST.num(ex, 2) + " エクササイズ");
    ST.set("detail", "計算式: " + it.mets + " METs × " + ST.num(h, 2) + "時間 × " +
      ST.num(w, 1) + "kg × 1.05 = " + ST.num(Math.round(kcal), 0) + "kcal（" + it.name + "）。");

    // 食品ごとの必要時間
    var perMin = it.mets * w * 1.05 / 60;
    var tbody = ST.$("foodTable");
    tbody.innerHTML = FOODS.map(function (f) {
      var need = f[1] / perMin;
      var text = need >= 60
        ? Math.floor(need / 60) + "時間" + Math.round(need % 60) + "分"
        : Math.round(need) + "分";
      return "<tr><td>" + f[0] + "</td><td>" + f[1] + " kcal</td><td>" + text + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
体重・時間・運動の種類を選ぶと、消費カロリーが計算されます。厚生労働省の運動基準で使われている **METs（メッツ）** という強度の指標をもとにした計算です。
`,

  guide: `
## 消費カロリーの計算式

> **消費カロリー(kcal) = METs × 時間(h) × 体重(kg) × 1.05**

**METs（メッツ）** は、その運動が安静時の何倍のエネルギーを使うかを表す数値です。じっと座っている状態が1METsで、普通に歩くと3.5METs、つまり安静時の3.5倍のエネルギーを消費します。

最後に掛ける1.05は、酸素消費量をカロリーに換算するための係数です。

体重60kgの人が30分歩いた場合は、次のようになります。

- 3.5 × 0.5時間 × 60kg × 1.05 = **110kcal**

## 主な運動のMETs

| 運動 | METs |
|---|---|
| 静かに座る | 1.0 |
| デスクワーク | 1.3 |
| 料理・皿洗い | 2.0 |
| ヨガ | 2.5 |
| ゆっくり歩く | 2.8 |
| 掃除機をかける | 3.3 |
| 普通に歩く（4km/h） | 3.5 |
| 筋トレ（中程度） | 3.5 |
| 自転車（通勤） | 4.0 |
| 速歩 | 5.0 |
| 卓球 | 6.0 |
| バドミントン | 6.5 |
| ジョギング | 7.0 |
| なわとび（ゆっくり） | 8.0 |
| ランニング（10km/h） | 9.8 |
| なわとび（速い） | 12.3 |

## 「安静時より多い分」を見る意味

このツールには2つの数字が出ます。

- **消費カロリー**: その運動で使った総エネルギー
- **安静時より多い分**: 何もしなかった場合との差

30分歩いた場合、総消費は110kcalですが、そのうち約31kcalは「じっとしていても消費していた分」です。運動によって**増えた**消費は約79kcalということになります。

ダイエットの計算をするときは、後者のほうが実態に近い数字です。ただし1日の必要カロリー（基礎代謝を含む）から考える場合は、二重に引かないよう注意してください。

## 体脂肪1kgを減らすには

体脂肪1kgを減らすには、およそ **7,200kcal** の消費が必要とされています。脂肪組織1gあたり約9kcalですが、脂肪細胞には水分なども含まれるため、実質的に約7.2kcal/gで計算します。

体重60kgの人が普通に歩く（3.5METs）だけで7,200kcalを消費しようとすると、

> 7,200 ÷ 220kcal/時 = **約33時間**

毎日30分歩いても、2か月以上かかる計算です。運動だけで体重を落とすのが難しいと言われるのはこのためで、食事の見直しと組み合わせるほうが現実的です。

一方で、運動には体重を減らす以外の効果があります。筋肉量の維持、血糖値の改善、心肺機能の向上、睡眠の質の改善などは、消費カロリーの数字には表れません。

## 厚生労働省が示す運動の目安

「健康づくりのための身体活動基準」では、**エクササイズ（METs・時）** という単位で目標が示されています。これはMETsに時間を掛けた値です。

- 18〜64歳: 週23エクササイズ（うち4エクササイズは息が弾む程度の運動）
- 65歳以上: 週10エクササイズ（強度は問わない）

週23エクササイズは、普通に歩く（3.5METs）だけなら **週に約6.5時間、1日1時間弱** にあたります。通勤や家事も含めた合計で考えてよいため、意識して階段を使う、一駅歩くといった積み重ねでも到達できます。

## 表示される数値の限界

このツールの計算は、体重と運動強度だけを使った標準的な推定です。実際の消費カロリーは次の要因で変わります。

- **筋肉量**: 筋肉が多いほど同じ運動でも消費が増えます
- **体力レベル**: 慣れた運動ほど効率がよくなり、消費は減ります
- **気温**: 寒暖差が大きい環境では体温維持にエネルギーを使います
- **年齢・性別**: 基礎代謝の差が影響します

同じ運動でも個人差は1〜2割あると考えてください。

> 体重管理や運動の計画について具体的な判断が必要な場合は、医師や専門家にご相談ください。このツールの数値は一般的な計算式による目安です。
`,

  faq: [
    {
      q: "METs（メッツ）とは何ですか？",
      a: "運動の強度を表す指標で、安静時の何倍のエネルギーを使うかを示します。じっと座っているのが1METs、普通に歩くのが3.5METs、ランニングが約10METsです。厚生労働省の運動基準でも使われています。",
    },
    {
      q: "ウォーキング30分で何キロカロリー消費しますか？",
      a: "体重60kgの人が普通の速さ（4km/h、3.5METs）で30分歩くと約110kcalです。速歩（5.0METs）なら約158kcalになります。体重が重いほど消費カロリーは増えます。",
    },
    {
      q: "体脂肪を1kg減らすには何キロカロリー必要ですか？",
      a: "約7,200kcalです。ウォーキングだけで消費しようとすると30時間以上かかるため、食事の見直しと組み合わせるのが現実的です。",
    },
    {
      q: "運動しても体重が減らないのはなぜですか？",
      a: "運動の消費カロリーは想像より小さいためです。30分のウォーキングはおにぎり1個より少ない消費量です。また、運動後に食事量が増えると差し引きゼロになります。ただし筋肉量の維持や血糖値の改善など、体重以外の効果はあります。",
    },
    {
      q: "計算結果はどれくらい正確ですか？",
      a: "標準的な推定値で、個人差は1〜2割あります。筋肉量、体力レベル、気温、年齢によって実際の消費量は変わります。傾向をつかむ目安としてお使いください。",
    },
  ],
};
