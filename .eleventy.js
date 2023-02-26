const Image = require("@11ty/eleventy-img");
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
    eleventyConfig.addAsyncShortcode("image", imageShortcode);
}
