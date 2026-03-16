---
layout: page
title: Authors
icon: fas fa-feather-alt
order: 5
excerpt_separator: ""
image: /assets/img/customengine.png
---

<div class="authors-grid">
{% assign posts_by_author = site.posts | group_by: "author" | sort: "name" %}
{% for author in posts_by_author %}
{% assign author_data = site.data.authors[author.name] %}

<div class="author-card" id="{{ author.name }}">
  <div class="author-header">
    {% if author_data.avatar %}
    <img src="{{ author_data.avatar }}" alt="{{ author_data.name }}" class="author-avatar">
    {% endif %}
    <div class="author-info">
      <h2>{{ author_data.name }}</h2>
      <span class="post-count">{{ author.items.size }} post{% if author.items.size != 1 %}s{% endif %}</span>
    </div>
  </div>
  <ul class="author-posts">
    {% for post in author.items %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <time>{{ post.date | date: "%b %d, %Y" }}</time>
    </li>
    {% endfor %}
  </ul>
</div>

{% endfor %}
</div>

<style>
.authors-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.author-card {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid var(--card-border-color, #e9ecef);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.author-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.author-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--card-border-color, #e9ecef);
}

.author-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s ease;
}

.author-card:hover .author-avatar {
  transform: scale(1.05);
}

.author-info h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.35rem;
  font-weight: 600;
}

.author-info .post-count {
  color: var(--text-muted-color, #6c757d);
  font-size: 0.875rem;
}

.author-posts {
  list-style: none;
  padding: 0;
  margin: 0;
}

.author-posts li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--card-border-color, #f0f0f0);
  gap: 1rem;
}

.author-posts li:last-child {
  border-bottom: none;
}

.author-posts li a {
  flex: 1;
  color: var(--link-color, #0078d4);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.author-posts li a:hover {
  color: var(--link-hover-color, #005a9e);
  text-decoration: underline;
}

.author-posts li time {
  color: var(--text-muted-color, #868e96);
  font-size: 0.8rem;
  white-space: nowrap;
}

/* Dark mode */
html[data-mode="dark"] .author-card {
  background: #1e1e1e;
  border-color: #333;
}

html[data-mode="dark"] .author-header {
  border-color: #333;
}

html[data-mode="dark"] .author-avatar {
  border-color: #333;
}

html[data-mode="dark"] .author-posts li {
  border-color: #2a2a2a;
}

@media (prefers-color-scheme: dark) {
  html:not([data-mode="light"]) .author-card {
    background: #1e1e1e;
    border-color: #333;
  }

  html:not([data-mode="light"]) .author-header {
    border-color: #333;
  }

  html:not([data-mode="light"]) .author-avatar {
    border-color: #333;
  }

  html:not([data-mode="light"]) .author-posts li {
    border-color: #2a2a2a;
  }
}
</style>
