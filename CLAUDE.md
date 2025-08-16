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
