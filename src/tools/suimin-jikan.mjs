export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "睡眠時間の逆算ツール｜何時に寝ればすっきり起きられるか",
  h1: "睡眠時間の逆算ツール",
  description:
    "起きたい時刻から、何時に寝ればよいかを90分の睡眠サイクルで逆算します。今から寝る場合の起床時刻も計算できる無料ツールです。",
  cardText: "起床時刻から逆算した就寝時刻の候補を表示。",
  keywords: [
    "睡眠", "時間", "逆算", "何時に寝る", "睡眠サイクル", "90分", "起床", "レム睡眠", "目覚め",
  ],
  related: ["jikan-keisan", "hidzuke-keisan"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="sleep" checked>起きたい時刻から就寝時刻を逆算</label>
    <label><input type="radio" name="mode" value="wake">今から寝る場合の起床時刻</label>
  </div>
</div>

<div class="row">
  <div class="field" id="fWake">
    <label for="wakeTime">起きたい時刻</label>
    <input type="time" id="wakeTime" value="07:00">
  </div>
  <div class="field" id="fNow" hidden>
    <label for="nowTime">寝る時刻</label>
    <input type="time" id="nowTime">
  </div>
  <div class="field">
    <label for="fallAsleep">寝つくまでの時間（分）</label>
    <input type="number" id="fallAsleep" inputmode="numeric" value="15" step="5">
    <p class="hint">布団に入ってから眠りに落ちるまで。平均14分ほどです。</p>
  </div>
  <div class="field">
    <label for="cycle">1サイクルの長さ（分）</label>
    <input type="number" id="cycle" inputmode="numeric" value="90" step="5">
    <p class="hint">個人差があります。80〜110分の範囲で調整できます。</p>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">おすすめの就寝時刻</div>
  <div class="result-main" id="mainVal">-</div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>時刻の候補</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th id="colTime">時刻</th><th>睡眠サイクル</th><th>実際に眠る時間</th><th>目安</th></tr></thead>
    <tbody id="cycleTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  function toMin(v) {
    if (!v) return null;
    var p = v.split(":").map(Number);
    return p[0] * 60 + p[1];
  }
  function fmt(min) {
    min = ((min % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60);
    var m = Math.round(min % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  function dur(min) {
    var h = Math.floor(min / 60);
    var m = Math.round(min % 60);
    return h + "時間" + (m > 0 ? m + "分" : "");
  }
  function judge(cycles, minutes) {
    if (minutes < 240) return "短すぎます";
    if (minutes < 330) return "やや短め";
    if (minutes <= 540) return "おすすめ";
    return "長め";
  }

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("fWake").hidden = mode !== "sleep";
    ST.$("fNow").hidden = mode !== "wake";

    var fall = Math.max(0, ST.n(ST.$("fallAsleep")));
    var cycle = ST.n(ST.$("cycle"));
    if (cycle < 30) cycle = 90;

    var rows = [];
    var best = "";

    if (mode === "sleep") {
      var wake = toMin(ST.$("wakeTime").value);
      if (wake === null) {
        ST.set("mainVal", "-");
        ST.set("detail", "起きたい時刻を入力してください。");
        ST.$("cycleTable").innerHTML = "";
        return;
      }
      ST.$("colTime").textContent = "就寝時刻";
      // サイクル数の多い順（＝早く寝る順）に並べる
      for (var c = 6; c >= 3; c--) {
        var sleepMin = cycle * c;
        var bed = wake - sleepMin - fall;
        rows.push([fmt(bed), c + "回", dur(sleepMin), judge(c, sleepMin)]);
      }
      // 5サイクル（7.5時間）を推奨とする
      var rec = wake - cycle * 5 - fall;
      best = fmt(rec);
      ST.$("mainLabel").textContent = "おすすめの就寝時刻（5サイクル）";
      ST.set("mainVal", best);
      ST.set("detail",
        fmt(wake) + " に起きるなら、" + best + " に布団に入ると " +
        dur(cycle * 5) + " 眠れます（寝つくまで " + fall + "分を含む）。" +
        "浅い眠りのタイミングで目覚められるよう、" + cycle + "分の倍数で計算しています。");
    } else {
      var now = toMin(ST.$("nowTime").value);
      if (now === null) {
        ST.set("mainVal", "-");
        ST.set("detail", "寝る時刻を入力してください。");
        ST.$("cycleTable").innerHTML = "";
        return;
      }
      ST.$("colTime").textContent = "起床時刻";
      for (var c2 = 3; c2 <= 6; c2++) {
        var sleepMin2 = cycle * c2;
        var wake2 = now + fall + sleepMin2;
        rows.push([fmt(wake2), c2 + "回", dur(sleepMin2), judge(c2, sleepMin2)]);
      }
      var rec2 = now + fall + cycle * 5;
      best = fmt(rec2);
      ST.$("mainLabel").textContent = "おすすめの起床時刻（5サイクル）";
      ST.set("mainVal", best);
      ST.set("detail",
        fmt(now) + " に布団に入ると、" + best + " に起きれば " + dur(cycle * 5) +
        "の睡眠になります。");
    }

    ST.$("cycleTable").innerHTML = rows.map(function (r) {
      var mark = r[3] === "おすすめ" ? ' style="font-weight:700"' : "";
      return "<tr" + mark + "><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" +
        r[2] + "</td><td>" + r[3] + "</td></tr>";
    }).join("");
  });

  // 「今から寝る」の初期値を現在時刻にする
  var el = ST.$("nowTime");
  if (el && !el.value) {
    var d = new Date();
    el.value = String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0");
  }
})();
`,

  intro: `
起きたい時刻を入れると、何時に寝ればよいかを睡眠サイクル単位で逆算します。**寝つくまでの時間も差し引く**ので、実際に布団に入るべき時刻が分かります。
`,

  guide: `
## 睡眠サイクルとは

眠っている間、脳は **浅い眠り（レム睡眠）** と **深い眠り（ノンレム睡眠）** を繰り返しています。この1往復がおよそ90分で、一晩に4〜6回繰り返されます。

深い眠りの最中に起こされると、頭がぼんやりして体が重く感じます。逆に浅い眠りのタイミングなら、比較的すっきり目覚められます。そのため、睡眠時間を **90分の倍数** に合わせるとよい、と言われています。

| サイクル数 | 睡眠時間 |
|---|---|
| 3回 | 4時間30分 |
| 4回 | 6時間 |
| 5回 | **7時間30分** |
| 6回 | 9時間 |

多くの成人にとっては **5サイクル（7時間30分）** が適量とされています。

## 90分は目安にすぎない

ただし、90分という数字を厳密に信じすぎないでください。実際のサイクルには **80〜110分程度の個人差** があり、同じ人でも夜の前半と後半で長さが変わります。

- 夜の前半: 深い眠りが多く、サイクルはやや短い
- 夜の後半: レム睡眠の割合が増え、サイクルが長くなる

「90分の倍数だから起きやすいはず」と考えて睡眠時間を削るより、**必要な睡眠時間を確保するほうがはるかに重要** です。このツールでサイクルの長さを変えられるようにしているのは、自分に合う周期を見つけるための調整用です。

## 必要な睡眠時間

厚生労働省の「健康づくりのための睡眠ガイド」では、年代別の目安が示されています。

| 年代 | 推奨される睡眠時間 |
|---|---|
| 小学生 | 9〜12時間 |
| 中高生 | 8〜10時間 |
| 成人 | 6時間以上 |
| 高齢者 | 床上時間が8時間を超えないように |

成人については「6時間以上」が目安とされていますが、必要な量には個人差があります。日中に強い眠気を感じない、休日に平日より2時間以上多く寝ることがない、という状態であれば足りていると考えられます。

高齢になると必要な睡眠時間は短くなり、寝床にいる時間が長すぎるとかえって眠りが浅くなります。

## 寝つくまでの時間

布団に入ってから眠りに落ちるまでの時間を **入眠潜時** といいます。平均は10〜20分程度です。

- **5分未満**: 睡眠不足の可能性があります
- **10〜20分**: 標準的
- **30分以上**: 入眠困難の傾向。生活習慣の見直しが有効な場合があります

このツールでは、逆算のときにこの時間を差し引いています。初期値は15分ですが、自分の実感に合わせて変えてください。

## 眠りの質を上げるためにできること

- **起床時刻を一定にする**: 就寝時刻より起床時刻を揃えるほうが、体内時計は安定します
- **朝に光を浴びる**: 起床後1時間以内に日光を浴びると、体内時計がリセットされます
- **就寝1〜2時間前に入浴**: 上がった深部体温が下がるタイミングで眠気が訪れます
- **寝る前のカフェインを避ける**: 効果は4〜6時間続きます。夕方以降のコーヒーは影響が残ります
- **アルコールは寝つきをよくするが質を下げる**: 睡眠の後半で覚醒が増え、深い眠りが減ります
- **画面の光**: 就寝前のスマートフォンは、光そのものより「操作による脳の覚醒」の影響が大きいとされています

## 寝だめはできない

平日の睡眠不足を週末にまとめて解消することはできません。休日に長く眠ると、その分だけ夜に眠くならず、月曜の朝がさらにつらくなる **社会的時差ぼけ** が起きます。

休日の起床を平日より遅らせるのは **2時間まで** に留め、不足分は昼寝（20分程度）で補うほうが体内時計への影響が小さくなります。

> 睡眠に関する悩みが続く場合は、医療機関にご相談ください。このツールの計算は一般的な目安であり、診断ではありません。
`,

  faq: [
    {
      q: "睡眠時間を90分の倍数にすると本当にすっきり起きられますか？",
      a: "目安としては有効ですが、サイクルの長さには80〜110分の個人差があり、一晩の中でも変動します。90分の倍数に合わせるために睡眠時間を削るより、必要な時間を確保するほうが大切です。",
    },
    {
      q: "成人に必要な睡眠時間はどれくらいですか？",
      a: "厚生労働省の睡眠ガイドでは6時間以上が目安とされています。日中に強い眠気がなく、休日に平日より2時間以上多く寝ることがなければ足りていると考えられます。",
    },
    {
      q: "4時間半の睡眠でも大丈夫ですか？",
      a: "3サイクル分にあたりますが、継続すると集中力や判断力の低下、健康リスクの上昇につながります。短時間睡眠で足りる人はごく少数です。一時的な対応にとどめてください。",
    },
    {
      q: "休日に寝だめをしてもいいですか？",
      a: "平日の不足を取り戻すことはできません。休日の起床を平日より2時間以上遅らせると体内時計がずれ、月曜の朝がつらくなります。不足分は20分程度の昼寝で補うほうが効果的です。",
    },
    {
      q: "寝つくまでの時間はどれくらいが普通ですか？",
      a: "10〜20分が標準的です。5分未満で眠ってしまう場合は睡眠不足の可能性があり、30分以上かかる状態が続く場合は生活習慣の見直しを検討してください。",
    },
  ],
};
