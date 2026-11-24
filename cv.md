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

<!-- Embedded viewer; browsers that can't show PDFs inline get the fallback link -->
<object class="cv-frame" data="{{ cv }}#view=FitH" type="application/pdf">
  <p>Your browser can't show the PDF here. <a href="{{ cv }}">Open the PDF</a> instead.</p>
</object>
