export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "曜日の計算｜生まれた日の曜日や第◯曜日の日付がわかる",
  h1: "曜日の計算ツール",
  description:
    "日付から曜日を調べたり、「毎月第3水曜日」がいつになるかを計算できます。指定した曜日の次の日付や、月内の曜日の一覧も表示する無料ツールです。",
  cardText: "日付→曜日、第◯曜日の日付、次の◯曜日を計算。",
  keywords: [
    "曜日", "計算", "第3水曜", "何曜日", "生まれた日", "カレンダー", "次の", "日付",
  ],
  related: ["hidzuke-keisan", "nenrei-keisan"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="day" checked>日付の曜日を調べる</label>
    <label><input type="radio" name="mode" value="nth">第◯曜日の日付を調べる</label>
    <label><input type="radio" name="mode" value="next">次の◯曜日を調べる</label>
  </div>
</div>

<div id="paneDay">
  <div class="field">
    <label for="date">日付</label>
    <input type="date" id="date">
  </div>
</div>

<div id="paneNth" hidden>
  <div class="row">
    <div class="field"><label for="year">年</label>
      <input type="number" id="year" inputmode="numeric" value="2026"></div>
    <div class="field"><label for="month">月</label>
      <input type="number" id="month" inputmode="numeric" value="9" min="1" max="12"></div>
    <div class="field"><label for="nth">第</label>
      <select id="nth">
        <option value="1">第1</option>
        <option value="2">第2</option>
        <option value="3" selected>第3</option>
        <option value="4">第4</option>
        <option value="5">第5</option>
        <option value="-1">最終</option>
      </select></div>
    <div class="field"><label for="weekday">曜日</label>
      <select id="weekday">
        <option value="0">日曜</option>
        <option value="1">月曜</option>
        <option value="2">火曜</option>
        <option value="3" selected>水曜</option>
        <option value="4">木曜</option>
        <option value="5">金曜</option>
        <option value="6">土曜</option>
      </select></div>
  </div>
</div>

<div id="paneNext" hidden>
  <div class="row">
    <div class="field"><label for="fromDate">基準日</label>
      <input type="date" id="fromDate"></div>
    <div class="field"><label for="targetWd">探す曜日</label>
      <select id="targetWd">
        <option value="0">日曜</option>
        <option value="1" selected>月曜</option>
        <option value="2">火曜</option>
        <option value="3">水曜</option>
        <option value="4">木曜</option>
        <option value="5">金曜</option>
        <option value="6">土曜</option>
      </select></div>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">曜日</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">その年の何日目</div><div class="v" id="doyVal">-</div></div>
    <div><div class="k">その年の第何週</div><div class="v" id="weekVal">-</div></div>
    <div><div class="k">月内で第何◯曜日</div><div class="v" id="nthVal">-</div></div>
    <div><div class="k">月末まで</div><div class="v" id="restVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>その月の同じ曜日</h3>
<div id="listBox" class="note">-</div>
`,

  script: `
(function () {
  var WD = ["日", "月", "火", "水", "木", "金", "土"];

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
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() +
      "日（" + WD[d.getDay()] + "）";
  }
  // 指定した月の「第n◯曜日」。n が -1 なら最終。
  function nthWeekday(year, month, n, wd) {
    if (n === -1) {
      var last = new Date(year, month, 0);          // 月末日
      var diff = (last.getDay() - wd + 7) % 7;
      return new Date(year, month - 1, last.getDate() - diff);
    }
    var first = new Date(year, month - 1, 1);
    var offset = (wd - first.getDay() + 7) % 7;
    var day = 1 + offset + (n - 1) * 7;
    var days = new Date(year, month, 0).getDate();
    return day > days ? null : new Date(year, month - 1, day);
  }

  function describe(d) {
    var start = new Date(d.getFullYear(), 0, 1);
    var doy = Math.floor((d - start) / 86400000) + 1;
    var week = Math.ceil((doy + start.getDay()) / 7);
    var nth = Math.floor((d.getDate() - 1) / 7) + 1;
    var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    ST.set("doyVal", doy + "日目");
    ST.set("weekVal", "第" + week + "週");
    ST.set("nthVal", "第" + nth + WD[d.getDay()] + "曜日");
    ST.set("restVal", (lastDay - d.getDate()) + "日");

    // 同じ月の同じ曜日を一覧にする
    var list = [];
    for (var day = 1; day <= lastDay; day++) {
      var t = new Date(d.getFullYear(), d.getMonth(), day);
      if (t.getDay() === d.getDay()) {
        list.push((day === d.getDate() ? "▶ " : "") + (d.getMonth() + 1) + "/" + day);
      }
    }
    ST.$("listBox").textContent =
      d.getFullYear() + "年" + (d.getMonth() + 1) + "月の" + WD[d.getDay()] +
      "曜日: " + list.join("、");
  }

  function clear(msg) {
    ["mainVal","doyVal","weekVal","nthVal","restVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
    ST.$("listBox").textContent = "-";
  }

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("paneDay").hidden = mode !== "day";
    ST.$("paneNth").hidden = mode !== "nth";
    ST.$("paneNext").hidden = mode !== "next";

    if (mode === "day") {
      var d = parse(ST.$("date"));
      if (!d) return clear("日付を入力してください。");
      ST.$("mainLabel").textContent = "曜日";
      ST.set("mainVal", WD[d.getDay()] + "曜日");
      ST.set("detail", fmt(d) + " です。");
      describe(d);
    } else if (mode === "nth") {
      var y = Math.round(ST.n(ST.$("year")));
      var m = Math.round(ST.n(ST.$("month")));
      var n = Number(ST.$("nth").value);
      var wd = Number(ST.$("weekday").value);
      if (y < 1 || m < 1 || m > 12) return clear("年と月を正しく入力してください。");
      var t = nthWeekday(y, m, n, wd);
      if (!t) {
        return clear(y + "年" + m + "月に第" + n + WD[wd] + "曜日はありません。");
      }
      ST.$("mainLabel").textContent =
        (n === -1 ? "最終" : "第" + n) + WD[wd] + "曜日";
      ST.set("mainVal", fmt(t));
      ST.set("detail", y + "年" + m + "月1日は" + WD[new Date(y, m - 1, 1).getDay()] +
        "曜日から始まります。");
      describe(t);
    } else {
      var from = parse(ST.$("fromDate"));
      var target = Number(ST.$("targetWd").value);
      if (!from) return clear("基準日を入力してください。");
      var diff = (target - from.getDay() + 7) % 7;
      if (diff === 0) diff = 7;   // 同じ曜日なら翌週
      var next = new Date(from.getTime());
      next.setDate(next.getDate() + diff);
      ST.$("mainLabel").textContent = "次の" + WD[target] + "曜日";
      ST.set("mainVal", fmt(next));
      ST.set("detail", fmt(from) + " から " + diff + "日後です。" +
        "基準日と同じ曜日を選んだ場合は、翌週の日付を表示します。");
      describe(next);
    }
  });

  // 日付欄の初期値
  var now = new Date();
  ["date", "fromDate"].forEach(function (id) {
    var el = ST.$(id);
    if (el && !el.value) el.value = iso(now);
  });
  ST.$("date").dispatchEvent(new Event("change", { bubbles: true }));
})();
`,

  intro: `
日付から曜日を調べるほか、「毎月第3水曜日」のような繰り返しの予定がいつになるかを計算できます。ゴミ出しの日や定例会議の日程確認に使えます。
`,

  guide: `
## 「第◯曜日」の数え方

**その月の1日から数えて、◯回目のその曜日** を指します。週の区切りとは関係ありません。

たとえば1日が金曜日の月なら、

- 第1金曜日 = 1日
- 第1月曜日 = 4日（最初の月曜が4日のため）

同じ月でも、曜日によって第1週にあたる日付が変わります。「第1週の月曜日」と「第1月曜日」は違う日を指すことがあるため、予定を伝えるときは **「第◯◯曜日」** の形で書くほうが誤解がありません。

## 第5週があるかどうか

月によって、ある曜日が4回しかない場合と5回ある場合があります。

- 28日の月（平年の2月）→ すべての曜日がちょうど4回
- 30日の月 → 2つの曜日が5回
- 31日の月 → 3つの曜日が5回

「第5金曜日は休み」といった取り決めがある場合、その月に第5金曜日が存在するかを確認する必要があります。このツールで「第5」を選んだとき、その月に存在しなければその旨が表示されます。

## 曜日を暗算で求める

**ツェラーの公式** を使うと、任意の日付の曜日を計算できます。ただし手計算には手間がかかります。

日常的に使いやすいのは「その年のアンカーデー」を覚える方法です。同じ年の中では、次の日付がすべて同じ曜日になります。

- 4月4日、6月6日、8月8日、10月10日、12月12日
- 5月9日、9月5日、7月11日、11月7日

2026年ならこれらはすべて土曜日です。近い日付を基準にして数えれば、暗算でも曜日を求められます。

## 週の始まりは日曜？月曜？

- **日本・アメリカ**: 日曜始まりのカレンダーが一般的
- **ISO 8601（国際規格）**: **月曜始まり**
- **ビジネス・システム開発**: ISOに合わせることが多い

システムが表示する「第◯週」がカレンダーと合わない場合、この違いが原因です。ISO 8601では「その年の最初の木曜日を含む週」を第1週とするため、1月1日が第52週や第53週に含まれることもあります。

このツールの「第何週」は、1月1日を含む週を第1週とする日本のカレンダーに近い数え方です。

## うるう年の判定

曜日の計算に影響するため、あわせて覚えておくと便利です。

1. 4で割り切れる年はうるう年
2. ただし100で割り切れる年は平年
3. ただし400で割り切れる年はうるう年

2000年は400で割り切れるためうるう年でしたが、1900年と2100年は平年です。

平年は365日 = 52週と1日なので、**翌年の同じ日付は曜日が1つ進みます**。うるう年をまたぐと2つ進みます。誕生日が今年より来年は何曜日か、という計算はこれで求められます。

## 六曜（大安・仏滅）について

このツールでは扱っていません。六曜は旧暦（太陰太陽暦）の月と日から決まるため、新暦の日付からは単純に計算できないためです。

旧暦の月日を求めるには、新月の時刻や閏月の配置を天文計算で求める必要があり、簡易な式では正確な値が出ません。冠婚葬祭で必要な場合は、暦の専門サイトかカレンダーでご確認ください。
`,

  faq: [
    {
      q: "「第3水曜日」はどう数えますか？",
      a: "その月の1日から数えて3回目の水曜日です。週の区切りとは関係ありません。1日が水曜なら第3水曜は15日、1日が木曜なら第3水曜は21日になります。",
    },
    {
      q: "第5週がない月はありますか？",
      a: "あります。28日しかない平年の2月は、すべての曜日がちょうど4回です。30日の月では2つの曜日、31日の月では3つの曜日だけが5回あります。",
    },
    {
      q: "来年の誕生日は何曜日ですか？",
      a: "平年をまたぐ場合は今年より1つ進み、うるう年の2月29日をまたぐ場合は2つ進みます。365日が52週と1日であるためです。このツールで来年の日付を入れれば確認できます。",
    },
    {
      q: "システムが表示する週番号がカレンダーと違います。",
      a: "週の始まりの定義が違うためです。国際規格のISO 8601では月曜始まりで、「その年の最初の木曜日を含む週」を第1週とします。日本のカレンダーは日曜始まりで1月1日を含む週を第1週とすることが多く、ずれが生じます。",
    },
    {
      q: "大安や仏滅は分かりますか？",
      a: "このツールでは扱っていません。六曜は旧暦の月日から決まるため、新暦の日付から単純な計算では求められません。天文計算による旧暦の変換が必要です。",
    },
  ],
};
