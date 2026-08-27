export default {
  category: "datetime",
  updated: "2026-08-22",
  title: "年齢計算ツール｜生年月日から満年齢・数え年・干支・学年がわかる",
  h1: "年齢計算ツール",
  description:
    "生年月日を入れると、満年齢・数え年・干支・星座・生まれてからの日数・次の誕生日までの日数をまとめて表示します。早生まれを考慮した学年も分かる無料ツールです。",
  cardText: "満年齢・数え年・干支・学年・次の誕生日まで。",
  keywords: [
    "年齢計算", "満年齢", "数え年", "干支", "星座", "生年月日", "学年", "早生まれ", "何歳",
  ],
  related: ["hidzuke-keisan", "wareki-seireki"],

  ui: `
<div class="row">
  <div class="field">
    <label for="birth">生年月日</label>
    <input type="date" id="birth" value="1990-05-15">
  </div>
  <div class="field">
    <label for="target">基準日（この日時点の年齢）</label>
    <input type="date" id="target">
    <p class="hint">初期値は今日です。</p>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">満年齢</div>
  <div class="result-main" id="ageVal">-</div>
  <div class="result-grid">
    <div><div class="k">数え年</div><div class="v" id="kazoeVal">-</div></div>
    <div><div class="k">干支（十二支）</div><div class="v" id="etoVal">-</div></div>
    <div><div class="k">星座</div><div class="v" id="seizaVal">-</div></div>
    <div><div class="k">生まれてから</div><div class="v" id="daysVal">-</div></div>
    <div><div class="k">次の誕生日まで</div><div class="v" id="nextVal">-</div></div>
    <div><div class="k">学年（日本の学校）</div><div class="v" id="gradeVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  var ETO = ["申","酉","戌","亥","子","丑","寅","卯","辰","巳","午","未"];
  var ETO_YOMI = { "子":"ね","丑":"うし","寅":"とら","卯":"う","辰":"たつ","巳":"み",
    "午":"うま","未":"ひつじ","申":"さる","酉":"とり","戌":"いぬ","亥":"い" };
  // 星座の境界日（その月の何日以降が次の星座になるか）
  var SEIZA = [
    [1,20,"やぎ座","みずがめ座"], [2,19,"みずがめ座","うお座"],
    [3,21,"うお座","おひつじ座"], [4,20,"おひつじ座","おうし座"],
    [5,21,"おうし座","ふたご座"], [6,22,"ふたご座","かに座"],
    [7,23,"かに座","しし座"], [8,23,"しし座","おとめ座"],
    [9,23,"おとめ座","てんびん座"], [10,24,"てんびん座","さそり座"],
    [11,23,"さそり座","いて座"], [12,22,"いて座","やぎ座"]
  ];

  function parse(el) {
    var v = el.value;
    if (!v) return null;
    var p = v.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function seiza(m, d) {
    var row = SEIZA[m - 1];
    return d >= row[1] ? row[3] : row[2];
  }

  // 日本の学校の学年。4月2日〜翌年4月1日生まれが同じ学年になる。
  function grade(birth, target) {
    // 「4月1日時点で何歳か」でその年度の学年が決まる
    var y = target.getMonth() + 1 >= 4 ? target.getFullYear() : target.getFullYear() - 1;
    var apr1 = new Date(y, 3, 1);
    var age = apr1.getFullYear() - birth.getFullYear();
    var pre = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
    pre.setFullYear(apr1.getFullYear());
    if (apr1 < pre) age--;
    var g = age - 6; // 4月1日時点で6歳なら小学1年
    if (g < 0) return "就学前";
    if (g <= 5) return "小学" + (g + 1) + "年";
    if (g <= 8) return "中学" + (g - 5) + "年";
    if (g <= 11) return "高校" + (g - 8) + "年";
    if (g <= 15) return "大学" + (g - 11) + "年相当";
    return "卒業後";
  }

  // 計算できないときに前回の結果が残らないよう、まとめて空にする
  function clear(msg) {
    ["ageVal","kazoeVal","etoVal","seizaVal","daysVal","nextVal","gradeVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  ST.live(function () {
    var birth = parse(ST.$("birth"));
    var target = parse(ST.$("target"));
    if (!birth || !target) return clear("生年月日と基準日を入力してください。");
    if (target < birth) return clear("基準日が生年月日より前になっています。");

    // 満年齢
    var age = target.getFullYear() - birth.getFullYear();
    var anniv = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (target < anniv) age--;

    // 経過の年月日
    var y = age;
    var mFrom = new Date(birth.getFullYear() + y, birth.getMonth(), birth.getDate());
    var months = 0;
    while (true) {
      var next = new Date(mFrom.getFullYear(), mFrom.getMonth() + months + 1, mFrom.getDate());
      if (next > target) break;
      months++;
    }
    var dFrom = new Date(mFrom.getFullYear(), mFrom.getMonth() + months, mFrom.getDate());
    var restDays = Math.floor((target - dFrom) / 86400000);

    // 生まれてからの日数
    var totalDays = Math.floor((target - birth) / 86400000);

    // 次の誕生日
    var nextB = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextB < target) nextB = new Date(target.getFullYear() + 1, birth.getMonth(), birth.getDate());
    var toNext = Math.round((nextB - target) / 86400000);

    // 数え年（生まれた年を1歳とし、元日ごとに1歳加える）
    var kazoe = target.getFullYear() - birth.getFullYear() + 1;

    var eto = ETO[birth.getFullYear() % 12];

    ST.set("ageVal", age + "歳");
    ST.set("kazoeVal", kazoe + "歳");
    ST.set("etoVal", eto + "（" + ETO_YOMI[eto] + "）年");
    ST.set("seizaVal", seiza(birth.getMonth() + 1, birth.getDate()));
    ST.set("daysVal", ST.num(totalDays, 0) + "日");
    ST.set("nextVal", toNext === 0 ? "今日が誕生日" : toNext + "日");
    ST.set("gradeVal", grade(birth, target));
    ST.set("detail",
      "詳しくは " + y + "歳 " + months + "か月 " + restDays + "日。" +
      "生まれた日は" + "日月火水木金土".charAt(birth.getDay()) + "曜日です。");
  });

  // 基準日の初期値を今日にする
  var t = ST.$("target");
  if (t && !t.value) {
    var now = new Date();
    t.value = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
    t.dispatchEvent(new Event("change", { bubbles: true }));
  }
})();
`,

  intro: `
生年月日を入力すると、満年齢のほか、数え年・干支・星座・生まれてからの通算日数・次の誕生日までの日数が一度に表示されます。基準日を変えれば「特定の日に何歳だったか」も調べられます。
`,

  guide: `
## 満年齢と数え年の違い

日本では2つの年齢の数え方が使われてきました。

| | 満年齢 | 数え年 |
|---|---|---|
| 生まれたとき | 0歳 | 1歳 |
| 年をとる日 | 誕生日 | 元日（1月1日） |
| 現在の主な用途 | 公的手続き全般 | 七五三、還暦などの年祝い、厄年 |

現在の法律や公的な手続きはすべて満年齢です。数え年が残っているのは、神社の厄年の表や、長寿のお祝いなど、伝統的な行事の場面です。

数え年は「その年の元日を何回迎えたか」で決まるため、12月31日生まれの人は翌日の1月1日に数え年2歳になります。満年齢との差は、誕生日前なら2歳、誕生日以降なら1歳です。

## 法律上、年をとるのは誕生日の前日

意外に思われますが、日本の法律（年齢計算ニ関スル法律）では、**年齢が加算されるのは誕生日の前日の午後12時** です。

これは、4月1日生まれの人が1つ上の学年になる理由でもあります。4月1日生まれの人は3月31日に満6歳となるため、その年度の小学校入学の対象になります。結果として、**4月2日から翌年4月1日までに生まれた人が同じ学年** になります。

このツールの学年表示も、このルールに沿って計算しています。

## 干支（十二支）の求め方

十二支は、西暦を12で割った余りで決まります。

| 余り | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 十二支 | 申 | 酉 | 戌 | 亥 | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 |

たとえば1990年は 1990 ÷ 12 = 165 余り10 なので「午（うま）年」です。

なお、暦の上での干支の切り替わりを旧暦や立春（2月4日ごろ）とする流派もあります。占いの分野では立春を境にすることが多いため、1月・2月生まれの方は、用途に応じて確認してください。このツールは新暦の1月1日で切り替える一般的な方式を採用しています。

## 星座の境界日

星座の区切りは月末ではなく、月の20日前後です。誕生日が境目に近い場合、資料によって1日ずれることがあります。太陽が星座を通過する時刻が年によって前後するためで、厳密には生まれた年と時刻によって変わります。

| 星座 | 期間 |
|---|---|
| やぎ座 | 12/22 – 1/19 |
| みずがめ座 | 1/20 – 2/18 |
| うお座 | 2/19 – 3/20 |
| おひつじ座 | 3/21 – 4/19 |
| おうし座 | 4/20 – 5/20 |
| ふたご座 | 5/21 – 6/21 |
| かに座 | 6/22 – 7/22 |
| しし座 | 7/23 – 8/22 |
| おとめ座 | 8/23 – 9/22 |
| てんびん座 | 9/23 – 10/23 |
| さそり座 | 10/24 – 11/22 |
| いて座 | 11/23 – 12/21 |

## 年祝いの一覧（数え年）

| 名称 | 数え年 | 由来 |
|---|---|---|
| 還暦 | 61歳 | 干支が一巡して生まれ年に戻る |
| 古希 | 70歳 | 杜甫の詩「人生七十古来稀なり」 |
| 喜寿 | 77歳 | 「喜」の草書体が七十七に見える |
| 傘寿 | 80歳 | 「傘」の略字が八十に見える |
| 米寿 | 88歳 | 「米」の字が八十八に分解できる |
| 卒寿 | 90歳 | 「卒」の略字が九十に見える |
| 白寿 | 99歳 | 「百」から「一」を取ると「白」 |

還暦だけは満60歳で祝うことも一般的になっています。地域や家庭の慣習に合わせてください。
`,

  faq: [
    {
      q: "満年齢と数え年はどちらを使えばいいですか？",
      a: "公的な手続きや契約はすべて満年齢です。数え年は、厄年の表や還暦・米寿などの年祝いで使われます。神社の案内が数え年で書かれていることが多いため、お参りの際は確認してください。",
    },
    {
      q: "4月1日生まれはなぜ早生まれになるのですか？",
      a: "法律上、年齢が加算されるのは誕生日の前日だからです。4月1日生まれの人は3月31日に満6歳となり、その年度の入学対象になります。そのため4月2日〜翌4月1日生まれが同学年です。",
    },
    {
      q: "うるう年の2月29日生まれは、いつ年をとりますか？",
      a: "法律上は2月28日の終了時点で年齢が加算されます。うるう年でない年でも、2月28日をもって1歳増えるという扱いです。",
    },
    {
      q: "干支は1月1日と立春のどちらで切り替わりますか？",
      a: "一般的な暦では1月1日ですが、四柱推命などの占いでは立春（2月4日ごろ）を境にします。このツールは1月1日で切り替える方式です。1月・2月生まれの方は用途に応じてご確認ください。",
    },
    {
      q: "過去や未来の特定の日の年齢も調べられますか？",
      a: "調べられます。「基準日」を変更すると、その日時点での満年齢・学年などが表示されます。",
    },
  ],
};
