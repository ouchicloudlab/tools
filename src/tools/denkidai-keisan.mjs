export default {
  category: "money",
  updated: "2026-08-23",
  title: "電気代計算ツール｜消費電力(W)と使用時間から1日・1か月の料金を出す",
  h1: "電気代計算ツール",
  description:
    "家電の消費電力（W）と1日の使用時間を入れると、1日・1か月・1年の電気代を計算します。エアコンやパソコンなど代表的な家電のプリセットつき。待機電力の試算にも使える無料ツールです。",
  cardText: "W数と使用時間から1日・1か月・1年の電気代を試算。",
  keywords: [
    "電気代", "計算", "消費電力", "W", "ワット", "kWh", "電気料金", "待機電力", "節電", "エアコン",
  ],
  related: ["percent-keisan"],

  ui: `
<div class="field">
  <label for="preset">家電を選ぶ（消費電力の目安が入ります）</label>
  <select id="preset">
    <option value="">自分で入力する</option>
    <option value="1000">エアコン 冷房・6畳（約1000W）</option>
    <option value="1300">エアコン 暖房・6畳（約1300W）</option>
    <option value="150">冷蔵庫・400L級（平均 約150W）</option>
    <option value="600">こたつ・強（約600W）</option>
    <option value="800">電気ストーブ（約800W）</option>
    <option value="1200">ドライヤー（約1200W）</option>
    <option value="1300">電子レンジ（約1300W）</option>
    <option value="700">炊飯器・炊飯中（約700W）</option>
    <option value="500">洗濯乾燥機・乾燥（約500W）</option>
    <option value="150">デスクトップPC（約150W）</option>
    <option value="30">ノートPC（約30W）</option>
    <option value="15">ミニPC・自宅サーバー（約15W）</option>
    <option value="100">液晶テレビ・50型（約100W）</option>
    <option value="40">照明・LEDシーリング8畳（約40W）</option>
    <option value="20">扇風機（約20W）</option>
    <option value="5">Wi-Fiルーター（約5W）</option>
  </select>
</div>

<div class="row">
  <div class="field">
    <label for="watt">消費電力（W）</label>
    <input type="number" id="watt" inputmode="decimal" value="1000">
  </div>
  <div class="field">
    <label for="hours">1日の使用時間（時間）</label>
    <input type="number" id="hours" inputmode="decimal" value="8" step="0.5">
  </div>
  <div class="field">
    <label for="price">電気料金単価（円/kWh）</label>
    <input type="number" id="price" inputmode="decimal" value="31">
    <p class="hint">全国平均の目安は31円前後です。</p>
  </div>
</div>

<div class="field">
  <span class="field-label">1か月の使用日数</span>
  <div class="pills" id="days">
    <label><input type="radio" name="days" value="30" checked>毎日（30日）</label>
    <label><input type="radio" name="days" value="20">平日のみ（20日）</label>
    <label><input type="radio" name="days" value="8">週末のみ（8日）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">1か月の電気代</div>
  <div class="result-main" id="monthVal">7,440円</div>
  <div class="result-grid">
    <div><div class="k">1時間あたり</div><div class="v" id="hourVal">31円</div></div>
    <div><div class="k">1日あたり</div><div class="v" id="dayVal">248円</div></div>
    <div><div class="k">1年あたり</div><div class="v" id="yearVal">89,280円</div></div>
    <div><div class="k">1か月の電力量</div><div class="v" id="kwhVal">240kWh</div></div>
  </div>
  <p class="result-sub" id="formula"></p>
</div>
`,

  script: `
(function () {
  var preset = ST.$("preset");
  if (preset) {
    preset.addEventListener("change", function () {
      if (preset.value) ST.$("watt").value = preset.value;
    });
  }

  ST.live(function () {
    var w = ST.n(ST.$("watt"));
    var h = ST.n(ST.$("hours"));
    var p = ST.n(ST.$("price"));
    var days = Number(ST.pick("days")) || 30;

    var kwhPerHour = w / 1000;
    var perHour = ST.fix(kwhPerHour * p);
    var perDay = ST.fix(perHour * h);
    var perMonth = ST.fix(perDay * days);
    var perYear = ST.fix(perDay * days * 12);
    var kwhMonth = ST.fix(kwhPerHour * h * days);

    ST.set("hourVal", ST.yen(Math.round(perHour * 100) / 100));
    ST.set("dayVal", ST.yen(Math.round(perDay)));
    ST.set("monthVal", ST.yen(Math.round(perMonth)));
    ST.set("yearVal", ST.yen(Math.round(perYear)));
    ST.set("kwhVal", ST.num(kwhMonth, 1) + "kWh");
    ST.set("formula",
      "計算式: " + ST.num(w, 0) + "W ÷ 1000 × " + ST.num(h, 1) + "時間 × " +
      days + "日 = " + ST.num(kwhMonth, 1) + "kWh、× " + ST.num(p, 2) + "円 = " +
      ST.yen(Math.round(perMonth)));
  });
})();
`,

  intro: `
消費電力（W）と1日の使用時間を入れると、1日・1か月・1年の電気代が出ます。家電のプリセットを選べば、おおよそのW数が自動で入ります。
`,

  guide: `
## 電気代の計算式

電気代は、次の1本の式だけで求まります。

> **電気代 = 消費電力(W) ÷ 1000 × 使用時間(h) × 電気料金単価(円/kWh)**

W（ワット）を1000で割っているのは、電気の使用量が **kWh（キロワットアワー）** という単位で請求されるためです。1000Wの家電を1時間使うと、ちょうど1kWhになります。

たとえば消費電力1,000Wのエアコンを1日8時間、30日間使った場合は次のようになります。

- 1,000 ÷ 1000 = 1kW
- 1kW × 8時間 × 30日 = 240kWh
- 240kWh × 31円 = **7,440円**

## 電気料金単価はいくらで計算すればいい？

このツールの初期値は31円/kWhです。目安として使われることの多い水準ですが、実際の単価は契約している電力会社・プラン・使用量によって変わります。

正確に知りたい場合は、検針票（電気ご使用量のお知らせ）を見て、次の割り算をしてください。

> **請求額 ÷ 使用電力量(kWh) = 実質の単価**

この方法で出した単価には、基本料金・燃料費調整額・再エネ賦課金がすべて含まれるため、実感に近い数字になります。多くの家庭では28〜35円程度に収まります。

なお、多くのプランは使うほど単価が上がる **三段階料金** になっています。「あと1時間使ったらいくら増えるか」を知りたい場合は、いちばん高い段階の単価を使うほうが実態に合います。

## W数はどこを見ればいい？

家電の消費電力は、本体の背面や底面にある銘板シール、または取扱説明書の仕様欄に書かれています。表記が「1.2kW」なら1,200Wのことです。

ただし注意点があります。

- **エアコンや冷蔵庫は、常に定格のW数を使っているわけではありません。** 室温が設定温度に近づくと出力を落とすため、実際の平均消費電力はカタログの定格より小さくなります。カタログの「期間消費電力量(kWh/年)」があれば、そちらのほうが正確です。
- **ドライヤーや電子レンジは短時間しか使いません。** 1,200Wと大きくても、1日10分なら1か月の電気代は約190円です。W数の大きさより、**W数×時間** で考えるのが大切です。

## 待機電力は気にするべきか

コンセントに挿しっぱなしの家電が消費する待機電力は、1台あたり0.5〜3W程度です。3Wの機器を1年間放置した場合の電気代は次のとおりです。

- 3 ÷ 1000 × 24時間 × 365日 × 31円 = **約815円**

1台では大きな額になりませんが、家庭全体の待機電力は消費電力量の5%前後を占めるとされています。使っていない機器が10台あれば、年間数千円の差になります。

一方で、テレビやレコーダーは主電源を切ると番組表の取得ができなくなるなど、実用上の不便が出る場合もあります。長期間使わない機器だけを抜く、という運用が現実的です。

## 24時間つけっぱなしの機器の年間コスト

自宅サーバーやNAS、ルーターのように常時稼働させる機器は、W数の差がそのまま年間コストの差になります（31円/kWhで計算）。

| 消費電力 | 1か月 | 1年 |
|---|---|---|
| 5W | 約112円 | 約1,358円 |
| 10W | 約223円 | 約2,716円 |
| 20W | 約446円 | 約5,431円 |
| 50W | 約1,116円 | 約13,578円 |
| 100W | 約2,232円 | 約27,156円 |

消費電力が10W違うと、年間で約2,700円の差になります。常時稼働させる機器を選ぶときは、本体価格だけでなく、この差を数年分まとめて比べると判断しやすくなります。
`,

  faq: [
    {
      q: "電気料金単価は何円で計算すればいいですか？",
      a: "分からない場合は31円/kWh前後が目安です。正確に知りたい場合は、検針票の請求額を使用電力量(kWh)で割ってください。基本料金や再エネ賦課金を含んだ実質単価が求められます。",
    },
    {
      q: "エアコンの電気代がカタログの計算と合いません。",
      a: "エアコンは室温に応じて出力を変えるため、常に定格の消費電力を使っているわけではありません。設定温度に達した後は消費電力が大きく下がります。カタログに「期間消費電力量(kWh/年)」があれば、そちらのほうが実態に近い数字です。",
    },
    {
      q: "1kWhとはどれくらいの量ですか？",
      a: "1,000Wの家電を1時間使ったときの電力量です。100Wの照明なら10時間、10Wの機器なら100時間で1kWhになります。",
    },
    {
      q: "待機電力を減らすと、どれくらい節約できますか？",
      a: "3Wの待機電力を1年間放置すると約815円です。家庭全体では消費電力量の5%程度を占めるとされ、使っていない機器をまとめて抜けば年間数千円の差になります。",
    },
    {
      q: "アンペア数を下げると電気代は安くなりますか？",
      a: "契約アンペアを下げると基本料金が下がるため、月々の固定費は減ります。ただし使用量に応じた従量料金は変わりません。同時に使える電力量も減るため、ブレーカーが落ちやすくなる点に注意が必要です。",
    },
  ],
};
