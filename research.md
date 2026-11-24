---
layout: default
title: Research
permalink: /research/
class: research   # wider layout + Proxima Nova / Figtree (see style.css)
---
<p class="eyebrow">Research</p>

# First-author <em>papers</em>

<p class="lead">I study runaway stars, and especially the white dwarfs flung out at extreme speeds when their companion explodes.</p>

<!-- Papers come from _data/papers.yml; edit that file to add or change entries. -->
<ol class="papers">
{% for p in site.data.papers %}
  <li class="paper">
    <div class="paper-side">
      <div class="paper-meta">{{ p.year }}<br>{{ p.journal }}</div>
      <div class="paper-links">
        <a href="https://arxiv.org/abs/{{ p.arxiv }}">arXiv</a>
        <a href="{{ p.ads }}">ADS</a>
        <a href="https://doi.org/{{ p.doi }}">DOI</a>
        {% if p.project %}<a class="project" href="{{ p.project | relative_url }}">Project</a>{% endif %}
      </div>
    </div>
    <div class="paper-body">
    <h3><a href="https://doi.org/{{ p.doi }}">{{ p.title }}</a></h3>
    <p class="paper-authors">{{ p.authors }}</p>
    <p>{{ p.summary }}</p>
    <ul class="tags">{% for t in p.tags %}<li>{{ t }}</li>{% endfor %}</ul>
    </div>
  </li>
{% endfor %}
</ol>

<p class="paper-note">Full publication list on <a href="https://scixplorer.org/">SciX / ADS</a>.</p>
