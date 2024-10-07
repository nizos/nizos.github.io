---
title: Test-Driven Development and Static Site Development
description: >-
  As a software engineer, I always find ways to streamline my workflow while maintaining a high-quality output.
  Recently, I’ve been working on several static projects using Eleventy, and I found a way to incorporate Test-Driven
  Development (TDD) into my process. This blog post is about my journey and how it resulted in a more efficient, robust,
  and enjoyable development experience.
date: 2023-06-30
cover: /uploads/smartphone-showing-design-definition.jpg
coverAlt: Close-up of smartphone screen displaying the definition of 'design'
caption: Photo by <a href="https://unsplash.com/@edhoradic">Edho Pratama</a> on <a href="https://unsplash.com/photos/T6fDN60bMWY">Unsplash</a>
socialImage: /uploads/smartphone-showing-design-definition-social-image.jpg
tags: [tdd, static-sites]
draft: true
---
As a software engineer, I always find ways to streamline my workflow while maintaining a high-quality output. Recently, I’ve been working on several static projects using Eleventy, and I found a way to incorporate Test-Driven Development (TDD) into my process. This blog post is about my journey and how it resulted in a more efficient, robust, and enjoyable development experience.

## Setup
I use Eleventy, a simpler static site generator, combined with Jest for testing and Cheerio for DOM manipulation. With this setup, I created three vital pieces of functionality: configuring Eleventy programmatically, rendering layouts in a test environment, and leveraging formatted frontmatter.

## Configuring Eleventy for Dynamic Testing

To enable testing in a manner identical to the production environment, we create Eleventy configurations dynamically. This way, configuration parameters such as paths can be adjusted when rendering layouts for tests.

The following code block shows how we achieve this. The solution is quite simple and allows us to do everything a straight-forward configuration file allows us and more. We can easily add any plugins or functionality we want and can also extend it with additional parameters for anything that we would like to dynamically control. Do note that we need to take care of any relative paths so that they can continue to resolve correctly.

```js
const pluginBookshop = require('@bookshop/eleventy-bookshop')
const path = require('path')

const buildConfig = (eleventyConfig, bookshopLocation = 'component-library') => {
  eleventyConfig.addPlugin(
    pluginBookshop({
      bookshopLocations: [path.relative(__dirname, bookshopLocation)],
    })
  )

  return eleventyConfig
}

module.exports = buildConfig
```
With the functionality in place, we can simply replace the contents of our `.eleventy.js` configuration file with the following line.

```js
module.exports = require('./config-builder')
```

We also need to move our `.eleventy.js` file from the root of the project directory to a different location. This is because Eleventy, by default, reads any configuration file it finds in the root directory, and as a consequence, overrides any programmatic configurations we make. This is however not an issue as we can simply point it to our new file location in the package. json script as shown in the following code snippet.

```json
{
  "start": "eleventy --serve --config=config/.eleventy.js --input=site"
}
```

## Rendering Layouts in a Test Environment

The second step in our setup involves rendering a layout specified by name with provided front matter data. To do this, we need to create a temporary directory as Eleventy, at the time of this writing, doesn’t support the processing of templates without them being part of a file. We then run an eleventy instance from within our Node script and have it return the rendered output.

Another limitation that we have to work around is that Eleventy does not natively support an `_includes` directory that is outside the input directory. We do this by creating symbolic links to any files or directories that we need to render our layouts.

```js
const createSymlinks = async (tmpDir) => {
  const directories = ['_includes', 'assets']
  return Promise.all(
    directories.map((dir) =>
      symlink(path.join(__dirname, '..', 'site', dir), path.join(tmpDir, dir))
    )
  )
}
```
We now have everything we need to create our rendering functionality. The following code block shows how we combine what we have created so far and create our test layout, render it and return the result.

```js
const render = async (data) => {
  // create a unique temporary directory
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), path.sep))

  try {
    // write the data to index.liquid in the temp directory
    const inputPath = path.join(tmpDir, 'index.liquid')
    await fs.writeFile(inputPath, data, 'utf8')

    // create symbolic links
    await createSymlinks(tmpDir)

    // Instantiate Eleventy with configuration
    const elev = new Eleventy(tmpDir, tmpDir, {
      quiet: true,
      config: buildConfig,
    })

    // Return the content
    const jsonOutput = await elev.toJSON()
    return jsonOutput[0].content
  } catch (e) {
    console.error(`Couldn't render template: ${e}`)
    throw e
  } finally {
    // clean up the temporary directory
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

module.exports = render
```

## Leveraging Formatted Frontmatter

Finally, we build a function that formats frontmatter according to a specified template. Any unpassed properties are not created, offering increased flexibility for our tests. It also reduces potential clutter and ensures that our tests remain concise and readable.

```js
const generateFrontmatter = (blockName, values) => {
  let block = `- _bookshop_name: ${blockName}`

  for (let key in values) {
    if (values[key]) {
      block += `\n    ${key}: ${values[key]}`
    }
  }

  return outdent`
    ---
    permalink: /
    content_blocks:
      ${block}
    ---`
}
```

In the above function, the first parameter specifies the block we want to use while the second parameter is an object whose keys represent field names and the values represent their respective values. We can now use it as shown below.

```js
const frontmatter = generateFrontmatter('hero', { title, body })
```

## Putting It All Together

As you can see, the result is quite beautiful, if I may say so myself. It tests the real project files in an environment identical to production. As a result, I can ensure that the test results accurately represent the final user experience. What’s more, this setup is efficient and runs significantly faster than when using tools like Cypress.

```js
describe('Hero', () => {
  const title = 'Hero Title'
  const body = 'Hero body'
  let frontmatter, page, $

  beforeAll(async() => {
    frontmatter = generateFrontmatter('hero', { title, body })
    page = await render(frontmatter)
    $ = cheerio.load(page)
  })

  it('has the correct title', () => {
    const heroTitle = $('.c-hero_title').text()
    expect(heroTitle).toBe(title)
  })

  it('has the correct body', () => {
    const heroBody = $('.c-hero_body').text()
    expect(heroBody).toBe(body)
  })
})
```

That is not to say that there is no place for other test tools. In fact, I feel that I get the most value when I combine multiple tools and leverage their combined strengths. 

So, that’s my approach. By sharing it, I hope to encourage you to explore the potential of TDD in your own static site projects if you don’t already use it. The setup may seem daunting at first, but the long-term benefits are certainly worth it.
