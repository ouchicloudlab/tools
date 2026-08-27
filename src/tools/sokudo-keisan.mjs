export default {
  category: "unit",
  updated: "2026-08-27",
  title: "速さ・距離・時間の計算ツール｜時速と分速の変換もできる",
  h1: "速さ・距離・時間の計算ツール",
  description:
    "3つのうち2つを入れると残りが求まります。時速・分速・秒速の相互変換、徒歩何分の計算、ペース（1kmあたり何分）の算出にも対応した無料ツールです。",
  cardText: "速さ・距離・時間の相互計算とペース換算。",
  keywords: [
    "速さ", "距離", "時間", "計算", "時速", "分速", "秒速", "徒歩", "ペース", "km/h",
  ],
  yomi: "そくど きょり じかん じそく",
  related: ["inch-cm", "gasoline-dai"],

  ui: `
<div class="field">
  <span class="field-label">何を求めますか</span>
  <div class="pills" id="target">
    <label><input type="radio" name="target" value="time" checked>時間</label>
    <label><input type="radio" name="target" value="distance">距離</label>
    <label><input type="radio" name="target" value="speed">速さ</label>
  </div>
</div>

<div class="row">
  <div class="field" id="fSpeed">
    <label for="speed">速さ</label>
    <input type="number" id="speed" inputmode="decimal" value="4" step="0.1">
    <select id="speedUnit" style="margin-top:6px">
      <option value="3.6" selected>km/h（時速）</option>
      <option value="0.06">m/min（分速メートル）</option>
      <option value="1">m/s（秒速メートル）</option>
      <option value="0.06|km">km/min（分速キロ）</option>
      <option value="5.79364">ノット（kt）</option>
      <option value="2.23694">mph（マイル毎時）</option>
    </select>
  </div>
  <div class="field" id="fDistance">
    <label for="distance">距離</label>
    <input type="number" id="distance" inputmode="decimal" value="2" step="0.1">
    <select id="distUnit" style="margin-top:6px">
      <option value="1000" selected>km</option>
      <option value="1">m</option>
      <option value="1609.344">マイル</option>
    </select>
  </div>
  <div class="field" id="fTime">
    <label for="time">時間</label>
    <input type="number" id="time" inputmode="decimal" value="30" step="1">
    <select id="timeUnit" style="margin-top:6px">
      <option value="60" selected>分</option>
      <option value="3600">時間</option>
      <option value="1">秒</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">かかる時間</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">時速</div><div class="v" id="kmhVal">-</div></div>
    <div><div class="k">分速</div><div class="v" id="mminVal">-</div></div>
    <div><div class="k">秒速</div><div class="v" id="msVal">-</div></div>
    <div><div class="k">距離</div><div class="v" id="distVal">-</div></div>
    <div><div class="k">所要時間</div><div class="v" id="timeVal">-</div></div>
    <div><div class="k">1kmあたりのペース</div><div class="v" id="paceVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  // 速さの単位はすべて m/s に正規化する。
  // 値は「m/s に直すときの割る数」＝ 表示単位 ÷ (m/s)
  function speedFactor() {
    var v = ST.$("speedUnit").value;
    return Number(v.split("|")[0]);
  }
  function speedIsKmPerMin() {
    return ST.$("speedUnit").value.indexOf("|km") > 0;
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return "-";
    if (sec < 60) return ST.num(sec, 1) + "秒";
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = Math.round(sec % 60);
    if (h > 0) return h + "時間" + m + "分" + s + "秒";
    return m + "分" + s + "秒";
  }

  function clear(msg) {
    ["mainVal","kmhVal","mminVal","msVal","distVal","timeVal","paceVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  ST.live(function () {
    var t = ST.pick("target");
    ST.$("fSpeed").style.opacity = t === "speed" ? "0.55" : "1";
    ST.$("fDistance").style.opacity = t === "distance" ? "0.55" : "1";
    ST.$("fTime").style.opacity = t === "time" ? "0.55" : "1";
    ST.$("speed").disabled = t === "speed";
    ST.$("distance").disabled = t === "distance";
    ST.$("time").disabled = t === "time";

    // 入力値を SI（m, s, m/s）に直す
    var sp = ST.n(ST.$("speed"));
    var mps = speedIsKmPerMin() ? sp * 1000 / 60 : sp / speedFactor();
    var meters = ST.n(ST.$("distance")) * Number(ST.$("distUnit").value);
    var seconds = ST.n(ST.$("time")) * Number(ST.$("timeUnit").value);

    if (t === "time") {
      if (mps <= 0 || meters <= 0) return clear("速さと距離に0より大きい値を入力してください。");
      seconds = meters / mps;
      ST.$("mainLabel").textContent = "かかる時間";
      ST.set("mainVal", fmtTime(seconds));
    } else if (t === "distance") {
      if (mps <= 0 || seconds <= 0) return clear("速さと時間に0より大きい値を入力してください。");
      meters = mps * seconds;
      ST.$("mainLabel").textContent = "進む距離";
      ST.set("mainVal", meters >= 1000
        ? ST.num(meters / 1000, 3) + " km"
        : ST.num(meters, 1) + " m");
    } else {
      if (meters <= 0 || seconds <= 0) return clear("距離と時間に0より大きい値を入力してください。");
      mps = meters / seconds;
      ST.$("mainLabel").textContent = "必要な速さ";
      ST.set("mainVal", ST.num(mps * 3.6, 2) + " km/h");
    }

    ST.set("kmhVal", ST.num(mps * 3.6, 2) + " km/h");
    ST.set("mminVal", ST.num(mps * 60, 1) + " m/分");
    ST.set("msVal", ST.num(mps, 2) + " m/秒");
    ST.set("distVal", meters >= 1000 ? ST.num(meters / 1000, 3) + " km" : ST.num(meters, 1) + " m");
    ST.set("timeVal", fmtTime(seconds));
    ST.set("paceVal", mps > 0 ? fmtTime(1000 / mps) + " /km" : "-");
    ST.set("detail", "速さ = 距離 ÷ 時間、距離 = 速さ × 時間、時間 = 距離 ÷ 速さ。" +
      "不動産広告の「徒歩1分」は80mとして計算されます。");
  });
})();
`,

  intro: `
速さ・距離・時間のうち2つを入れると、残りの1つが求まります。時速・分速・秒速の換算と、1kmあたりのペースも同時に表示します。
`,

  guide: `
## 3つの関係

> **速さ = 距離 ÷ 時間**
> **距離 = 速さ × 時間**
> **時間 = 距離 ÷ 速さ**

「みはじ」「はじき」の図で覚えた方も多い関係です。単位を揃えることだけ注意すれば、あとは掛け算と割り算だけで求まります。

**時速4kmで2km歩く**なら、2 ÷ 4 = 0.5時間 = 30分です。

## 単位の換算

| 変換 | 計算 |
|---|---|
| km/h → m/s | ÷ 3.6 |
| m/s → km/h | × 3.6 |
| km/h → m/分 | × 1000 ÷ 60（= × 16.67） |
| ノット → km/h | × 1.852 |
| mph → km/h | × 1.609 |

**3.6で割る**という数字は、1km = 1000m、1時間 = 3600秒 の比（3600 ÷ 1000）から来ています。時速36kmは秒速10m、時速72kmは秒速20mです。

## 不動産広告の「徒歩◯分」

不動産の表示で使われる徒歩時間には、業界共通のルールがあります。

> **道路距離80mにつき1分**（端数は切り上げ）

これは時速4.8kmに相当し、**成人女性がハイヒールで歩く速度** を基準に定められたものです（不動産の表示に関する公正競争規約）。

注意点として、この計算には次のものが含まれていません。

- 信号待ちの時間
- 踏切の待ち時間
- 坂道や階段による減速
- 駅の改札からホームまでの移動

「駅徒歩10分」の物件は直線距離ではなく道路に沿って800m以上あり、実際には12〜15分かかることも珍しくありません。内見のときは実際に歩いてみるのが確実です。

## 歩く・走る速さの目安

| 移動手段 | 速さ | 1kmあたり |
|---|---|---|
| ゆっくり歩く | 3 km/h | 20分 |
| 普通に歩く | 4 km/h | 15分 |
| 不動産表示の基準 | 4.8 km/h | 12分30秒 |
| 早歩き | 6 km/h | 10分 |
| ゆっくりジョギング | 8 km/h | 7分30秒 |
| 市民ランナー | 10 km/h | 6分 |
| サブ4のペース（フルマラソン4時間） | 10.5 km/h | 5分41秒 |
| サブ3のペース（フルマラソン3時間） | 14.1 km/h | 4分16秒 |
| 自転車（ママチャリ） | 15 km/h | 4分 |
| 自転車（ロードバイク） | 25 km/h | 2分24秒 |

マラソンやランニングでは「1kmあたり何分何秒」で表す **ペース** が使われます。フルマラソン（42.195km）を4時間で完走するには、1kmを5分41秒で走り続ける必要があります。

## 車の速度と制動距離

時速が上がると、止まるまでに必要な距離は急激に伸びます。速度の2乗に比例するためです。

| 速度 | 空走距離 | 制動距離 | 停止距離 |
|---|---|---|---|
| 40 km/h | 11 m | 9 m | 約20 m |
| 60 km/h | 17 m | 20 m | 約37 m |
| 80 km/h | 22 m | 36 m | 約58 m |
| 100 km/h | 28 m | 56 m | 約84 m |

空走距離は、危険に気づいてからブレーキが効き始めるまでに進む距離です（反応時間を1秒として計算）。速度が2倍になると、制動距離は4倍になります。

高速道路の車間距離が「速度と同じ数字のメートル」（時速100kmなら100m）と言われるのは、この停止距離に余裕を持たせた目安です。

## 音と光の速さ

| | 速さ |
|---|---|
| 音（気温15℃の空気中） | 340 m/s = 1,224 km/h |
| 光 | 約30万 km/s |

雷が光ってから音が聞こえるまでの秒数に340を掛けると、落雷地点までのおおよその距離が分かります。3秒なら約1km、10秒なら約3.4kmです。5秒以内なら、次の落雷が自分の位置に届く可能性があるため、建物の中に避難してください。
`,

  faq: [
    {
      q: "時速から秒速に直すにはどうしますか？",
      a: "3.6で割ります。時速36kmなら秒速10mです。逆に秒速から時速にするときは3.6を掛けてください。1km=1000m、1時間=3600秒の比から来ている数字です。",
    },
    {
      q: "不動産の「徒歩10分」は何メートルですか？",
      a: "800mです。道路距離80mを1分として計算する業界ルールがあります。信号待ちや坂道は含まれないため、実際にはこれより時間がかかることが多くなります。",
    },
    {
      q: "フルマラソンを4時間で走るペースは？",
      a: "1kmあたり5分41秒（時速約10.5km）です。42.195kmを4時間（240分）で割った値になります。3時間で走る「サブ3」なら1kmあたり4分16秒です。",
    },
    {
      q: "時速が2倍になると止まるまでの距離も2倍ですか？",
      a: "いいえ、約4倍になります。制動距離は速度の2乗に比例するためです。時速40kmで9mだった制動距離は、時速80kmでは36mになります。",
    },
    {
      q: "雷までの距離はどう計算しますか？",
      a: "光ってから音が聞こえるまでの秒数に約340mを掛けます。3秒なら約1kmです。5秒（約1.7km）以内なら次の落雷が届く範囲なので、すぐに建物内へ避難してください。",
    },
  ],
};
