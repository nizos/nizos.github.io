---
title: Supply Chain Security Risks in Static Sites
description: >-
  Static sites are often seen as inherently secure, but this perception can leave developers blind to real threats. Even
  without server-side components, static sites face significant risks, particularly in the supply chain.
date: 2024-09-09
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/shipping-containers.jpg'
socialImage: '/assets/images/shipping-containers-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@ventiviews">Venti Views</a> on <a href="https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-6p0JBES_65E">Unsplash</a>'
tags: ['web', 'security']
draft: true
---

Static sites are often seen as inherently secure, but this perception can leave developers blind to real threats. Even
without server-side components, static sites face significant risks, particularly in the supply chain.

## What Are Static Sites?

A static website consists of pre-rendered HTML, CSS, and JavaScript files that are served directly to the user's
browser. These sites are popular due to their speed, scalability, and cost-effectiveness. By eliminating the need for
dynamic servers or databases, static sites generally provide better performance and are less resource-intensive, which
can contribute to a lower environmental impact.

While static sites are simpler by design, they frequently rely on JavaScript libraries and third-party services to add
functionality, such as form handling, analytics, and dynamic content via APIs. These integrations introduce significant
security risks, particularly through the supply chain, as third-party code can become a vulnerability if not carefully
managed.

## The Threat of Supply Chain Attacks

One of the most concerning risks for static sites is the supply chain attack, where malicious actors compromise
third-party libraries or services that your site depends on. A recent example is the [Polyfill.io attack](https://sansec.io/research/polyfill-supply-chain-attack),
which injected malicious code into a popular web compatibility tool used by over 100,000 websites. The attack
specifically targeted mobile devices by redirecting users to a sports betting site while avoiding detection by admin
users and analytics tools:

> The code has specific protection against reverse engineering, and only activates on specific mobile devices at
  specific hours. It also does not activate when it detects an admin user. It also delays execution when a web analytics
  service is found, presumably to not end up in the stats.

A similar incident involved Cloudflare's CDNJS service, which exposed up to [12% of websites](https://www.bleepingcomputer.com/news/security/critical-cloudflare-cdn-flaw-allowed-compromise-of-12-percent-of-all-sites/)
to potential code injection attacks. This highlights that even major Content Delivery Networks (CDNs) are susceptible
to supply chain threats.

## Defending Against Supply Chain Attacks

**Subresource Integrity (SRI)** allows browsers to verify that network-fetched resources, such as scripts, haven't been
tampered with. By comparing the file's cryptographic hash against an expected value, SRI ensures that the resource
hasn't been altered maliciously.

Here's how you can implement SRI in your HTML:

```html
<script src="https://cdn.example.com/script.js" integrity="sha256-abc123..." crossorigin="anonymous"></script>
```

In this example, the `integrity` attribute contains a cryptographic hash of the script. If the script's hash changes,
whether due to legitimate or malicious modification, the browser will block it. This is particularly important for
ensuring the integrity of resources from third-party sources.

To ease the burden of manually updating the hashes every time a file changes, you can automate the process using build
tools. For example, tools like [webpack-subresource-integrity](https://www.npmjs.com/package/webpack-subresource-integrity)
can handle this automatically.

**Content Security Policy (CSP)** is another vital defense against supply chain attacks. CSP allows developers to define
which sources are permitted to load resources such as scripts, styles, and images. A strong CSP can prevent unauthorized
scripts from running, even if a third-party resource has been compromised.

The [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html#defense-in-depth)
suggests enforcing SRI through CSP, even for static sites that don't accept user input:

> Even on a fully static website, which does not accept any user input, a CSP can be used to enforce the use of
  Subresource Integrity (SRI). This can help prevent malicious code from being loaded on the website if one of the
  third-party sites hosting JavaScript files (such as analytics scripts) is compromised.

Here's an example of a CSP rule enforcing SRI:

```text
Content-Security-Policy: script-src 'self' https://cdn.example.com; require-sri-for script;
```

This rule specifies that only scripts from your domain (`'self'`) and the trusted CDN (`https://cdn.example.com`) are
allowed to execute. The `require-sri-for` directive ensures that any script fetched from these sources must have valid
integrity hashes.

It's generally better to apply CSP rules via HTTP headers rather than meta tags since headers are processed earlier in
the page load, providing greater security. However, if you don't have access to server configuration, using a `<meta>`
tag in the `<head>` section is better than having no protection at all.

To fully secure a site, similar rules should be applied to styles and other resources. Additionally, blocking frames and
object embedding can protect against attacks such as Cross-Site Scripting (XSS) and Clickjacking. For more details on
configuring CSP rules, refer to the [CSP specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy).

## Common Threats and How CSP Helps

Pairing SRI with a well-configured CSP can help defend against several common threats:

- **Cross-Site Scripting (XSS)**: Malicious scripts injected into a site can steal data, hijack sessions, or carry out
  unwanted actions. CSP limits the ability of unauthorized scripts to execute.
- **Clickjacking**: Attackers trick users into clicking hidden elements, leading to unintended actions such as form
  submissions or transactions. CSP can prevent the use of frames, which are often used for clickjacking.
- **Site Defacement**: Attackers can alter the content of a website, damaging its credibility. CSP, combined with SRI,
  ensures that only trusted content and scripts are loaded, reducing the likelihood of defacement.

That said, overly strict CSP configurations can disrupt legitimate functionality, especially if you rely on third-party
services like analytics or payment gateways. Testing your policies carefully is crucial to balancing security with
functionality. Always avoid weak configurations like `unsafe-inline` or `unsafe-eval`, as they can weaken your policy
and expose your site to attacks.

For developers who want to experiment with security headers, my [csp-docker](https://github.com/nizos/csp-docker)
project offers an easy-to-use NGINX environment that allows for rapid testing of CSP, SRI, and other security
configurations.

## Automating Security

Automating key steps like SRI generation, script handling, and CSP configuration helps reduce human error while
maintaining flexibility for quick interventions when needed. Here's how we do it at [factor10](https://www.factor10.com/websites/):

1. **Automated Script Handling**: During our build process, a utility fetches the latest versions of third-party
   scripts, ensuring we control when updates are introduced.
2. **Automated SRI Generation**: Hashes for all fetched scripts are automatically calculated and embedded
   into the HTML, so the integrity of resources is always verified.
3. **Automated Security Headers**: CSP rules are generated and applied to our NGINX configuration during deployment.
   If any verification fails, the deployment is discarded, keeping the live site secure.

By combining automation with monitoring tools, we ensure our security practices are consistently applied. Alerts notify
our team when deviations from the expected security posture occur, allowing us to maintain control and respond quickly.

## Tools for Security Testing

Several tools can help you test and improve your security posture. For example, [Google’s CSP Evaluator](https://csp-evaluator.withgoogle.com/)
analyzes your policy and offers suggestions for strengthening it.

For more comprehensive testing, tools like [Mozilla Observatory](https://observatory.mozilla.org/) and [securityheaders.com](https://securityheaders.com/)
offer insights into various security headers. [webperf.se](http://webperf.se) also provides an [open-source suite](https://github.com/Webperf-se/webperf_core)
for analyzing performance, accessibility, and security.

At factor10, we use [webperf's premium service](https://webperf.se/erbjudande/) for daily tests, combined with
[automated alerts](https://webperf.se/articles/webhooks/) via Slack to notify us of any issues.

## Conclusion

While static websites are simpler than dynamic ones, they aren't immune to modern supply chain threats. The Polyfill.io
incident serves as a clear reminder that third-party libraries can introduce vulnerabilities, even to static sites. By
implementing security measures such as Subresource Integrity (SRI) and Content Security Policy (CSP), and by automating
these processes, developers can significantly reduce their exposure to these risks.

However, no strategy is complete without ongoing vigilance. Regular testing and monitoring are crucial to maintaining
the resilience of your static site in the face of evolving threats. By integrating automation with manual oversight, you
can ensure that your site remains secure without sacrificing performance or efficiency.