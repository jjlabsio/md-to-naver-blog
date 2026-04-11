import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convert } from "@jjlabsio/md-to-naver-blog";

function generatePreviewHtml(
  title: string,
  html: string,
  tags: string[],
): string {
  const tagsStr = tags.map((t) => `#${t}`).join(" ");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mtnb preview — ${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 24px; color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .header svg { width: 24px; height: 24px; }
    .header h1 { font-size: 18px; font-weight: 600; }
    .field { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .field-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .field-label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .copy-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border: 1px solid #e2e8f0; background: #fff; color: #334155;
      border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
      transition: all 0.15s;
    }
    .copy-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
    .copy-btn.copied { background: #f0fdf4; border-color: #86efac; color: #166534; }
    .copy-btn svg { width: 14px; height: 14px; }
    .field-content { font-size: 15px; line-height: 1.6; }
    .preview-body { border: 1px solid #f1f5f9; border-radius: 4px; padding: 16px; max-height: 600px; overflow-y: auto; }
    .tags { font-size: 15px; color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>mtnb preview</h1>
    </div>

    <div class="field">
      <div class="field-header">
        <span class="field-label">제목</span>
        <button class="copy-btn" data-copy-target="title-content">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          복사
        </button>
      </div>
      <div class="field-content" id="title-content">${title}</div>
    </div>

    <div class="field">
      <div class="field-header">
        <span class="field-label">본문</span>
        <button class="copy-btn" id="copy-html-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          서식 복사
        </button>
      </div>
      <div class="preview-body" id="body-content">${html}</div>
    </div>

${
  tags.length > 0
    ? `    <div class="field">
      <div class="field-header">
        <span class="field-label">태그</span>
        <button class="copy-btn" data-copy-target="tags-content">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          복사
        </button>
      </div>
      <div class="field-content tags" id="tags-content">${tagsStr}</div>
    </div>`
    : ""
}
  </div>

  <script>
    var checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    var copySvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

    async function copyHtml(btn) {
      var el = document.getElementById('body-content');
      var html = el.innerHTML;
      var blob = new Blob([html], { type: 'text/html' });
      var item = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([item]);
      showCopied(btn, '서식 복사');
    }

    async function copyText(btn) {
      var targetId = btn.getAttribute('data-copy-target');
      var el = document.getElementById(targetId);
      var text = el.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showCopied(btn, '복사');
    }

    document.getElementById('copy-html-btn').addEventListener('click', function() { copyHtml(this); });
    document.querySelectorAll('[data-copy-target]').forEach(function(btn) {
      btn.addEventListener('click', function() { copyText(this); });
    });

    function showCopied(btn, originalLabel) {
      btn.innerHTML = checkSvg + ' 복사됨';
      btn.classList.add('copied');
      setTimeout(function() {
        btn.innerHTML = copySvg + ' ' + originalLabel;
        btn.classList.remove('copied');
      }, 2000);
    }
  </script>
</body>
</html>`;
}

function printUsage(): void {
  process.stdout.write(`Usage: mtnb preview <file.md>

마크다운 파일을 변환하고 브라우저에서 미리보기를 엽니다.
제목, 본문, 태그를 각각 복사할 수 있습니다.
`);
}

const args = process.argv.slice(2);
const command = args[0];

if (command !== "preview" || args.length < 2) {
  printUsage();
  process.exit(command === "preview" ? 1 : 0);
}

const filePath = resolve(args[1]);
const markdown = readFileSync(filePath, "utf-8");
const result = convert(markdown);
const tags = Array.isArray(result.frontmatter.tags)
  ? (result.frontmatter.tags as string[])
  : [];

const previewHtml = generatePreviewHtml(result.title, result.html, tags);
const tmpPath = join(tmpdir(), `mtnb-preview-${Date.now()}.html`);
writeFileSync(tmpPath, previewHtml, "utf-8");

execSync(`open ${tmpPath}`);
process.stdout.write(`미리보기가 브라우저에서 열렸습니다: ${tmpPath}\n`);
