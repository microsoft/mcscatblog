---
layout: page
title: Authors
icon: fas fa-feather-alt
order: 5
excerpt_separator: ""
image: /assets/img/customengine.png
---

<div class="authors-grid">
{% comment %}
  Build a deduplicated list of author keys from all posts.
  Handles both single-author (string) and multi-author (array) front matter.
{% endcomment %}
{% assign all_author_keys = "" %}
{% for post in site.posts %}
  {% if post.author %}
    {% assign post_authors = post.author %}
  {% elsif post.authors %}
    {% assign post_authors = post.authors %}
  {% else %}
    {% continue %}
  {% endif %}
  {% if post_authors.first %}
    {% for a in post_authors %}
      {% assign all_author_keys = all_author_keys | append: a | append: "," %}
    {% endfor %}
  {% else %}
    {% assign all_author_keys = all_author_keys | append: post_authors | append: "," %}
  {% endif %}
{% endfor %}
{% assign author_list = all_author_keys | split: "," | uniq | sort %}

{% for author_key in author_list %}
{% if author_key == "" %}{% continue %}{% endif %}
{% assign author_data = site.data.authors[author_key] %}
{% unless author_data %}{% continue %}{% endunless %}

{% comment %} Collect posts for this author {% endcomment %}
{% assign author_posts = "" | split: "" %}
{% for post in site.posts %}
  {% if post.author %}
    {% assign post_authors = post.author %}
  {% elsif post.authors %}
    {% assign post_authors = post.authors %}
  {% else %}
    {% continue %}
  {% endif %}
  {% if post_authors.first %}
    {% if post_authors contains author_key %}
      {% assign author_posts = author_posts | push: post %}
    {% endif %}
  {% else %}
    {% if post_authors == author_key %}
      {% assign author_posts = author_posts | push: post %}
    {% endif %}
  {% endif %}
{% endfor %}

{% assign post_count = author_posts.size %}
{% if post_count == 0 %}{% continue %}{% endif %}

<div class="author-card" id="{{ author_key }}">
  <div class="author-header">
    {% if author_data.avatar %}
    <img src="{{ author_data.avatar }}" alt="{{ author_data.name }}" class="author-avatar">
    {% endif %}
    <div class="author-info">
      <h2>{{ author_data.name }}</h2>
      <span class="post-count">{{ post_count }} post{% if post_count != 1 %}s{% endif %}</span>
    </div>
  </div>
  <ul class="author-posts">
    {% for post in author_posts %}
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
