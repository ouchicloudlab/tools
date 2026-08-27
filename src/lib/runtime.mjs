// =============================================================
//  全ページに埋め込む共通ランタイム（ブラウザ側で動く JS）
//  各ツールのスクリプトから window.ST.* として使う。
//  ここに寄せることで、丸め誤差や数値整形の実装が
//  ツールごとにばらつくのを防ぐ。
// =============================================================

export const runtimeScript = `
window.ST = (function () {
  // --- 浮動小数点の誤差をならす -------------------------------
  // 1100 / 1.1 は 999.9999999999999 になる。これをそのまま
  // 切り捨てると 999 になってしまうため、有効桁で丸めてから扱う。
  function fix(n) {
    if (!isFinite(n)) return 0;
    return Math.round(n * 1e9) / 1e9;
  }

  // --- 入力値を数値にする（空欄・不正値は def） ----------------
  function n(v, def) {
    if (v && v.value !== undefined) v = v.value;
    var x = Number(String(v == null ? "" : v).replace(/[,\\s]/g, ""));
    return isFinite(x) ? x : (def === undefined ? 0 : def);
  }

  // --- 端数処理 -----------------------------------------------
  // mode: floor / ceil / round / none（none は小数2桁まで残す）
  function round(v, mode) {
    var x = fix(v);
    if (mode === "floor") return Math.floor(x);
    if (mode === "ceil") return Math.ceil(x);
    if (mode === "round") return Math.round(x);
    return Math.round(x * 100) / 100;
  }

  // --- 桁区切りの数値表記 --------------------------------------
  function num(v, digits) {
    var x = fix(v);
    if (!isFinite(x)) return "-";
    return x.toLocaleString("ja-JP", {
      maximumFractionDigits: digits === undefined ? 2 : digits,
    });
  }

  function yen(v, digits) {
    return num(v, digits) + "円";
  }

  // --- DOM ヘルパ ----------------------------------------------
  function $(id) { return document.getElementById(id); }

  function pick(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function set(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  // ツールパネル内のあらゆる入力変化で calc を呼ぶ。
  // 初回も1度実行して、開いた時点で結果が出ている状態にする。
  function live(calc) {
    var root = document.querySelector(".tool");
    if (!root) return;
    ["input", "change"].forEach(function (ev) {
      root.addEventListener(ev, function () {
        try { calc(); } catch (e) { console.error(e); }
      });
    });
    try { calc(); } catch (e) { console.error(e); }
  }

  // --- クリップボードにコピー ----------------------------------
  function copy(text, btn) {
    var done = function () {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = "コピーしました";
      setTimeout(function () { btn.textContent = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  return { fix: fix, n: n, round: round, num: num, yen: yen,
           $: $, pick: pick, set: set, live: live, copy: copy };
})();
`;
