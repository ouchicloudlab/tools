export default {
  category: "unit",
  updated: "2026-08-27",
  title: "大さじ・小さじの重さ換算ツール｜調味料別のグラム数がわかる",
  h1: "大さじ・小さじ・カップの換算ツール",
  description:
    "大さじ1が何グラムかは調味料によって違います。醤油・砂糖・塩・小麦粉など30種類の重さを、大さじ・小さじ・カップ・mlから相互に換算できる無料ツールです。",
  cardText: "大さじ1は何g？調味料30種の重さを換算。",
  keywords: [
    "大さじ", "小さじ", "グラム", "換算", "計量", "カップ", "ml", "調味料", "レシピ", "何g",
  ],
  yomi: "おおさじ こさじ けいりょう",
  related: ["inch-cm", "tsubo-heibei"],

  ui: `
<div class="field">
  <label for="item">調味料・食材</label>
  <select id="item">
    <optgroup label="液体の調味料">
      <option value="15|水・酒・酢・だし汁">水・酒・酢・だし汁</option>
      <option value="18|醤油" selected>醤油</option>
      <option value="18|みりん">みりん</option>
      <option value="12|サラダ油・オリーブオイル">サラダ油・オリーブオイル</option>
      <option value="15|牛乳">牛乳</option>
      <option value="16|生クリーム">生クリーム</option>
      <option value="21|はちみつ">はちみつ</option>
      <option value="21|水あめ">水あめ</option>
      <option value="15|めんつゆ（3倍濃縮）">めんつゆ（3倍濃縮）</option>
      <option value="15|ケチャップ">ケチャップ</option>
      <option value="15|ウスターソース">ウスターソース</option>
      <option value="18|中濃ソース">中濃ソース</option>
      <option value="12|マヨネーズ">マヨネーズ</option>
      <option value="18|味噌">味噌</option>
      <option value="15|トマトピューレ">トマトピューレ</option>
    </optgroup>
    <optgroup label="粉類・粒状">
      <option value="18|塩（精製塩・食塩）">塩（精製塩・食塩）</option>
      <option value="15|塩（あら塩・粗塩）">塩（あら塩・粗塩）</option>
      <option value="9|砂糖（上白糖）">砂糖（上白糖）</option>
      <option value="12|砂糖（グラニュー糖）">砂糖（グラニュー糖）</option>
      <option value="9|小麦粉（薄力粉）">小麦粉（薄力粉）</option>
      <option value="9|小麦粉（強力粉）">小麦粉（強力粉）</option>
      <option value="9|片栗粉">片栗粉</option>
      <option value="6|パン粉（生）">パン粉（生）</option>
      <option value="6|ベーキングパウダー">ベーキングパウダー</option>
      <option value="6|ココアパウダー">ココアパウダー</option>
      <option value="6|粉チーズ">粉チーズ</option>
      <option value="6|カレー粉">カレー粉</option>
      <option value="9|すりごま">すりごま</option>
      <option value="9|いりごま">いりごま</option>
      <option value="12|バター">バター</option>
      <option value="9|コーンスターチ">コーンスターチ</option>
      <option value="6|抹茶">抹茶</option>
      <option value="9|きな粉">きな粉</option>
    </optgroup>
  </select>
  <p class="hint">値は大さじ1あたりのグラム数（一般的な計量値）です。</p>
</div>

<div class="row">
  <div class="field">
    <label for="osaji">大さじ</label>
    <input type="number" id="osaji" inputmode="decimal" value="1" step="0.5">
  </div>
  <div class="field">
    <label for="kosaji">小さじ</label>
    <input type="number" id="kosaji" inputmode="decimal" value="3" step="0.5">
  </div>
  <div class="field">
    <label for="cup">カップ</label>
    <input type="number" id="cup" inputmode="decimal" value="0.075" step="0.25">
  </div>
</div>
<div class="row">
  <div class="field">
    <label for="ml">ミリリットル（ml・cc）</label>
    <input type="number" id="ml" inputmode="decimal" value="15" step="1">
  </div>
  <div class="field">
    <label for="gram">グラム（g）</label>
    <input type="number" id="gram" inputmode="decimal" value="18" step="1">
  </div>
</div>
<p class="hint">どの欄に入力しても、ほかがすべて計算されます。</p>

<div class="result" aria-live="polite">
  <div class="result-label" id="itemLabel">醤油</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">大さじ</div><div class="v" id="rOsaji">-</div></div>
    <div><div class="k">小さじ</div><div class="v" id="rKosaji">-</div></div>
    <div><div class="k">カップ</div><div class="v" id="rCup">-</div></div>
    <div><div class="k">ml（cc）</div><div class="v" id="rMl">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  var OSAJI_ML = 15, KOSAJI_ML = 5, CUP_ML = 200;
  var lock = false;

  function info() {
    var parts = ST.$("item").value.split("|");
    return { gPerOsaji: Number(parts[0]), name: parts[1] };
  }

  function render(ml, from) {
    var it = info();
    var gPerMl = it.gPerOsaji / OSAJI_ML;
    var gram = ml * gPerMl;

    lock = true;
    if (from !== "osaji") ST.$("osaji").value = Math.round(ml / OSAJI_ML * 1000) / 1000;
    if (from !== "kosaji") ST.$("kosaji").value = Math.round(ml / KOSAJI_ML * 1000) / 1000;
    if (from !== "cup") ST.$("cup").value = Math.round(ml / CUP_ML * 1000) / 1000;
    if (from !== "ml") ST.$("ml").value = Math.round(ml * 100) / 100;
    if (from !== "gram") ST.$("gram").value = Math.round(gram * 100) / 100;
    lock = false;

    ST.$("itemLabel").textContent = it.name;
    ST.set("mainVal", ST.num(gram, 1) + " g");
    ST.set("rOsaji", ST.num(ml / OSAJI_ML, 2) + " 杯");
    ST.set("rKosaji", ST.num(ml / KOSAJI_ML, 2) + " 杯");
    ST.set("rCup", ST.num(ml / CUP_ML, 3) + " 杯");
    ST.set("rMl", ST.num(ml, 1) + " ml");
    ST.set("detail", it.name + "は大さじ1（15ml）で " + it.gPerOsaji +
      "g、小さじ1（5ml）で " + ST.num(it.gPerOsaji / 3, 1) +
      "g、カップ1（200ml）で " + ST.num(it.gPerOsaji / 15 * 200, 0) + "g です。");
  }

  var FIELDS = [
    ["osaji", OSAJI_ML], ["kosaji", KOSAJI_ML], ["cup", CUP_ML], ["ml", 1]
  ];
  FIELDS.forEach(function (pair) {
    ST.$(pair[0]).addEventListener("input", function () {
      if (lock) return;
      render(ST.n(ST.$(pair[0])) * pair[1], pair[0]);
    });
  });
  ST.$("gram").addEventListener("input", function () {
    if (lock) return;
    var it = info();
    render(ST.n(ST.$("gram")) / (it.gPerOsaji / OSAJI_ML), "gram");
  });
  ST.$("item").addEventListener("change", function () {
    render(ST.n(ST.$("ml")), "ml");
  });

  render(OSAJI_ML, "osaji");
})();
`,

  intro: `
「大さじ1は何グラム？」の答えは調味料によって変わります。醤油なら18g、砂糖なら9gで、倍の差があります。調味料を選ぶと、大さじ・小さじ・カップ・ml・gがすべて同時に換算されます。
`,

  guide: `
## 計量スプーンの基本

| 名称 | 容量 |
|---|---|
| 大さじ1 | 15ml |
| 小さじ1 | 5ml |
| 大さじ1/2 | 7.5ml |
| 小さじ1/2 | 2.5ml |
| 計量カップ1 | 200ml |
| 米1合 | 180ml |

**大さじ1 = 小さじ3** です。小さじが3杯で大さじ1杯になります。

注意点として、日本の計量カップは200mlですが、**アメリカのレシピでは1カップ = 約240ml** です。海外のレシピを使うときは、この差でおよそ2割変わります。また、炊飯器の付属カップは1合（180ml）で、計量カップとは別物です。

## 大さじ1のグラム数（主な調味料）

同じ大さじ1杯でも、重さは調味料によって大きく変わります。

| 調味料 | 大さじ1 | 小さじ1 | カップ1 |
|---|---|---|---|
| 水・酒・酢 | 15g | 5g | 200g |
| 醤油 | 18g | 6g | 230g |
| みりん | 18g | 6g | 230g |
| 味噌 | 18g | 6g | 230g |
| 塩（精製塩） | 18g | 6g | 240g |
| 塩（あら塩） | 15g | 5g | 180g |
| 砂糖（上白糖） | 9g | 3g | 130g |
| 砂糖（グラニュー糖） | 12g | 4g | 180g |
| 小麦粉（薄力粉） | 9g | 3g | 110g |
| 片栗粉 | 9g | 3g | 130g |
| サラダ油 | 12g | 4g | 180g |
| バター | 12g | 4g | 180g |
| マヨネーズ | 12g | 4g | 190g |
| はちみつ | 21g | 7g | 280g |
| 生クリーム | 16g | 5g | 210g |
| パン粉（生） | 6g | 2g | 40g |

**塩と砂糖は倍の差** があります（18g対9g）。レシピを「塩大さじ1」から「砂糖大さじ1」に読み違えると、量が2倍ずれることになります。

## なぜ調味料ごとに違うのか

計量スプーンが測っているのは **体積（ml）** であって、重さではないからです。同じ体積でも、密度が違えば重さは変わります。

- **はちみつ（21g）**: 水より重い。糖分が濃く密度が高いため
- **醤油・塩（18g）**: 水より少し重い。塩分が溶けているぶん密度が上がる
- **油（12g）**: 水より軽い。だから水に浮く
- **小麦粉・砂糖（9g）**: 粉の粒の間に空気が入るため、見た目の体積のわりに軽い
- **パン粉（6g）**: 空気の割合がさらに多い

つまり「大さじ1 = 15g」と一律で覚えるのは水系の液体だけで通用する近似です。

## 正しい量り方

粉類は、量り方によって1〜2割変わります。

1. スプーンで**山盛りにすくう**
2. ヘラや箸の背で**すり切る**（押し固めない）

小麦粉を押し固めてしまうと、同じ大さじ1でも1.5倍近く入ってしまいます。逆に、ふるった直後の小麦粉は空気を含んでいて軽くなります。お菓子作りのように分量がシビアなレシピでは、**スプーンではなくキッチンスケールで量る** ほうが確実です。

液体の場合は、スプーンの縁ぎりぎりまで入れた状態が「1杯」です。表面張力で少し盛り上がるくらいが正しく、これを避けて8分目にすると2割ほど少なくなります。

## 「少々」「ひとつまみ」「適量」

レシピでよく出る曖昧な表現には、一応の目安があります。

| 表現 | 量 | 量り方 |
|---|---|---|
| 少々 | 約0.5g（小さじ1/8） | 親指と人差し指の2本でつまむ |
| ひとつまみ | 約1g（小さじ1/5） | 親指・人差し指・中指の3本でつまむ |
| 適量 | ちょうどよい量 | 味を見ながら加減する |
| 適宜 | 好みで入れなくてもよい | 省略可 |

「適量」と「適宜」は似ていますが、**適量は必要（量は自分で判断）、適宜は入れなくてもよい** という違いがあります。

## 計量器具がないときの代用

- **ペットボトルのキャップ**: 満杯で約7.5ml（大さじ1/2）
- **カレースプーン**: 約15ml（大さじ1に近い）
- **ティースプーン**: 約5ml（小さじ1に近い）
- **紙コップ**: 一般的なもので約200ml（カップ1）

ただしいずれも製品によって差があるため、正確さが必要な場面では計量器具を使ってください。
`,

  faq: [
    {
      q: "大さじ1は何グラムですか？",
      a: "調味料によって変わります。水・酒・酢は15g、醤油・みりん・味噌・塩は18g、砂糖（上白糖）・小麦粉は9g、油とバターは12g、はちみつは21gです。計量スプーンは体積を測る道具なので、密度の違いがそのまま重さの差になります。",
    },
    {
      q: "大さじ1は小さじ何杯ですか？",
      a: "小さじ3杯です。大さじ1が15ml、小さじ1が5mlなので、ちょうど3倍になります。",
    },
    {
      q: "塩と砂糖で大さじ1のグラム数が違うのはなぜですか？",
      a: "密度が違うためです。塩は粒が細かく詰まるため18g、砂糖（上白糖）は粒の間に空気が入るため9gと、倍の差になります。同じ「大さじ1」でも重さは全く違います。",
    },
    {
      q: "アメリカのレシピの1カップは200mlですか？",
      a: "違います。アメリカの1カップは約240mlで、日本の200mlより2割多くなります。海外のレシピを使うときは換算が必要です。",
    },
    {
      q: "計量スプーンがないときはどうすればいいですか？",
      a: "ペットボトルのキャップが満杯で約7.5ml（大さじ1/2）、カレースプーンが約15ml、ティースプーンが約5mlです。ただし製品差があるため、お菓子作りなど分量が重要な料理ではキッチンスケールをおすすめします。",
    },
  ],
};
