---
title: Supply Chain Security Risks in Static Sites
description: >-
  Static sites are perceived as more secure than their dynamic counterparts due to their simplicity and lack of
  server-side components. However, this perception can lead to overlooked threats, particularly those introduced by
  third-party libraries and services. In this article, we'll explore how these vulnerabilities arise and how you can
  defend your site against them.
date: 2024-09-11
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/shipping-containers.jpg'
socialImage: '/assets/images/shipping-containers-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@ventiviews">Venti Views</a> on <a href="https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-6p0JBES_65E">Unsplash</a>'
tags: ['web', 'security']
---

Static sites are perceived as more secure than their dynamic counterparts due to their simplicity and lack of
server-side components. However, this perception can lead to overlooked threats, particularly those introduced by
third-party libraries and services. In this article, we'll explore how these vulnerabilities arise and how you can
defend your site against them.

## What Are Static Sites?

Static sites consist of pre-rendered HTML, CSS, and JavaScript files that are delivered directly to the user's
browser. Their appeal lies in their speed, scalability, and cost-effectiveness. By avoiding server-side processing,
static sites improve performance and reduce resource consumption.

However, many static sites rely on third-party JavaScript libraries or external services for added functionality, such
as form handling or analytics. This introduces supply chain vulnerabilities, where compromised dependencies become
attack vectors.

## The Threat of Supply Chain Attacks

Supply chain attacks occur when third-party code that your site relies on is compromised. One notorious example is the
[Polyfill.io attack](https://sansec.io/research/polyfill-supply-chain-attack), where malicious code affected over
100,000 websites. The code redirected users to a sports betting site while evading detection:

> The code has specific protection against reverse engineering, and only activates on specific mobile devices at
  specific hours. It also does not activate when it detects an admin user. It also delays execution when a web analytics
  service is found, presumably to not end up in the stats.

In another incident, Cloudflare's CDNJS service exposed up to [12% of all websites](https://www.bleepingcomputer.com/news/security/critical-cloudflare-cdn-flaw-allowed-compromise-of-12-percent-of-all-sites/)
on the internet to potential code injection attacks, showing that even well-regarded Content Delivery Networks (CDNs) can be vulnerable.

## Defending Against Supply Chain Attacks

Key defenses against supply chain attacks include [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
(SRI) and [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (CSP). These tools work best
when used together as part of a layered security approach.

### Subresource Integrity (SRI)

Subresource Integrity (SRI) ensures that fetched resources, such as JavaScript files, haven't been tampered with. It
does so by comparing the resource's cryptographic hash to a predefined value. If there's a mismatch, the browser blocks
the resource from loading, preventing potential malicious code from executing.

For example:

```html
<script src="https://cdn.example.com/script.js" integrity="sha384-abc123..." crossorigin="anonymous"></script>
```

In this example, the `integrity` attribute includes the hash of the file. This ensures the resource is unaltered, adding
an extra layer of protection for external scripts your site relies on.

### Content Security Policy (CSP)

Content Security Policy (CSP) allows you to define which sources are permitted to load resources such as scripts,
styles, and images. This reduces the risk of code injection by blocking unauthorized content from running on your site.

Here is an example of a CSP that restricts script loading to the same domain and a trusted CDN:

```text
Content-Security-Policy: script-src 'self' https://cdn.example.com; style-src 'self';
```

You can further strengthen your policy with hash-based CSP directives, allowing only scripts with matching cryptographic
hashes to execute, regardless of their source:

```text
Content-Security-Policy: script-src 'sha384-abc123...' 'sha384-def456...';
```

This approach ensures that unauthorized scripts won't run even if the source is compromised.

### Addressing Security Threats

Using both CSP and SRI together enhances security, as CSP controls where resources can be loaded from while SRI verifies
their integrity. According to the [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html#defense-in-depth):

> Even on a fully static website, which does not accept any user input, a CSP can be used to enforce the use of
Subresource Integrity (SRI). This can help prevent malicious code from being loaded on the website if one of the
third-party sites hosting JavaScript files (such as analytics scripts) is compromised.

These tools help mitigate common security threats:

- **Cross-Site Scripting (XSS)**: XSS attacks allow malicious scripts to be injected into your site, potentially leading
  to data theft, session hijacking, or unauthorized actions. CSP blocks unauthorized scripts by restricting which can
  run.
- **Clickjacking**: This attack deceives users into interacting with hidden elements, often resulting in unintended
  actions like form submissions or transactions. CSP can prevent clickjacking by blocking your site from being embedded
  in iframes, a common method used in such attacks.
- **Site Defacement**: Attackers may try to alter content on your website, damaging its credibility. A combination of
  CSP and SRI ensures that only authorized content is loaded, significantly reducing the risk of defacement.

### Best Practices for CSP Implementation

Despite CSP's effectiveness, it remains underutilized. A [2020 survey](https://www.rapid7.com/blog/post/2020/11/02/overview-of-content-security-policies-csp-on-the-web/)
of the Alexa Top 1 Million websites found that only 7% had a valid CSP, and a [Bitsight study](https://www.bitsight.com/blog/content-security-policy-limits-dangerous-activity-so-why-isnt-everyone-doing-it)
revealed only 2% of 5 million web applications were fully secure.

To fully leverage CSP, follow these best practices:

- **Use a strict default policy**: Start with `default-src 'none'` and then explicitly allow trusted sources.
- **Apply restrictions to all sources**: Use `style-src`, `media-src`, and other directives to tightly control which
  external resources are loaded.
- **Avoid unsafe directives**: Directives like `unsafe-inline` and `unsafe-eval` can undermine your policy by allowing
  inline scripts and styles.
- **Prevent clickjacking**: Use `frame-ancestors` to block other sites from embedding your content in iframes.
- **Test with reporting**: Before enforcing CSP, use `report-only` mode to monitor violations without disrupting
  functionality.

## Automating Security Practices

Managing CSP manually can be error-prone, so automation tools are invaluable for maintaining consistent enforcement
without burdening your workflow. At [factor10](https://www.factor10.com/), we automate several processes to reduce human
error while ensuring flexibility for quick interventions:

1. **Controlled Script Updates**: During our build process, a utility fetches the latest versions of third-party
   scripts, but changes are only introduced after a manual diff-check, giving us full control over updates.
2. **Automated SRI Generation**: Hashes for all fetched scripts are automatically calculated and embedded
   into the HTML, ensuring integrity.
3. **Automated Security Headers**: CSP rules are generated and applied to our NGINX configuration during deployment.
   If any verification fails, the deployment is discarded, maintaining the security of the live site.

By automating these steps and pairing them with monitoring tools, we ensure consistent security practices. Alerts notify
our team of any deviations, allowing us to maintain control and respond promptly.

## Tools for Automating and Testing Security

The following tools can help you automate security practices and assess or improve your site's security posture:

- [Google’s CSP Evaluator](https://csp-evaluator.withgoogle.com/): Analyzes your CSP and offers suggestions for
  strengthening it.
- [Mozilla Observatory](https://observatory.mozilla.org/): Provides insights into security headers and suggests
  improvements.
- [securityheaders.com](https://securityheaders.com/): Tests and rates your site's HTTP headers based on best practices.
- [Playwright](https://playwright.dev/): A versatile tool for cross-browser testing to ensure consistent security
  behavior.
- [Webperf.se](http://webperf.se): Offers an [open-source suite](https://github.com/Webperf-se/webperf_core) for
  analyzing performance, accessibility, and security.

For our [sustainable-websites](https://factor10.com/websites/), we use [webperf's premium service](https://webperf.se/erbjudande/)
for daily tests, alongside automated alerts via [webhooks](https://webperf.se/articles/webhooks/) on Slack to notify us
of any issues.

## Conclusion

While static websites are simpler than dynamic ones, they are not immune to modern supply chain threats. The Polyfill.io
incident serves as a reminder that even static sites can be compromised by third-party dependencies. Implementing
security measures like Subresource Integrity (SRI) and Content Security Policy (CSP), combined with automation,
significantly reduces your site's exposure to supply chain risks.

However, no defense strategy is complete without regular testing and monitoring. Vigilance, combined with automation,
ensures that your site remains resilient in the face of evolving threats without sacrificing performance or efficiency.
