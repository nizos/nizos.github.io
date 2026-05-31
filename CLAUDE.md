# CLAUDE.md

Personal technical blog by Nizar covering software development, AI/LLM workflows, web performance,
security, and emerging technologies. Target audience: developers and technical professionals
interested in practical engineering insights and automation.

Built with Eleventy (11ty v2.0) and Liquid templating. Deployed to GitHub Pages at nizar.se (via
CNAME).

## Overview

### Content & Publishing

- `draft: true` - Excludes post from builds
- `featured: true` - Shows on homepage
- `tags: []` - Auto-generates `/tags/` and `/tags/{tag-name}/` pages
- Automatic responsive images via eleventy-img
- Open Graph, social images, and SEO metadata

### Security & Analytics

- Strict CSP in `base.liquid`
- SRI for script integrity
- Plausible Analytics (self-hosted script)

### Agent Readiness

Machine-readable endpoints for LLMs/agents (see specification.website/spec/agent-readiness):

- `/llms.txt` (`src/llms.liquid`) - Curated index of posts linking to their `.md` source
- `/llms-full.txt` (`src/llms-full.liquid`) - Full Markdown of every post in one file
- `/{slug}.md` (`src/posts-markdown.liquid`) - Per-post Markdown source; `rawMarkdown` filter
  strips frontmatter and Liquid `{% raw %}` tags
- `/sitemap.xml` (`src/sitemap.njk`, `sitemap` collection) - Canonical HTML pages
- `/robots.txt` (`src/assets/static/`) - Allows all crawlers; points to sitemap
- JSON-LD in `base.liquid` - BlogPosting (posts), ProfilePage (`/about/`), WebSite (else)
- Discovery `<link>` elements in `base.liquid` (`describedby`, `sitemap`, markdown `alternate`)
- `/.well-known/agent-skills/` - Skills index (`src/agent-skills-index.liquid`, digest via
  `sha256File`) and `SKILL.md` (passthrough-copied from `src/.well-known/`)

When changing `SKILL.md`, the `index.json` digest is recomputed automatically at build.

## Project Structure

- `.eleventy.js` - Main config (image processing, collections, filters, plugins)
- `src/posts/` - Blog content (Markdown with frontmatter)
- `src/_includes/` - Liquid templates
- `src/_data/site.json` - Global site metadata
- `src/uploads/` - Media assets
- `_site/` - Build output (gitignored)

## Commands

- `npm run dev` - Development server (localhost:8080)
- `npm run build` - Build to `_site/`
- `npm run clean` - Clean build directory
- `npm run format` - Prettier formatting
