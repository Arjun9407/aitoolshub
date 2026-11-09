// Tiny, safe Markdown renderer: input is HTML-escaped first, then a small set of syntax is converted.
export function renderMarkdown(src) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = src.split("\n");
  let html = "";
  let list = null;
  const close = () => {
    if (list) {
      html += `</${list}>`;
      list = null;
    }
  };
  lines.forEach((ln) => {
    let m;
    if ((m = /^(#{1,4})\s+(.*)/.exec(ln))) {
      close();
      html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
    } else if ((m = /^\s*[-*]\s+(.*)/.exec(ln))) {
      if (list !== "ul") {
        close();
        html += "<ul>";
        list = "ul";
      }
      html += `<li>${inline(m[1])}</li>`;
    } else if ((m = /^\s*\d+\.\s+(.*)/.exec(ln))) {
      if (list !== "ol") {
        close();
        html += "<ol>";
        list = "ol";
      }
      html += `<li>${inline(m[1])}</li>`;
    } else if ((m = /^>\s?(.*)/.exec(ln))) {
      close();
      html += `<blockquote>${inline(m[1])}</blockquote>`;
    } else if (!ln.trim()) close();
    else {
      close();
      html += `<p>${inline(ln)}</p>`;
    }
  });
  close();
  return html;
}
