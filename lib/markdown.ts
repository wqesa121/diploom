export function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  const inline = (value: string) =>
    value
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${inline(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${inline(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${inline(line.replace(/^#\s+/, ""))}</h1>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(`<p>${inline(line)}</p>`);
  }

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
}
