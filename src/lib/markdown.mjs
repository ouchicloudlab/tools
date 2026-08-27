// =============================================================
//  最小構成の Markdown レンダラ
//  外部依存を持たないため npm install なしでビルドできる。
//  対応: 見出し / 段落 / 箇条書き / 番号付き / 表 / 引用 /
//        強調 / インラインコード / リンク / 水平線
// =============================================================

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// インライン要素。コードだけ先に退避して、他の記法が中に効かないようにする。
function inline(src) {
  const codes = [];
  let s = String(src).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });

  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const external = /^https?:\/\//.test(href);
    const attr = external ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${href}"${attr}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

// 表の1行 "| a | b |" をセル配列に変換する。
function splitRow(line) {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function md(src = "") {
  const lines = String(src).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;

  const isTableSep = (l) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes("-");

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (!line.trim()) {
      i++;
      continue;
    }

    // 水平線
    if (/^\s*---+\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // 見出し
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // 表
    if (line.trim().startsWith("|") && isTableSep(lines[i + 1] || "")) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head
          .map((c) => `<th>${inline(c)}</th>`)
          .join("")}</tr></thead><tbody>${rows
          .map(
            (r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`
          )
          .join("")}</tbody></table></div>`
      );
      continue;
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${md(buf.join("\n"))}</blockquote>`);
      continue;
    }

    // 箇条書き
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push(`<ul>${buf.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`);
      continue;
    }

    // 番号付き
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push(`<ol>${buf.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`);
      continue;
    }

    // 生HTMLはそのまま通す
    if (/^\s*</.test(line)) {
      out.push(line);
      i++;
      continue;
    }

    // 段落（空行まで）
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(#{2,4}\s|[-*]\s|\d+\.\s|>|\||<)/.test(lines[i]) &&
      !/^\s*---+\s*$/.test(lines[i])
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    if (buf.length) out.push(`<p>${inline(buf.join(" "))}</p>`);
  }

  return out.join("\n");
}

export { esc };
