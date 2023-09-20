const Image = require('@11ty/eleventy-img');
const timeToRead = require('eleventy-plugin-time-to-read');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const { DateTime } = require('luxon');
const path = require("node:path");

async function imageShortcode(src, alt, sizes = "100vw") {
    let imageSrc = `${path.dirname(this.page.inputPath)}/${src}`;
    let metadata = await Image(imageSrc, {
        widths: [300, 600, 750, 900, 1200, 1400],
        formats: ["avif", "jpeg"],
        outputDir: path.dirname(this.page.outputPath),
        urlPath: this.page.url,
    });

    let imageAttributes = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function(eleventyConfig) {
    // Plugins
    eleventyConfig.addPlugin(timeToRead, {speed: '250 words per minute',output: function(data) {return data.timing}});
    eleventyConfig.addPlugin(pluginRss);
    eleventyConfig.addPlugin(syntaxHighlight);

    // Shortcodes
    eleventyConfig.addAsyncShortcode("image", imageShortcode);

    // Filters
    eleventyConfig.addFilter('readableDate', (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: 'utc'}).toFormat('dd LLL yyyy');
    });

    eleventyConfig.addFilter('postTags', (tags) => {
        const excludeList = ['post', 'posts'];
        return tags.toString().split(',').filter((tag) => {
            return !excludeList.includes(tag);
        });
    });

    eleventyConfig.addFilter('excerpt', (post) => {
        const content = post.replace(/(<([^>]+)>)/gi, '');
        return content.substr(0, content.lastIndexOf(' ', 200)) + '...';
    });

    eleventyConfig.addCollection("posts", function(collection) {
        return collection.getFilteredByGlob("src/posts/**/*.md").filter(function(item) {
            // Exclude items with 'draft: true' in their front matter.
            return !item.data.draft;
        });
    });

    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("src/CNAME");

    return {
        dir: {
            input: 'src',
            output: 'docs',
            includes: 'includes',
            data: 'data',
            layouts: 'layouts'
        },
    }
}
