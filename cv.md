---
layout: default
title: CV
permalink: /cv/
class: research   # reuse the wide layout and font from the Research page
---
<!-- To update: replace assets/files/cv.pdf with your new CV (same file name). -->
{% assign cv = '/assets/files/cv.pdf' | relative_url %}

# Curriculum vitae

<p class="cv-actions">
  <a href="{{ cv }}" download>Download PDF</a>
  <a href="{{ cv }}" target="_blank" rel="noopener">Open in new tab</a>
</p>

<!-- PDF pages are drawn here by the script below. Without JavaScript, the link shows instead. -->
<div id="cv-pages" class="cv-pages" data-src="{{ cv }}">
  <noscript><p><a href="{{ cv }}">Open the PDF</a></p></noscript>
</div>

<script type="module">
  // Draws each page of the CV with PDF.js, so it can be styled to match the site.
  // The dark look comes from CSS (.cv-pages canvas in style.css).
  const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
  const box = document.getElementById('cv-pages');

  try {
    const pdfjs = await import(PDFJS + 'pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
    const doc = await pdfjs.getDocument(box.dataset.src).promise;

    // Render all pages at the box's current width (sharp on high-DPI screens)
    async function render() {
      box.replaceChildren();
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const scale = box.clientWidth / page.getViewport({ scale: 1 }).width * devicePixelRatio;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        box.append(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }
    }

    // Re-render when the width changes (debounced)
    let width = 0, timer;
    new ResizeObserver(() => {
      if (box.clientWidth === width) return;
      width = box.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(render, 200);
    }).observe(box);
  } catch (err) {
    box.innerHTML = `<p>Couldn't display the CV here. <a href="${box.dataset.src}">Open the PDF</a> instead.</p>`;
  }
</script>
