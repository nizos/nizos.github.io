---
title: Supply Chain Security Risks Even for Static Sites
description: >-
  Static websites are often perceived as less vulnerable due to their simplicity, especially since they don't rely
  on complex server-side processes. While they do avoid certain risks like SQL injection, this perception can create a
  false sense of security. In reality, static sites are still exposed to specific attack vectors—particularly supply
  chain attacks.
date: 2024-09-09
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/shipping-containers.jpg'
socialImage: '/assets/images/shipping-containers-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@ventiviews">Venti Views</a> on <a href="https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-6p0JBES_65E">Unsplash</a>'
tags: ['web', 'security']
draft: true
---

Static websites are often perceived as less vulnerable due to their simplicity, especially since they don't rely
on complex server-side processes. While they do avoid certain risks like SQL injection, this perception can create a
false sense of security. In reality, static sites are still exposed to specific attack vectors—particularly supply
chain attacks.

## What are Static Sites?

Static websites are built using pre-rendered HTML, CSS, and JavaScript files, which are directly served to the users'
browsers. These sites are popular due to their speed, scalability, and cost-effectiveness. By eliminating the need for
dynamic servers or databases, static sites often deliver better performance and reduced energy consumption, contributing
to a smaller carbon footprint.

Static site generators like [11ty](https://www.11ty.dev/), [Jekyll](https://jekyllrb.com/), [Hugo](https://gohugo.io/),
and [Gatsby](https://www.gatsbyjs.com/) streamline the creation of static sites. Despite their perceived simplicity,
many static sites integrate JavaScript libraries for added functionality, such as handling form submissions via API
requests or utilizing serverless services for tasks like live ticket bookings.

This modular, flexible approach introduces security risks, particularly from third-party services. These risks are often
underestimated because of the assumption that static sites are inherently safer.

## The Threat of Supply Chain Attacks

One significant risk for static sites is supply chain attacks targeting third-party libraries and services. For example,
the Polyfill.io attack compromised a widely used web compatibility tool at the domain level, affected over 100,000
websites. [Malicious code](https://sansec.io/research/polyfill-supply-chain-attack) was injected, specifically targeting
mobile devices by redirecting them to a sports betting site while avoiding detection by admin users and analytics
services:

> The code has specific protection against reverse engineering, and only activates on specific mobile devices at
  specific hours. It also does not activate when it detects an admin user. It also delays execution when a web analytics
  service is found, presumably to not end up in the stats.

A similar incident occurred in 2021 when a vulnerability in Cloudflare's CDNJS service exposed up to [12% of websites](https://www.bleepingcomputer.com/news/security/critical-cloudflare-cdn-flaw-allowed-compromise-of-12-percent-of-all-sites/)
to potential code injection attacks, highlighting that Content Delivery Networks (CDNs) are also susceptible to such
risks.

## Defending Against Supply Chain Attacks

**Subresource Integrity (SRI)** is a key defense mechanism for supply chain attacks. SRI enables browsers to verify that
a network-fetched resource, such as an external script, has not been tampered with by comparing its hash against an
expected value. If the hashes don't match, the browser blocks the resource, preventing malicious code from running.

SRI requires updating the hash each time the resource changes, which can be cumbersome. However, when combined with
other measures, SRI remains a vital security practice.

**Content Security Policy (CSP)** adds another layer of protection by controlling which resources a website can load,
both internal and external. A well-configured CSP can help prevent unauthorized scripts and styles from executing.

The [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html#defense-in-depth)
notes that even static websites, which don't handle user input, can benefit from enforcing SRI through CSP:

> Even on a fully static website, which does not accept any user input, a CSP can be used to enforce the use of
  Subresource Integrity (SRI). This can help prevent malicious code from being loaded on the website if one of the
  third-party sites hosting JavaScript files (such as analytics scripts) is compromised.

Here's a basic CSP rule enforcing SRI can:

```text
Content-Security-Policy: script-src 'self' https://cdn.example.com; require-sri-for script style;
```

This rule ensures that only trusted scripts and styles are executed, while Subresource Integrity are enforced.

## Common Threats and How CSP Helps

When paired with SRI, CSP can defend against common threats such as Cross-Site Scripting (XSS), Clickjacking, and
site defacement:

- **XSS** allows attackers to inject malicious scripts into a website, potentially stealing sensitive information or
  hijacking sessions.
- **Clickjacking** tricks users into interacting with hidden elements on a page, leading to unintended actions such as
  unwanted transactions.
- **Site defacement** alters a website's content, damaging its credibility.

While a strong CSP can block unauthorized scripts and styles, deploying overly strict policies may disrupt site
functionality, particularly if the site relies on dynamic content or third-party services. Careful testing is essential
to balance security with functionality. Avoid using weak configurations like `unsafe-inline` or `unsafe-eval`, as they
can significantly weaken your CSP.

For developers who want to experiment with security headers, my [csp-docker](https://github.com/nizos/csp-docker)
project offers an easy-to-use NGINX environment that allows for rapid testing of CSP, SRI, and other security
configurations.

## Automating Security

At [factor10](https://www.factor10.com/websites/), we reassessed our approach to third-party analytics tools like
[Plausible](https://plausible.io/)—a privacy-focused, GDPR-compliant solution—to minimize potential risks while
using such services. Previously, we proxied the Plausible script through NGINX to reduce exposure, but we realized this
approach still left room for potential supply chain attacks, similar to the Polyfill incident.

To address this, we introduced further automation improvements into our build and deployment workflows:

1. **Automated Script Handling**: A utility fetches the latest version of third-party scripts during the build,
   ensuring we control when updates are introduced.
2. **Build Process Integration**: Scripts are minified and compressed to ensure optimal performance.
3. **Automated SRI Generation**: Hashes for all network-fetched scripts are automatically calculated and embedded
   into the site, ensuring resources are verified.
4. **Automated Security Headers**: During deployment, our workflow generates CSP rules and updates the NGINX
   configuration accordingly. If verification fails, the deployment is aborted, keeping the site secure.

This automated approach consistently applies security best practices, reducing human error and ensuring that malicious
changes cannot be introduced.

## Tools for Security Testing

To continuously monitor site security, tools like [Google’s CSP Evaluator](https://csp-evaluator.withgoogle.com/)
can provide insights into improving your CSP. For more comprehensive testing, [webperf.se](http://webperf.se) offers an
open-source suite that analyzes performance, sustainability, accessibility, and security.

You can run CSP tests using [webperf core](https://github.com/Webperf-se/webperf_core) with Docker like this:

```
python3 default.py -r -t 21 --setting sitespeed_use_docker=true --setting csp_only=true --setting details=true -u https://www.yourwebsite.com
```

At factor10, we use webperf's [premium service](https://webperf.se/erbjudande/) to run these tests daily, with
[automated alerts](https://webperf.se/articles/webhooks/) via Slack whenever issues arise.

## Conclusion

Static websites may be simpler, but they are not immune to modern supply chain threats. The Polyfill.io incident
highlights the risks posed by third-party libraries and services. To mitigate these threats, implementing a
defense-in-depth strategy with CSP, SRI, and automated security processes is crucial.

By automating key security tasks like resource verification and security header management, developers can ensure their
sites remain secure without sacrificing efficiency. Regular testing and policy updates further safeguard against
evolving threats, ensuring the even static websites stay resilient in the face of increasing complexity.
