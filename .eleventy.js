const Image = require('@11ty/eleventy-img')
const timeToRead = require('eleventy-plugin-time-to-read')
const pluginRss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const markdownIt = require('markdown-it')
const { DateTime } = require('luxon')
const fs = require('fs')
const crypto = require('crypto')

const WIDTHS = [300, 600, 750, 900, 1200]
const FORMATS = ['avif', 'jpeg']
const SIZES = '(min-width: 750px) 750px, 80vw'
const OUTPUT_DIR = './_site/img/'
const URL_PATH = '/img/'

async function imageShortcode(src, alt, loading = 'lazy') {
  let imageSrc = `src${src}`
  let metadata = await Image(imageSrc, {
    widths: WIDTHS,
    formats: FORMATS,
    outputDir: OUTPUT_DIR,
    urlPath: URL_PATH,
  })

  let imageAttributes = {
    alt,
    sizes: SIZES,
    loading,
    decoding: 'async',
  }

  return Image.generateHTML(metadata, imageAttributes)
}

function customImageGenerator(src, alt) {
  // Do not process animated gifs and scalable vectors
  if (src.endsWith('.gif') || src.endsWith('.svg')) {
    return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`
  }

  // Generate responsive image for other formats
  const imagePath = `src${src}`
  const options = {
    widths: WIDTHS,
    formats: FORMATS,
    outputDir: OUTPUT_DIR,
    urlPath: URL_PATH,
  }

  Image(imagePath, options)

  const imageAttributes = {
    alt,
    sizes: SIZES,
    loading: 'lazy',
    decoding: 'async',
  }

  const metadata = Image.statsSync(imagePath, options)
  return Image.generateHTML(metadata, imageAttributes)
}

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(timeToRead, {
    speed: '250 words per minute',
    output: function (data) {
      return data.timing
    },
  })
  eleventyConfig.addPlugin(pluginRss)
  eleventyConfig.addPlugin(syntaxHighlight)

  // Shortcodes
  eleventyConfig.addAsyncShortcode('image', imageShortcode)

  // Markdown
  const markdownLibrary = markdownIt({
    html: true,
    linkify: true,
  })

  markdownLibrary.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]
    const src = token.attrGet('src')
    const alt = token.content
    return customImageGenerator(src, alt)
  }

  eleventyConfig.setLibrary('md', markdownLibrary)

  // Filters
  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy')
  })

  eleventyConfig.addFilter('postTags', (tags) => {
    const excludeList = ['post', 'posts']
    return tags
      .toString()
      .split(',')
      .filter((tag) => {
        return !excludeList.includes(tag)
      })
  })

  eleventyConfig.addFilter('excerpt', (post) => {
    const content = post.replace(/(<([^>]+)>)/gi, '')
    return content.substr(0, content.lastIndexOf(' ', 200)) + '...'
  })

  eleventyConfig.addFilter('filterByTag', function (posts, tag) {
    return posts.filter((post) => post.data.tags && post.data.tags.includes(tag))
  })

  // Machine-readable date (YYYY-MM-DD) for structured data and markdown endpoints
  eleventyConfig.addFilter('isoDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISODate()
  })

  // JSON-safe stringification for embedding values in JSON-LD
  eleventyConfig.addFilter('jsonString', (value) => JSON.stringify(value ?? null))

  // Read a post's Markdown source, stripping frontmatter and Liquid raw tags so
  // the served .md is clean, fully-rendered Markdown with no template syntax.
  eleventyConfig.addFilter('rawMarkdown', (inputPath) => {
    const raw = fs.readFileSync(inputPath, 'utf8')
    return raw
      .replace(/^---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)\r?\n/, '')
      .replace(/\{%-?\s*(end)?raw\s*-?%\}/g, '')
      .trim()
  })

  // SHA-256 digest of a file on disk, for the Agent Skills discovery index
  eleventyConfig.addFilter('sha256File', (path) => {
    const buf = fs.readFileSync(path)
    return 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex')
  })

  // Collections
  eleventyConfig.addCollection('tagList', function (collectionApi) {
    const tagSet = new Set()
    collectionApi.getAll().forEach((item) => {
      if (!item.data.draft && 'tags' in item.data) {
        let tags = item.data.tags
        tags = tags.filter((tag) => !['all', 'nav', 'post', 'posts'].includes(tag))
        for (const tag of tags) {
          tagSet.add(tag)
        }
      }
    })
    return [...tagSet].sort()
  })

  eleventyConfig.addCollection('posts', function (collection) {
    return collection.getFilteredByGlob('src/posts/**/*.md').filter(function (item) {
      // Exclude items with 'draft: true' in their front matter.
      return !item.data.draft
    })
  })

  // All canonical HTML pages (home, about, posts, tag pages) for the sitemap.
  // Generated .md/.txt/.json/.xml endpoints do not have a trailing-slash URL.
  eleventyConfig.addCollection('sitemap', function (collection) {
    return collection
      .getAll()
      .filter((item) => !item.data.draft && typeof item.url === 'string' && item.url.endsWith('/'))
  })

  eleventyConfig.addPassthroughCopy('src/assets/images')
  eleventyConfig.addPassthroughCopy('src/uploads')
  eleventyConfig.addPassthroughCopy('src/assets/css')
  eleventyConfig.addPassthroughCopy({ 'src/assets/static': '.' })
  eleventyConfig.addPassthroughCopy('src/CNAME')

  // Agent Skills files are copied verbatim; the SKILL.md must not be processed
  // as a template (the index.json with its digest is generated separately).
  eleventyConfig.addPassthroughCopy('src/.well-known')
  eleventyConfig.ignores.add('src/.well-known/**/*.md')

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
  }
}
