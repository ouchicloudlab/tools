export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "時差の計算｜海外の今の時刻と会議時間の調整",
  h1: "時差・世界時計の計算ツール",
  description:
    "日本と海外主要都市の時差を計算します。サマータイムも自動で反映。日本の時刻を入れると相手先の現地時刻が分かるので、海外との会議設定に使える無料ツールです。",
  cardText: "海外の現地時刻と時差を計算。サマータイム対応。",
  keywords: [
    "時差", "計算", "世界時計", "現地時間", "サマータイム", "海外", "会議", "UTC", "タイムゾーン",
  ],
  related: ["jikan-keisan", "youbi-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="baseDate">日本の日付</label>
    <input type="date" id="baseDate">
  </div>
  <div class="field">
    <label for="baseTime">日本の時刻</label>
    <input type="time" id="baseTime" value="10:00">
  </div>
  <div class="field">
    <label for="city">都市を選ぶ</label>
    <select id="city">
      <option value="America/Los_Angeles">ロサンゼルス</option>
      <option value="America/New_York" selected>ニューヨーク</option>
      <option value="America/Chicago">シカゴ</option>
      <option value="America/Sao_Paulo">サンパウロ</option>
      <option value="Europe/London">ロンドン</option>
      <option value="Europe/Paris">パリ・ベルリン</option>
      <option value="Europe/Moscow">モスクワ</option>
      <option value="Asia/Dubai">ドバイ</option>
      <option value="Asia/Kolkata">インド（デリー）</option>
      <option value="Asia/Bangkok">バンコク</option>
      <option value="Asia/Singapore">シンガポール</option>
      <option value="Asia/Shanghai">上海・北京</option>
      <option value="Asia/Seoul">ソウル</option>
      <option value="Australia/Sydney">シドニー</option>
      <option value="Pacific/Auckland">オークランド</option>
      <option value="America/Honolulu">ホノルル</option>
      <option value="UTC">UTC（協定世界時）</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="cityLabel">現地時刻</div>
  <div class="result-main" id="localVal">-</div>
  <div class="result-grid">
    <div><div class="k">日本との時差</div><div class="v" id="diffVal">-</div></div>
    <div><div class="k">日付の違い</div><div class="v" id="dayVal">-</div></div>
    <div><div class="k">UTCとの差</div><div class="v" id="utcVal">-</div></div>
    <div><div class="k">サマータイム</div><div class="v" id="dstVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>主要都市の同時刻</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>都市</th><th>現地時刻</th><th>時差</th><th>会議に適した時間か</th></tr></thead>
    <tbody id="cityTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var CITIES = [
    ["東京", "Asia/Tokyo"],
    ["ソウル", "Asia/Seoul"],
    ["上海・北京", "Asia/Shanghai"],
    ["シンガポール", "Asia/Singapore"],
    ["バンコク", "Asia/Bangkok"],
    ["インド（デリー）", "Asia/Kolkata"],
    ["ドバイ", "Asia/Dubai"],
    ["モスクワ", "Europe/Moscow"],
    ["パリ・ベルリン", "Europe/Paris"],
    ["ロンドン", "Europe/London"],
    ["ニューヨーク", "America/New_York"],
    ["シカゴ", "America/Chicago"],
    ["ロサンゼルス", "America/Los_Angeles"],
    ["ホノルル", "Pacific/Honolulu"],
    ["シドニー", "Australia/Sydney"],
    ["オークランド", "Pacific/Auckland"]
  ];
  var WD = ["日", "月", "火", "水", "木", "金", "土"];

  // 指定タイムゾーンでの現地時刻を、日付の各要素として取り出す
  function partsIn(date, tz) {
    var fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", weekday: "short"
    });
    var out = {};
    fmt.formatToParts(date).forEach(function (p) { out[p.type] = p.value; });
    // 24時をまたぐ表記の揺れをならす
    if (out.hour === "24") out.hour = "00";
    return out;
  }

  // そのタイムゾーンのUTCオフセット（分）
  function offsetMinutes(date, tz) {
    var p = partsIn(date, tz);
    var asUTC = Date.UTC(
      Number(p.year), Number(p.month) - 1, Number(p.day),
      Number(p.hour), Number(p.minute)
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  }

  function fmtOffset(min) {
    var sign = min < 0 ? "−" : "+";
    var a = Math.abs(min);
    return sign + Math.floor(a / 60) + (a % 60 ? ":" + String(a % 60).padStart(2, "0") : "");
  }

  // 夏時間中かどうかは、1月と7月のオフセットと比べて判定する
  function isDst(date, tz) {
    var y = date.getUTCFullYear();
    var jan = offsetMinutes(new Date(Date.UTC(y, 0, 15)), tz);
    var jul = offsetMinutes(new Date(Date.UTC(y, 6, 15)), tz);
    var std = Math.min(jan, jul);
    return offsetMinutes(date, tz) > std;
  }

  ST.live(function () {
    var d = ST.$("baseDate").value;
    var t = ST.$("baseTime").value;
    if (!d || !t) {
      ["localVal","diffVal","dayVal","utcVal","dstVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "日付と時刻を入力してください。");
      ST.$("cityTable").innerHTML = "";
      return;
    }

    // 入力は日本時間（UTC+9固定）として解釈する
    var dp = d.split("-").map(Number);
    var tp = t.split(":").map(Number);
    var base = new Date(Date.UTC(dp[0], dp[1] - 1, dp[2], tp[0] - 9, tp[1]));

    var tz = ST.$("city").value;
    var p = partsIn(base, tz);
    var off = offsetMinutes(base, tz);
    var jstOff = 540;                       // 日本は UTC+9
    var diff = off - jstOff;

    var cityName = ST.$("city").selectedOptions[0].textContent;
    var dayLabel = p.year + "/" + p.month + "/" + p.day;
    var jstDay = dp[0] + "/" + String(dp[1]).padStart(2, "0") + "/" + String(dp[2]).padStart(2, "0");

    ST.$("cityLabel").textContent = cityName + "の現地時刻";
    ST.set("localVal", p.hour + ":" + p.minute + "（" + Number(p.month) + "/" + Number(p.day) + " " +
      (p.weekday || "") + "）");
    ST.set("diffVal", (diff === 0 ? "同じ" : fmtOffset(diff) + " 時間"));
    ST.set("dayVal", dayLabel === jstDay ? "同じ日" :
      (new Date(p.year, p.month - 1, p.day) < new Date(dp[0], dp[1] - 1, dp[2])
        ? "前日" : "翌日"));
    ST.set("utcVal", "UTC" + fmtOffset(off));
    ST.set("dstVal", isDst(base, tz) ? "実施中（夏時間）" : "なし・冬時間");
    ST.set("detail",
      "日本時間 " + t + "（" + jstDay + "）は、" + cityName + "では " +
      p.hour + ":" + p.minute + "（" + dayLabel + "）です。" +
      "サマータイムの有無はその日付をもとに自動で判定しています。");

    // 主要都市の一覧
    ST.$("cityTable").innerHTML = CITIES.map(function (c) {
      var cp = partsIn(base, c[1]);
      var co = offsetMinutes(base, c[1]);
      var cd = co - jstOff;
      var h = Number(cp.hour);
      var judge = (h >= 9 && h < 18) ? "業務時間内"
        : (h >= 7 && h < 22) ? "連絡は可能" : "深夜・早朝";
      var isTokyo = c[1] === "Asia/Tokyo";
      return "<tr" + (isTokyo ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + c[0] + "</td><td>" + cp.hour + ":" + cp.minute + "（" +
        Number(cp.month) + "/" + Number(cp.day) + "）</td><td>" +
        (cd === 0 ? "—" : fmtOffset(cd)) + "</td><td>" + judge + "</td></tr>";
    }).join("");
  });

  // 日付の初期値
  var el = ST.$("baseDate");
  if (el && !el.value) {
    var now = new Date();
    el.value = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
  }
  el.dispatchEvent(new Event("change", { bubbles: true }));
})();
`,

  intro: `
日本の日時を入れると、海外主要都市の現地時刻が分かります。**サマータイムはその日付に応じて自動で判定**するので、時期による時差の変化も正しく反映されます。
`,

  guide: `
## 時差はなぜ変わるのか

「ニューヨークとの時差は14時間」と覚えていても、時期によって13時間になります。**サマータイム（夏時間）** があるためです。

多くの欧米諸国では、日照時間の長い時期に時計を1時間進めます。日本にはこの制度がないため、相手国が夏時間に入ると時差が1時間縮まります。

| 都市 | 冬（標準時） | 夏（夏時間） |
|---|---|---|
| ニューヨーク | −14時間 | −13時間 |
| ロサンゼルス | −17時間 | −16時間 |
| ロンドン | −9時間 | −8時間 |
| パリ・ベルリン | −8時間 | −7時間 |
| シドニー | +1時間 | +2時間 |

**南半球のシドニーは、北半球と逆の時期に夏時間になります**（10月〜4月）。

一方、アジア圏（韓国・中国・シンガポール・タイ・インド）には夏時間がなく、時差は年間を通して一定です。

## 夏時間の切り替え時期

| 地域 | 開始 | 終了 |
|---|---|---|
| アメリカ・カナダ | 3月第2日曜 | 11月第1日曜 |
| EU・イギリス | 3月最終日曜 | 10月最終日曜 |
| オーストラリア（一部の州） | 10月第1日曜 | 4月第1日曜 |

**アメリカとヨーロッパでは切り替え日が2〜3週間ずれます。** この期間はいつもと時差が違うため、会議の設定を間違えやすくなります。

このツールは指定した日付をもとに判定するので、「来月の会議」のように先の日程でも正しい時差が出ます。

## 30分・45分ずれる地域

時差は必ずしも1時間単位ではありません。

| 地域 | UTCとの差 |
|---|---|
| インド | +5:30 |
| イラン | +3:30 |
| ミャンマー | +6:30 |
| ネパール | **+5:45** |
| オーストラリア中部 | +9:30 |

**ネパールの+5:45** は世界で唯一の45分刻みです。インドとの差別化のために設定されたと言われています。日本との時差は3時間15分です。

## 会議時間を決めるコツ

日本と海外で共通の業務時間を探すのは、地域によって難しさが変わります。

| 相手 | 重なりやすい時間（日本時間） |
|---|---|
| アジア（韓国・中国・東南アジア） | 終日 |
| インド | 午後（13:00〜18:00） |
| 中東・ヨーロッパ | 夕方以降（16:00〜19:00） |
| アメリカ東海岸 | **早朝（7:00〜9:00）または夜（22:00〜24:00）** |
| アメリカ西海岸 | 午前（9:00〜11:00） |

アメリカ東海岸とは業務時間が全く重ならないため、どちらかが早朝か夜に合わせる必要があります。西海岸なら日本の午前が先方の夕方にあたり、比較的合わせやすくなります。

## 日付が変わることに注意

時差が大きいと、同じ瞬間でも日付が違います。日本の月曜午前10時は、ニューヨークでは **日曜の夜9時** です。

- 「月曜の朝イチで」と伝えると、相手には日曜と伝わる可能性があります
- **必ず相手の現地日時も併記** してください（例: 「3月10日 10:00 JST / 3月9日 21:00 EST」）
- カレンダーの招待は、タイムゾーン情報を含めて送れば自動的に変換されます

## UTCとGMT

- **UTC（協定世界時）**: 原子時計に基づく現在の標準。技術的な文脈で使われます
- **GMT（グリニッジ標準時）**: 天文観測に基づく古い基準。実用上はUTCとほぼ同じ

日本標準時（JST）は **UTC+9** です。ログの時刻表示やシステムの設定では、UTCで記録して表示時に変換するのが一般的です。
`,

  faq: [
    {
      q: "ニューヨークとの時差は何時間ですか？",
      a: "冬（標準時）は14時間、夏時間の期間は13時間です。アメリカの夏時間は3月第2日曜から11月第1日曜までなので、この間は時差が1時間縮まります。",
    },
    {
      q: "サマータイムはいつ切り替わりますか？",
      a: "アメリカ・カナダは3月第2日曜〜11月第1日曜、EU・イギリスは3月最終日曜〜10月最終日曜です。切り替え日が2〜3週間ずれるため、その期間はいつもと時差が違います。",
    },
    {
      q: "アジアの国にサマータイムはありますか？",
      a: "韓国・中国・シンガポール・タイ・インドなど主要なアジア諸国にはありません。そのため時差は年間を通して一定です。",
    },
    {
      q: "時差が30分単位の国はありますか？",
      a: "あります。インドは+5:30、イランは+3:30、ネパールは+5:45です。ネパールは世界で唯一の45分刻みで、日本との時差は3時間15分になります。",
    },
    {
      q: "海外との会議はいつ設定すればいいですか？",
      a: "アジアなら終日、ヨーロッパなら日本の夕方以降、アメリカ西海岸なら日本の午前が合わせやすい時間帯です。東海岸とは業務時間が重ならないため、どちらかが早朝か夜に合わせることになります。",
    },
  ],
};
