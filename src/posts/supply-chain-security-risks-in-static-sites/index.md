---
title: Supply Chain Security Risks in Static Sites
description: >-
  Static sites are seen as simpler and more secure than dynamic sites, but this perception can lead to overlooked
  security threats. Despite lacking server-side components, static sites are still vulnerable to supply chain attacks
  due to their reliance on third-party libraries and services. This article explores how these threats emerge and the
  defenses you can implement to safeguard your site.
date: 2024-09-09
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/shipping-containers.jpg'
socialImage: '/assets/images/shipping-containers-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@ventiviews">Venti Views</a> on <a href="https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-6p0JBES_65E">Unsplash</a>'
tags: ['web', 'security']
draft: true
---

Static sites are seen as simpler and more secure than dynamic sites, but this perception can lead to overlooked security
threats. Despite lacking server-side components, static sites are still vulnerable to supply chain attacks due to their
reliance on third-party libraries and services. This article explores how these threats emerge and the defenses you can
implement to safeguard your site.

## What Are Static Sites?

Static websites consist of pre-rendered HTML, CSS, and JavaScript files that are delivered directly to the user's
browser. They have grown in popularity due to their speed, scalability, and cost-effectiveness. With no need for
dynamic servers or databases, static sites generally offer better performance and consume fewer resources, which can also
contribute to reduced environmental impact.

While static sites avoid many server-side vulnerabilities, they frequently depend on third-party JavaScript libraries
services for added functionality, such as form handling, analytics, or dynamic content integration via APIs. These
dependencies, however, open the door to supply chain vulnerabilities, where compromised third-party code becomes an
attack vector.

## The Threat of Supply Chain Attacks

A supply chain attack occurs when malicious actors compromise third-party libraries or services that your site depends
on. A recent example is the [Polyfill.io attack](https://sansec.io/research/polyfill-supply-chain-attack), where
malicious code was injected into a widely used compatibility tool, impacting over 100,000 websites. The attack was
particularly sophisticated, targeting mobile devices and redirecting users to a sports betting site while avoiding
detection by analytics tools and admin users:

> The code has specific protection against reverse engineering, and only activates on specific mobile devices at
  specific hours. It also does not activate when it detects an admin user. It also delays execution when a web analytics
  service is found, presumably to not end up in the stats.

In another case, Cloudflare's CDNJS service had a vulnerability that exposed up to [12% of websites](https://www.bleepingcomputer.com/news/security/critical-cloudflare-cdn-flaw-allowed-compromise-of-12-percent-of-all-sites/)
to potential code injection attacks. Even major Content Delivery Networks (CDNs), considered essential for static sites,
can be susceptible to supply chain threats.

## Defending Against Supply Chain Attacks

There are two key tools for defending against supply chain attacks: [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) (SRI)
and [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (CSP). While each serves a distinct
purpose, they are most effective when used together for layered protection.

### Subresource Integrity (SRI)

SRI ensures that fetched resources, such as JavaScript files, have not been tampered with by comparing their
cryptographic hash to an expected value. If a file has been altered, the browser will block it, protecting the site from
running malicious code.

For example:

```html
<script src="https://cdn.example.com/script.js" integrity="sha384-abc123..." crossorigin="anonymous"></script>
```

In this example, the `integrity` attribute contains the cryptographic hash of the script. If the file's content changes
unexpectedly, the browser will reject it. Tools like [webpack-subresource-integrity](https://www.npmjs.com/package/webpack-subresource-integrity)
can automate the generation of these hashes, reducing the risk of human error.

### Content Security Policy (CSP)

CSP is another vital defense mechanism that complements SRI. By defining which sources are allowed to load resources
such as scripts, styles, and images, CSP reduces the risk of code injections.

Pairing CSP with SRI, as recommended by the [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html#defense-in-depth),
offers a powerful safeguard:

> Even on a fully static website, which does not accept any user input, a CSP can be used to enforce the use of
  Subresource Integrity (SRI). This can help prevent malicious code from being loaded on the website if one of the
  third-party sites hosting JavaScript files (such as analytics scripts) is compromised.

Here's an example of a CSP configuration that enforces both SRI and hash-based integrity:

```text
Content-Security-Policy: default-src 'none'; script-src 'sha384-abc123...';
```

The `default-src 'none'` directive blocks all content from loading by default, ensuring that only explicitly defined
sources are allowed. The `script-src 'sha384-abc123...'` directive allows only scripts matching the specific
cryptographic hash, ensuring integrity regardless of where the script is hosted.

### Applying CSP Effectively

To apply CSP effectively, it's important to implement the rules via HTTP headers. This ensures the policy is enforced
before any content is rendered. If you don't have access to server configurations, CSP can also be [applied using a meta tag](https://content-security-policy.com/examples/meta/).

While CSP is a powerful tool, it can sometimes block legitimate functionality, especially when using third-party
services like analytics or payment gateways. To avoid this, start by applying CSP in `report-only` mode. This lets you
monitor violations without affecting functionality, giving you time to fine-tune your policies before full enforcement.

Be wary of using directives like `unsafe-inline` or `unsafe-eval`, as they can weaken your policy and expose your site
to attacks. For more guidance on configuring CSP, refer to the [CSP specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy).

### Common Threats and How CSP Helps

Pairing SRI with a well-configured CSP can help defend against several common threats:

- **Cross-Site Scripting (XSS)**: Malicious scripts injected into a site can steal data, hijack sessions, or carry out
  unwanted actions. CSP limits the ability of unauthorized scripts to execute.
- **Clickjacking**: Attackers trick users into clicking hidden elements, leading to unintended actions such as form
  submissions or transactions. CSP can prevent the use of frames, which are often used for clickjacking.
- **Site Defacement**: Attackers can alter the content of a website, damaging its credibility. CSP, combined with SRI,
  ensures that only trusted content and scripts are loaded, reducing the likelihood of defacement.

## Automating Security Practices

Automating the implementation of SRI, script handling, and CSP configuration helps reduce human error while ensuring
flexibility for quick interventions when needed. Here's how we do it at [factor10](https://www.factor10.com/websites/):

1. **Automated Script Handling:** During our build process, a utility fetches the latest versions of third-party
   scripts, ensuring we control when updates are introduced.
2. **Automated SRI Generation:** Hashes for all fetched scripts are automatically calculated and embedded
   into the HTML, ensuring integrity.
3. **Automated Security Headers:** CSP rules are generated and applied to our NGINX configuration during deployment.
   If any verification fails, the deployment is discarded, maintaining the security of the live site.

By automating these steps and pairing them with monitoring tools, we ensure our security practices are consistently
applied. Alerts notify our team when deviations from the expected security posture occur, allowing us to maintain
control and respond quickly.

## Tools for Security Testing

Several tools can help you test and improve your security posture. For example, [Google’s CSP Evaluator](https://csp-evaluator.withgoogle.com/)
analyzes your policy and offers suggestions for strengthening it.

For more comprehensive testing, tools like [Mozilla Observatory](https://observatory.mozilla.org/) and [securityheaders.com](https://securityheaders.com/)
offer insights into various security headers. [webperf.se](http://webperf.se) also provides an [open-source suite](https://github.com/Webperf-se/webperf_core)
for analyzing performance, accessibility, and security.

For developers who want to experiment with security headers, my [csp-docker](https://github.com/nizos/csp-docker)
project offers an easy-to-use NGINX environment for doing just that.

At factor10, we use [webperf's premium service](https://webperf.se/erbjudande/) for daily tests, combined with
[automated alerts](https://webperf.se/articles/webhooks/) via Slack to notify us of any issues.

## Conclusion

While static websites are simpler than dynamic ones, they are not immune to modern supply chain threats. The Polyfill.io
incident serves as a reminder that even static sites can be compromised by third-party dependencies. Implementing
security measures like Subresource Integrity (SRI) and Content Security Policy (CSP), paired with
automation, significantly reduces exposure to these risks.

However, no defense strategy is complete without regular testing and monitoring. Vigilance, combined with automation,
ensures that your site remains resilient in the face of evolving threats without sacrificing performance or efficiency.
