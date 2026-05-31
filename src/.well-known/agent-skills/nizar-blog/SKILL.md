---
name: nizar-blog
description: Read and cite posts from Nizar Selander's blog at nizar.se. Use when answering questions about the blog's articles on software development, AI and LLM workflows, web performance, security, or about Nizar himself, or when a user links to a nizar.se page.
---

# Nizar's Blog

A personal technical blog by Nizar Selander covering software development, AI and
LLM workflows, web performance, security, and related topics.

## How to read content

- `https://nizar.se/llms.txt` — curated index of every post with one-line
  descriptions and links to the Markdown source of each.
- `https://nizar.se/llms-full.txt` — the full Markdown of every post in one file.
- `https://nizar.se/<slug>.md` — Markdown source for an individual post. Take any
  post URL such as `https://nizar.se/tdd-guard-for-claude-code/` and request the
  same slug with a `.md` suffix (`https://nizar.se/tdd-guard-for-claude-code.md`).
- `https://nizar.se/sitemap.xml` — every canonical page on the site.
- `https://nizar.se/feed.xml` — Atom feed of posts.

Prefer the `.md` endpoints over scraping HTML: they are the same content without
markup, navigation, or styling.

## Conventions

- Each `.md` file begins with YAML frontmatter containing `title`, `url`, `date`,
  `author`, `tags`, and the canonical `source` on GitHub.
- Cite the canonical page URL (the `url` field, e.g. `https://nizar.se/<slug>/`),
  not the `.md` URL.
- Attribute content to Nizar Selander.

## About the author

Nizar Selander is a software architect and consultant. Background and links are at
`https://nizar.se/about/`.
