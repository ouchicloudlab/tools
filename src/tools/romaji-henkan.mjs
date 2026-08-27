export default {
  category: "text",
  updated: "2026-08-27",
  title: "ローマ字変換ツール｜パスポート用のヘボン式に対応",
  h1: "ひらがな・ローマ字変換ツール",
  description:
    "ひらがな・カタカナをローマ字に変換します。パスポート申請で使うヘボン式と、学校で習う訓令式の両方を同時に表示する無料ツールです。",
  cardText: "かな→ローマ字。ヘボン式と訓令式を同時表示。",
  keywords: [
    "ローマ字", "変換", "ヘボン式", "訓令式", "パスポート", "名前", "つづり", "ひらがな",
  ],
  yomi: "ろーまじ へぼんしき ぱすぽーと",
  related: ["moji-henkan", "kansuji"],

  ui: `
<div class="field">
  <label for="src">ひらがな・カタカナ</label>
  <textarea id="src" style="min-height:90px">おくだ りょうま</textarea>
  <p class="hint">漢字は変換できません。読みがなを入力してください。</p>
</div>

<div class="field">
  <span class="field-label">出力の形式</span>
  <div class="pills" id="fmt">
    <label><input type="radio" name="fmt" value="lower" checked>小文字</label>
    <label><input type="radio" name="fmt" value="upper">大文字（パスポート用）</label>
    <label><input type="radio" name="fmt" value="capital">先頭のみ大文字</label>
  </div>
</div>

<div class="field">
  <div class="pills">
    <label><input type="checkbox" id="noLong">長音を省略する（パスポート式）</label>
  </div>
  <p class="hint">「さとう」→ SATO のように、伸ばす音を書かない表記になります。</p>
</div>

<div class="row">
  <button class="btn" type="button" id="copyHepburn">ヘボン式をコピー</button>
  <button class="btn sub" type="button" id="copyKunrei">訓令式をコピー</button>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">ヘボン式（パスポート・一般的な表記）</div>
  <div class="result-main" id="hepburnVal" style="font-size:26px;word-break:break-all">-</div>
  <div class="result-grid">
    <div><div class="k">訓令式（学校で習う方式）</div><div class="v" id="kunreiVal" style="font-size:16px">-</div></div>
    <div><div class="k">文字数（ヘボン式）</div><div class="v" id="lenVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>間違えやすいつづり</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>読み</th><th>ヘボン式</th><th>訓令式</th><th>注意</th></tr></thead>
    <tbody>
      <tr><td>し</td><td>shi</td><td>si</td><td>パスポートは shi</td></tr>
      <tr><td>ち</td><td>chi</td><td>ti</td><td>パスポートは chi</td></tr>
      <tr><td>つ</td><td>tsu</td><td>tu</td><td>パスポートは tsu</td></tr>
      <tr><td>ふ</td><td>fu</td><td>hu</td><td>パスポートは fu</td></tr>
      <tr><td>じ</td><td>ji</td><td>zi</td><td>パスポートは ji</td></tr>
      <tr><td>しゃ</td><td>sha</td><td>sya</td><td>—</td></tr>
      <tr><td>ちょ</td><td>cho</td><td>tyo</td><td>—</td></tr>
      <tr><td>ん（b/m/pの前）</td><td>m</td><td>n</td><td>なんば → Namba</td></tr>
      <tr><td>おう</td><td>o</td><td>ô</td><td>こうた → Kota（長音は書かない）</td></tr>
    </tbody>
  </table>
</div>
`,

  script: `
(function () {
  // 拗音（2文字で1音）を先に処理する必要があるため、長いものから並べる
  var YOUON = {
    "きゃ":["kya","kya"], "きゅ":["kyu","kyu"], "きょ":["kyo","kyo"],
    "しゃ":["sha","sya"], "しゅ":["shu","syu"], "しょ":["sho","syo"],
    "ちゃ":["cha","tya"], "ちゅ":["chu","tyu"], "ちょ":["cho","tyo"],
    "にゃ":["nya","nya"], "にゅ":["nyu","nyu"], "にょ":["nyo","nyo"],
    "ひゃ":["hya","hya"], "ひゅ":["hyu","hyu"], "ひょ":["hyo","hyo"],
    "みゃ":["mya","mya"], "みゅ":["myu","myu"], "みょ":["myo","myo"],
    "りゃ":["rya","rya"], "りゅ":["ryu","ryu"], "りょ":["ryo","ryo"],
    "ぎゃ":["gya","gya"], "ぎゅ":["gyu","gyu"], "ぎょ":["gyo","gyo"],
    "じゃ":["ja","zya"], "じゅ":["ju","zyu"], "じょ":["jo","zyo"],
    "ぢゃ":["ja","zya"], "ぢゅ":["ju","zyu"], "ぢょ":["jo","zyo"],
    "びゃ":["bya","bya"], "びゅ":["byu","byu"], "びょ":["byo","byo"],
    "ぴゃ":["pya","pya"], "ぴゅ":["pyu","pyu"], "ぴょ":["pyo","pyo"],
    "ふぁ":["fa","fa"], "ふぃ":["fi","fi"], "ふぇ":["fe","fe"], "ふぉ":["fo","fo"],
    "うぃ":["wi","wi"], "うぇ":["we","we"], "てぃ":["ti","ti"], "でぃ":["di","di"],
    "しぇ":["she","sye"], "ちぇ":["che","tye"], "じぇ":["je","zye"],
    "つぁ":["tsa","tsa"], "つぃ":["tsi","tsi"], "つぇ":["tse","tse"], "つぉ":["tso","tso"],
    "ゔぁ":["va","va"], "ゔぃ":["vi","vi"], "ゔぇ":["ve","ve"], "ゔぉ":["vo","vo"]
  };
  var KANA = {
    "あ":["a","a"], "い":["i","i"], "う":["u","u"], "え":["e","e"], "お":["o","o"],
    "か":["ka","ka"], "き":["ki","ki"], "く":["ku","ku"], "け":["ke","ke"], "こ":["ko","ko"],
    "さ":["sa","sa"], "し":["shi","si"], "す":["su","su"], "せ":["se","se"], "そ":["so","so"],
    "た":["ta","ta"], "ち":["chi","ti"], "つ":["tsu","tu"], "て":["te","te"], "と":["to","to"],
    "な":["na","na"], "に":["ni","ni"], "ぬ":["nu","nu"], "ね":["ne","ne"], "の":["no","no"],
    "は":["ha","ha"], "ひ":["hi","hi"], "ふ":["fu","hu"], "へ":["he","he"], "ほ":["ho","ho"],
    "ま":["ma","ma"], "み":["mi","mi"], "む":["mu","mu"], "め":["me","me"], "も":["mo","mo"],
    "や":["ya","ya"], "ゆ":["yu","yu"], "よ":["yo","yo"],
    "ら":["ra","ra"], "り":["ri","ri"], "る":["ru","ru"], "れ":["re","re"], "ろ":["ro","ro"],
    "わ":["wa","wa"], "を":["o","wo"], "ん":["n","n"],
    "が":["ga","ga"], "ぎ":["gi","gi"], "ぐ":["gu","gu"], "げ":["ge","ge"], "ご":["go","go"],
    "ざ":["za","za"], "じ":["ji","zi"], "ず":["zu","zu"], "ぜ":["ze","ze"], "ぞ":["zo","zo"],
    "だ":["da","da"], "ぢ":["ji","zi"], "づ":["zu","zu"], "で":["de","de"], "ど":["do","do"],
    "ば":["ba","ba"], "び":["bi","bi"], "ぶ":["bu","bu"], "べ":["be","be"], "ぼ":["bo","bo"],
    "ぱ":["pa","pa"], "ぴ":["pi","pi"], "ぷ":["pu","pu"], "ぺ":["pe","pe"], "ぽ":["po","po"],
    "ゔ":["vu","vu"],
    "ぁ":["a","a"], "ぃ":["i","i"], "ぅ":["u","u"], "ぇ":["e","e"], "ぉ":["o","o"],
    "ー":["",""], "、":["、","、"], "。":["。","。"], " ":[" "," "], "　":[" "," "]
  };

  function toHiragana(s) {
    return s.replace(/[\\u30A1-\\u30F6]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0x60);
    });
  }

  function convert(src, idx) {
    var s = toHiragana(src);
    var out = "";
    var i = 0;
    while (i < s.length) {
      var two = s.substr(i, 2);
      var one = s.charAt(i);

      // 促音「っ」は次の子音を重ねる（ヘボン式の ch は t にする）
      if (one === "っ") {
        var nextTwo = s.substr(i + 1, 2);
        var nextRome = (YOUON[nextTwo] && YOUON[nextTwo][idx]) ||
          (KANA[s.charAt(i + 1)] && KANA[s.charAt(i + 1)][idx]) || "";
        if (nextRome) {
          var c = nextRome.charAt(0);
          out += (idx === 0 && nextRome.indexOf("ch") === 0) ? "t" : c;
        }
        i++;
        continue;
      }

      if (YOUON[two]) {
        out += YOUON[two][idx];
        i += 2;
        continue;
      }
      if (KANA[one]) {
        var r = KANA[one][idx];
        // 「ん」の後ろが b/m/p ならヘボン式では m と書く
        if (one === "ん" && idx === 0) {
          var after = s.substr(i + 1, 2);
          var afterRome = (YOUON[after] && YOUON[after][0]) ||
            (KANA[s.charAt(i + 1)] && KANA[s.charAt(i + 1)][0]) || "";
          if (/^[bmp]/.test(afterRome)) r = "m";
        }
        out += r;
        i++;
        continue;
      }
      // 変換できない文字（漢字・英数字など）はそのまま残す
      out += one;
      i++;
    }
    return out;
  }

  // パスポートのヘボン式では長音を表記しない（さとう → SATO）。
  // ただし「えい」は EI のまま、「いい」は II のまま残す。
  // 「まつうら」のように長音でない ou/uu もあるため、利用者が選べるようにしている。
  function dropLong(s) {
    return s
      .replace(/ou/g, "o")
      .replace(/oo/g, "o")
      .replace(/uu/g, "u");
  }

  function applyCase(s) {
    var f = ST.pick("fmt");
    if (f === "upper") return s.toUpperCase();
    if (f === "capital") {
      return s.replace(/(^|\\s)([a-z])/g, function (m, sp, c) {
        return sp + c.toUpperCase();
      });
    }
    return s;
  }

  ST.live(function () {
    var src = ST.$("src").value;
    var drop = ST.$("noLong").checked;
    var hepRaw = convert(src, 0);
    var hep = applyCase(drop ? dropLong(hepRaw) : hepRaw);
    var kun = applyCase(convert(src, 1));

    ST.set("hepburnVal", hep || "-");
    ST.set("kunreiVal", kun || "-");
    ST.set("lenVal", ST.num(hep.replace(/\\s/g, "").length, 0) + " 文字");

    var hasKanji = /[\\u4E00-\\u9FFF]/.test(src);
    ST.set("detail", hasKanji
      ? "漢字が含まれています。漢字は変換されないため、読みがな（ひらがな）で入力してください。"
      : (drop
        ? "長音を省略した表記です。ただし「まつうら（松浦）」のように長音ではない ou・uu も短縮されてしまうため、その場合は手動で戻してください。"
        : "パスポートの氏名では長音（伸ばす音）を書かないのが原則です。上のチェックを入れると省略した表記になります。"));
  });

  ST.$("copyHepburn").addEventListener("click", function (e) {
    ST.copy(ST.$("hepburnVal").textContent, e.currentTarget);
  });
  ST.$("copyKunrei").addEventListener("click", function (e) {
    ST.copy(ST.$("kunreiVal").textContent, e.currentTarget);
  });
})();
`,

  intro: `
ひらがな・カタカナをローマ字に変換します。**パスポートで使うヘボン式**と、学校で習う訓令式の両方を同時に表示します。
`,

  guide: `
## ヘボン式と訓令式

日本語のローマ字表記には主に2つの方式があります。

| かな | ヘボン式 | 訓令式 |
|---|---|---|
| し | **shi** | si |
| ち | **chi** | ti |
| つ | **tsu** | tu |
| ふ | **fu** | hu |
| じ | **ji** | zi |
| しゃ | **sha** | sya |
| ちょ | **cho** | tyo |

- **ヘボン式**: 英語話者が発音しやすい表記。**パスポート、道路標識、駅名**などで使われます
- **訓令式**: 日本語の五十音の規則性を重視した表記。学校の国語で習います

日常で目にするのはほとんどヘボン式です。パスポートの氏名は原則としてヘボン式で表記します。

## パスポートで特に注意する点

### 長音（伸ばす音）は書かない

これが最も間違えやすい部分です。

| 名前 | パスポート表記 |
|---|---|
| こうた | **KOTA**（KOUTA ではない） |
| ゆうき | **YUKI**（YUUKI ではない） |
| おおの | **ONO**（OONO ではない） |
| さいとう | **SAITO**（SAITOU ではない） |

「う」や「お」を重ねて長音を表す部分は、原則として書きません。

ただし、**「OH」を使った表記は申請すれば認められます**（大野→OHNO、太田→OHTA）。一度この表記で作ると原則として変更できないため、家族や既存の書類との統一を考えて決めてください。

なお、「えい」は例外です。「けいこ」は KEIKO と表記し、i を残します。

### 「ん」の後ろが b・m・p のとき

ヘボン式では **n ではなく m** と書きます。

- なんば → **NAMBA**
- ほんま → **HOMMA**
- しんぶん → **SHIMBUN**

ただしパスポートでは、**N でも M でも申請できます**（外務省が両方を認めています）。クレジットカードや航空券の名義と揃えるほうが、渡航時のトラブルを避けられます。

### 促音「っ」

次の子音を重ねます。

- はっとり → **HATTORI**
- さっぽろ → **SAPPORO**

ただし ch の前の促音は c ではなく **t** で表します（はっちょう → **HATCHO**、まっちゃ → **MATCHA**）。

## そのほかの表記の違い

| 場面 | よく使われる方式 |
|---|---|
| パスポート | ヘボン式（長音を書かない） |
| 道路標識 | ヘボン式 |
| 駅名 | ヘボン式（長音記号 ō を使うことも） |
| 学校の国語 | 訓令式 |
| パソコンのローマ字入力 | どちらも受け付ける |
| 学術論文 | ヘボン式（長音は ō や ô で表記） |

同じ「東京」でも、パスポートでは TOKYO、学術表記では Tōkyō と書き分けられます。

## 変換できないもの

このツールは **かなをローマ字に変換する** だけで、漢字の読み方は判断できません。「東」が「ひがし」か「あずま」か「とう」かは文脈によるためです。

漢字を含む名前を変換する場合は、まず読みがなをひらがなで入力してください。

## 名前の順序

パスポートでは **姓（Surname）と名（Given name）が別の欄** に分かれているため、順序で迷うことはありません。

一方、英文の書類やメールの署名では、

- **Ryoma Okuda**（名→姓）: 英語圏の慣習に合わせた形
- **OKUDA Ryoma**（姓→名）: 姓を大文字にして区別する形。近年は日本政府もこの表記を推奨

政府は2020年から、公文書で「姓→名」の順とし、姓を大文字で書く方式を推奨しています。ただしビジネスの慣習では「名→姓」も広く使われており、相手や場面に合わせて選んで構いません。
`,

  faq: [
    {
      q: "パスポートの名前はヘボン式と訓令式のどちらですか？",
      a: "ヘボン式です。「し」は shi、「ち」は chi、「つ」は tsu と表記します。訓令式（si・ti・tu）は学校で習う方式で、パスポートには使いません。",
    },
    {
      q: "「こうた」はKOTAとKOUTAのどちらですか？",
      a: "KOTAです。パスポートでは長音（伸ばす音）を書かないのが原則で、「う」は表記しません。ただし「OH」を使った表記（例: 大野→OHNO）は申請すれば認められます。",
    },
    {
      q: "「なんば」はNAMBAとNANBAのどちらですか？",
      a: "ヘボン式の原則ではNAMBAです（b・m・pの前は m）。ただしパスポートではどちらでも申請できます。クレジットカードや航空券の名義と揃えることをおすすめします。",
    },
    {
      q: "漢字の名前を入力できますか？",
      a: "できません。漢字の読み方は文脈によって変わるため、このツールでは判断できません。読みがなをひらがなで入力してください。",
    },
    {
      q: "英文の署名は姓と名のどちらを先に書きますか？",
      a: "どちらでも構いません。日本政府は2020年から「姓→名」の順で姓を大文字にする表記（OKUDA Ryoma）を推奨していますが、ビジネスの場では「名→姓」（Ryoma Okuda）も広く使われています。",
    },
  ],
};
