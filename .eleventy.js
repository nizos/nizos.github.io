const Image = require('@11ty/eleventy-img');
const timeToRead = require('eleventy-plugin-time-to-read');
const { DateTime } = require('luxon');
const path = require("node:path");

async function imageShortcode(src, alt, sizes) {
    let imageSrc = `${path.dirname(this.page.inputPath)}/${src}`;
    let metadata = await Image(imageSrc, {
        widths: [300, 600, 900],
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
    eleventyConfig.addPlugin(timeToRead);

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

    eleventyConfig.addPassthroughCopy("src/css");

    return {
        dir: {
            input: 'src',
            output: 'public',
            includes: 'includes',
            data: 'data',
            layouts: 'layouts'
        },
    }
}
