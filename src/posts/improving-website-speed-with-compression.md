---
title: Improving Website Speed with Compression
description: >-
  Compression plays a vital role in the modern web. It helps us deliver content faster to users while preserving network
  resources. With technologies like Gzip and Brotli, we can make websites more efficient without compromising the
  quality of the data. In this post, we will explore how to improve website speed by leveraging HTTP compression and
  pre-compressing files.
date: 2023-06-26
cover: /uploads/numbers-on-a-screen.jpg
coverAlt: Close-up of numerical data on a screen
caption: Photo by <a href="https://unsplash.com/@mbaumi">Mika Baumeister</a> on <a href="https://unsplash.com/photos/Wpnoqo2plFA">Unsplash</a>
socialImage: /uploads/numbers-on-a-screen-social-image.jpg
tags: [gzip, br, nginx, web]
---

Google engineers, Arvind Jain and Jason Glasgow, stated that more than 99 human years are wasted every day because of uncompressed content [[1]]. That was in 2009. Advancements in technology have since then brought improvements to internet speed, connectivity, and coverage. However, a lot has also changed on the web and how we use it.

Between 2012 and 2022, the average desktop page size increased from 803 KB to 2,284 KB. For mobile, it increased from 386 KB to 2,010 KB. A staggering increase of 184% and 420% respectively in a single decade [[2]].

During the same period, the number of internet users has also more than doubled, increasing from roughly 2.2 to 5.3 billion internet users, an increase from roughly 35% to 66% of the world population that use the internet [[3]].

At the risk of preaching to the choir, the minute performance improvements we make to the websites we create accumulate to astounding and far-reaching impacts. Their importance and significance can not be understated, especially considering how simple some of them are. In this post, we'll explore how to improve website speed by leveraging HTTP compression and pre-compressing files.

## HTTP Compression

One technique that has significantly contributed to website speed improvement is HTTP compression. This seamless capability in our web servers and browsers, which can easily go unnoticed, improves transfer speed and bandwidth utilization by compressing HTTP data before sending it. The scheme used for the compression is negotiated through the client advertising methods it supports.

```text
GET /encrypted-area HTTP/1.1
Host: www.example.com
Accept-Encoding: gzip, deflate
```

The server can also support multiple compression schemes. In such a case, the server lists them in the `Content-Encoding` or `Transfer-Encoding` field in the HTTP response.

```text
HTTP/1.1 200 OK
Date: mon, 26 June 2016 22:38:34 GMT
Server: Apache/1.3.3.7 (Unix)  (Red-Hat/Linux)
Last-Modified: Wed, 08 Jan 2003 23:11:55 GMT
Accept-Ranges: bytes
Content-Length: 438
Connection: close
Content-Type: text/html; charset=UTF-8
Content-Encoding: gzip
```

## Compression Schemes

The two most common compression schemes used today are Gzip (`gzip`) and Brotli (`br`).

Gzip, the older of the two, was released in 1993 during the formative years of the internet. It was created to compress files and has since been adapted to compress streams. Brotli on the other hand, which was released in 2013 by Google, was designed from the ground up to compress streams making it a preferred scheme for web.

Both Gzip and Brotli combine variations of the [LZ77](https://en.wikipedia.org/wiki/LZ77_and_LZ78) algorithm and [Huffman coding](https://en.wikipedia.org/wiki/Huffman_coding), among others, to provide lossless general-purpose compression.

LZ77 replaces repeated occurrences of data with references to a single copy of it using an encoded length-distance pair. This match effectively states that the length following characters are identical to the characters distance before them. This algorithm formed the basis of compression schemes such as GIF and the deflate algorithm used in PNG and ZIP.

The Huffman coding algorithm further compresses the data by using a dictionary of recurring characters and their frequency. Characters, and groups of which, are replaced by variable-length codes based on their occurrence with more frequent ones being assigned shorter codes.

Brotli is further able to reach higher compression density by utilizing context models and other improvements. It also uses a pre-defined dictionary along its dynamic memory, roughly 120 KiB containing 13,000 common words, phrases and substrings derived from internet documents.

This allows Brotli to reach compression densities that are roughly 15% denser for JavaScript and CSS files, and 20% denser for HTML files compared to Gzip. That said, Brotli can also take longer to compress data compared to Gzip. The higher the level of compression, the longer it takes.

## Pre-Compressing Files

While compression significantly reduces the size of transmitted data, it also happens at run time and as such impedes performance due to the required processing overhead. Luckily, we can utilize modules that allow us to serve pre-compressed files, effectively eliminating all the processing overhead at runtime. This is ideal for serving static content and static files.

We will have to first compress our files. The `node:zlib` module provides all the compression functionality needed to do so using Gzip and Brotli. The documentation provides an example of how to accomplish this by piping the source stream (file) through a `zlib` Transform into a destination stream.

```javascript
const { createGzip } = require('node:zlib');
const { pipeline } = require('node:stream');
const {
  createReadStream,
  createWriteStream,
} = require('node:fs');

const gzip = createGzip();
const source = createReadStream('input.txt');
const destination = createWriteStream('input.txt.gz');

pipeline(source, gzip, destination, (err) => {
  if (err) {
    console.error('An error occurred:', err);
    process.exitCode = 1;
  }
});
```

For Brotli, we simply replace the Gzip object with a `BrotliCompress` object. We can call `createBrotliCompress()` instead of `createGzip()` to create our transform stream. Additionally, we can pass an `options` object to specify the compression level and fine-tune other parameters to our liking.

We then simply create the necessary functionality to recursively iterate through the files in our build directory and create `.gz` and `.br` compressed files next to the uncompressed files. Finally, we add the command to our build script and have it automatically execute as a final build step.

## Serving Pre-Compressed Files

For NGINX, we can use [ngx_http_gzip_static_module](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html#gzip_static) for Gzip and [ngx_brotli](https://github.com/google/ngx_brotli#brotli_static) for Brotli precompressed files. These allow us to precompress our files and have them served as such.

Nginx uses a nifty tool called [pkg-oss](https://hg.nginx.org/pkg-oss/) to create the dynamic module packages for their official repositories. It contains a script that automates the process, which we can use to create installable packages with the correct dependencies for our modules.

This method ensures that the dependency between our modules and NGINX is honored, facilitating seamless upgrades and avoiding upgrade failures. The code block below shows how we can use it to create `deb` packages for our `ngx_brotli` module. You can use `curl` or any other similar tool instead of `wget`.

```text
wget https://hg.nginx.org/pkg-oss/raw-file/default/build_module.sh
chmod a+x build_module.sh
./build_module.sh -v 1.23.3 --force-dynamic https://github.com/google/ngx_brotli.git
```

Do note however that this should be done in a separate build environment to ensure that only operation-necessary software is installed on the production server. Further, this script might not work for every module and the installable packages created by it are not intended for distribution. Finally, seamless upgrades require a `yum` or `apt` repository. For instructions and more information, check out Liam Crillys article [Creating Installable Packages for Dynamic Modules](https://www.nginx.com/blog/creating-installable-packages-dynamic-modules/).

Upon completion, the script outputs the path of the created `deb` packages which we can install with the help of `dpkg`.

```shell
dpkg -i nginx-module-brotli_1.23.3+1.0-1~jammy_amd64.deb
```

We then need to configure NGINX to use the newly installed module. We do this by editing the main configuration file.

```shell
nano /etc/nginx/nginx.conf
```
We simply add the directive we are interested in to the http block. For example:

```text
brotli on;
brotli_comp_level 6;
brotli_static on;
brotli_types application/atom+xml application/javascript
  application/json application/rss+xml application/vnd.ms-fontobject
  application/x-font-opentype application/x-font-truetype
  application/x-font-ttf application/x-javascript
  application/xhtml+xml application/xml font/eot font/opentype
  font/otf font/truetype image/svg+xml image/vnd.microsoft.icon
  image/x-icon image/x-win-bitmap text/css text/javascript
  text/plain text/xml;
```

- `brotli`: Enables on-the-fly compression of responses.
- `brotli_comp_level`: Sets the on-the-fly compression levels. Range is 0 - 11, default is 6.
- `brotli_static`: Enables checking for pre-compressed files with .br extension.
- `brotli_types`: MIME types to enable on-the-fly compression for.

Check the official [ngx_brotli](https://github.com/google/ngx_brotli) repo for additional information and configuration.

Check for any syntax errors after saving with the following command:
```shell
nginx -t
```

The output should look something like this:
```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Finally, restart NGINX to apply the changes.

```shell
systemctl restart nginx
```

NGINX is now configured with Brotli support. You can verify this by running the following command:

```text
curl -H ‘Accept-Encoding: br’ -I https://your-website.com
```

The result should contain the following line:

```text
content-encoding: br
```

Be also sure to test your improved website speed by using PageSpeed Insights, Lighthouse or any other tool you prefer. Your numbers may vary depending on several factors such as existing bottlenecks, but you should see an improvement.

## Results

After compressing and serving static files, the loading speed of my website improved significantly. However, don't just take my word for it. Let's examine some real-world examples that illustrate the effectiveness of compression.

Here is how the time-to-interactive changed on mobile for the following sites:

- Organization website: Reduced from 1.5 to 0.9 seconds.
- Conference website: Reduced from 1.4 to 1.0 seconds.

These are just a few examples of how powerful compression can be in improving website speed. With the easy implementation and significant benefits, it is clear why HTTP compression and pre-compressing files have become standard practice in web development.

## Conclusion
Compression plays a vital role in the modern web. It helps us deliver content faster to users while preserving network resources. With technologies like Gzip and Brotli, we can make websites more efficient without compromising the quality of the data. As the internet continues to grow and evolve, we can only expect compression techniques to become even more critical. In future posts, we'll explore more ways to improve website performance and make the most of available resources.

## References

[1]: <https://developers.googleblog.com/2009/11/use-compression-to-make-web-faster.html> "Use compression to make the web faster"
[2]: <https://www.keycdn.com/support/the-growth-of-web-page-size> "The Growth of Web Page Size"
[3]: <https://www.itu.int/hub/publication/d-ind-ict_mdd-2022> "Measuring digital development: Facts and Figures 2022"

1. [https://developers.googleblog.com/2009/11/use-compression-to-make-web-faster.html](https://developers.googleblog.com/2009/11/use-compression-to-make-web-faster.html)
2. [https://www.keycdn.com/support/the-growth-of-web-page-size](https://www.keycdn.com/support/the-growth-of-web-page-size)
3. [https://www.itu.int/hub/publication/d-ind-ict_mdd-2022](https://www.itu.int/hub/publication/d-ind-ict_mdd-2022)
