---
title: Supply Chain Security Risks in Static Sites
description: >-
  Static sites are often perceived as more secure than their dynamic counterparts due to their simplicity and lack of
  server-side components. However, this assumption can lead to overlooked threats, particularly those introduced by
  third-party libraries and services. In this article, we'll explore how these vulnerabilities arise and how you can
  defend your site against them.
date: 2024-09-09
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/shipping-containers.jpg'
socialImage: '/assets/images/shipping-containers-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@ventiviews">Venti Views</a> on <a href="https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-6p0JBES_65E">Unsplash</a>'
tags: ['web', 'security']
draft: true
---

Static sites are often perceived as more secure than their dynamic counterparts due to their simplicity and lack of
server-side components. However, this assumption can lead to overlooked threats, particularly those introduced by
third-party libraries and services. In this article, we'll explore how these vulnerabilities arise and how you can
defend your site against them.

## What Are Static Sites?

Static websites consist of pre-rendered HTML, CSS, and JavaScript files that are delivered directly to the user's
browser. Their appeal lies in their speed, scalability, and cost-effectiveness. By avoiding server-side processing,
static sites improve performance and reduce resource consumption.

However, many static sites rely on third-party JavaScript libraries or external services for added functionality, such
as form handling or analytics. This introduces auply chain vulnerabilities, where compromised dependencies become attack
vectors.

## The Threat of Supply Chain Attacks

Supply chain attacks occur when third+party code that your site relies on is compromised. One notorious example is the
[Polyfill.io attack](https://sansec.io/research/polyfill-supply-chain-attack), where malicious code affected over
100,000 websites by selectively redirecting users to a sports betting site while avoiding detection by analytics and
admin users:

> The code has specific protection against reverse engineering, and only activates on specific mobile devices at
  specific hours. It also does not activate when it detects an admin user. It also delays execution when a web analytics
  service is found, presumably to not end up in the stats.

Similarly, Cloudflare's CDNJS service exposed up to [12% of websites](https://www.bleepingcomputer.com/news/security/critical-cloudflare-cdn-flaw-allowed-compromise-of-12-percent-of-all-sites/)
to potential code injection attacks, illustrating that even well-regarded Content Delivery Networks (CDNs) can be
vulnerable.

## Defending Against Supply Chain Attacks

The best defences against supply chain attacks are [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
(SRI) and [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (CSP). These tools work best
as part of a layered security approach.

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

### Applying CSP Effectively

To apply CSP effectively, it's important to implement the rules via HTTP headers as opposed to using [meta tags](https://content-security-policy.com/examples/meta/).
This ensures the policy is enforced before any content is rendered. For example, a simple yet effective policy might
look like this:

```text
Content-Security-Policy: default-src 'none'; script-src 'self' https://cdn.example.com; style-src 'self';
```

In this configuration, only scripts from the same origin (self) and a trusted third-party CDN (cdn.example.com) are
allowed, while all other content is blocked by default (`default-src 'none'`). This greatly reduces the risk of running
malicious scripts on your site.

By combining CSP with SRI, you can enforce even stricter security measures. While CSP restricts the sources from which
scripts can be loaded, SRI ensures that the integrity of the script content itself is maintained by checking its
cryptographic has. Here is an example of how to enforce this using CSP:

```text
Content-Security-Policy: script-src 'self' 'sha384-abc123...';
```

This rule allows only scripts from the same origin (self) to be loaded, and also permits any script that matches the
provided hash `sha384-abc123...` regardless of its source. If you want to enforce even tighter security, you can create
a hash-only policy like this:

```text
Content-Security-Policy: script-src 'sha384-abc123...' 'sha384-def456...';
```

With this configuration, only scripts that match the specified cryptographic hashes can be loaded, ensuring that even
if a trusted source is compromised, no unauthorized or altered scripts can be executed.


Be wary of using directives like `unsafe-inline` or `unsafe-eval`, as they can weaken your policy and expose your site
to attacks. For more guidance on configuring CSP, refer to the [CSP specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy).

While CSP is a powerful tool, it can sometimes block legitimate functionality, especially when using third-party
services like analytics or payment gateways. To avoid this, start by applying CSP in `report-only` mode. This lets you
monitor violations without affecting functionality, giving you time to fine-tune your policies before full enforcement.

For developers who want to experiment with security headers, my [csp-docker](https://github.com/nizos/csp-docker)
project offers an easy-to-use NGINX environment for doing just that.

### Common Threats and How CSP Helps

Pairing SRI with a well-configured CSP can help defend against several common threats:

- **Cross-Site Scripting (XSS):** Malicious scripts injected into a site can steal data, hijack sessions, or carry out
  unwanted actions. CSP limits the ability of unauthorized scripts to execute.
- **Clickjacking:** Attackers trick users into clicking hidden elements, leading to unintended actions such as form
  submissions or transactions. CSP can prevent the use of frames, which are often used for clickjacking.
- **Site Defacement:** Attackers can alter the content of a website, damaging its credibility. CSP, combined with SRI,
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

At factor10, we use [webperf's premium service](https://webperf.se/erbjudande/) for daily tests, combined with
[automated alerts](https://webperf.se/articles/webhooks/) via Slack to notify us of any issues.

## Conclusion

While static websites are simpler than dynamic ones, they are not immune to modern supply chain threats. The Polyfill.io
incident serves as a reminder that even static sites can be compromised by third-party dependencies. Implementing
security measures like Subresource Integrity (SRI) and Content Security Policy (CSP), paired with
automation, significantly reduces exposure to these risks.

However, no defense strategy is complete without regular testing and monitoring. Vigilance, combined with automation,
ensures that your site remains resilient in the face of evolving threats without sacrificing performance or efficiency.
