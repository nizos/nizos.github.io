---
title: Supply Chain Security Risks Even for Static Sites
description: >-
  Static websites are often perceived as less vulnerable due to their simplicity, particularly because
  they don’t rely on complex server-side interactions. While this perception holds some truth—static sites avoid risks
  like SQL injection—it can also foster a false sense of security. In reality, static sites are still susceptible to
  specific attack vectors, especially supply chain attacks.
date: 2024-09-09
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/shipping-containers.jpg'
socialImage: '/assets/images/shipping-containers-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@ventiviews">Venti Views</a> on <a href="https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-6p0JBES_65E">Unsplash</a>'
tags: ['web', 'security']
draft: true
---

Static websites are often perceived as less vulnerable due to their simplicity, particularly because they don’t rely on
complex server-side interactions. While this perception holds some truth—static sites avoid risks like SQL injection
—it can also foster a false sense of security. In reality, static sites are still susceptible to specific attack
vectors, especially supply chain attacks.

## Static Sites

Static websites, composed of pre-rendered HTML, CSS, and JavaScript, are popular for their speed, security, scalability,
and cost-effectiveness. With no need for server-side processing or databases, they can be optimized to be incredibly
lightweight, which boosts performance. This often translates into reduced energy usage and a smaller carbon footprint,
although the actual impact varies based on traffic, hosting, and other factors.

However, static sites aren’t restricted to simple content. Through JavaScript libraries, static sites can handle form
submissions via asynchronous API requests. More complex interactions, like booking tickets with live seat availability,
can be handled by integrating serverless services. These services scale with demand or shut down when not in use, making
them highly efficient.

While this modular approach adds flexibility, it also introduces risks. Relying on third-party libraries and services
can expose sites to supply chain attacks if not properly managed. These attacks are not unique to static sites; any site
can be vulnerable. However, static sites may downplay these risks due to their perceived simplicity.

## Supply Chain Attacks

One significant risk comes from supply chain attacks on third-party libraries and services. A notable example is the
Polyfill.io attack, where a widely used web compatibility tool was compromised at the domain level. Malicious code was
injected, impacting over 100,000 websites.

[Sansec.io](https://sansec.io/), a security research firm, [discovered that a malware](https://sansec.io/research/polyfill-supply-chain-attack)
used in the attack redirected mobile users to a sports betting site while evading detection:

> The code has specific protection against reverse engineering, and only activates on specific mobile devices at
  specific hours. It also does not activate when it detects an admin user. It also delays execution when a web analytics
  service is found, presumably to not end up in the stats.

This malware cleverly exploited the less rigorous security checks typically found on mobile devices and non-admin users,
allowing the attack to persist undetected for longer.

Similar attacks can occur at the Content Delivery Network (CDN) level. CDNs, often used to serve JavaScript libraries,
fonts, and analytics scripts, are not immune to compromise. The 2021 Cloudflare [CDNJS vulnerability](https://www.bleepingcomputer.com/news/security/critical-cloudflare-cdn-flaw-allowed-compromise-of-12-percent-of-all-sites/)
demonstrated this risk. A potential bug could have allowed attackers to inject malicious code into libraries served to
millions of websites, potentially affecting up to 12% of the web. This underscores how even static sites, despite their
simplicity, are not immune to supply chain threats.

## Subresource Integrity (SRI)

To mitigate the risks of supply chain attacks, Subresource Integrity (SRI) is a crucial defense. SRI allows browsers to
verify that resources like JavaScript or CSS files haven’t been altered by comparing their hash with an expected value.
If the hashes don’t match, the resource is blocked, preventing the execution of malicious code.

However, SRI has limitations:
- It only works when you can guarantee and specify the hash of the exact resource version you’re expecting, which
  requires regular updates whenever the resource changes.
- It doesn’t protect against malicious code hosted directly at the source. For example, if a CDN itself is compromised
  and serves a malicious file that matches the expected hash, SRI won’t prevent the attack.

Despite these limitations, SRI remains an effective layer of defense when used in conjunction with other security
measures like Content Security Policy (CSP).

## Content Security Policy (CSP)

A Content Security Policy (CSP) adds another layer of protection by controlling which resources a website can load,
helping prevent unauthorized scripts and styles from executing.

According to the [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html#defense-in-depth):

> Even on a fully static website, which does not accept any user input, a CSP can be used to enforce the use of
  Subresource Integrity (SRI). This can help prevent malicious code from being loaded on the website if one of the
  third-party sites hosting JavaScript files (such as analytics scripts) is compromised.

However, CSPs come with challenges. A strict CSP can break site functionality, especially if your site relies on dynamic
content or third-party services. Extensive testing is necessary to ensure that your CSP doesn’t interfere with the
site’s functionality. Common mistakes, such as allowing `unsafe-inline` or `unsafe-eval`, can weaken the protection
and should be avoided.

For developers looking to test and fine-tune security headers, my [csp-docker](https://github.com/nizos/csp-docker)
project offers an easy-to-use NGINX environment. It allows modifications to HTML, CSS, JS, and NGINX configuration files
to be reflected immediately in the running container, making it ideal for quick experimentation.

Here’s an example of a simplified but effective CSP rule:

```text
Content-Security-Policy: default-src 'none'; script-src 'sha256-<hash>' https://plausible.io; style-src 'sha256-<hash>';
object-src 'none'; base-uri 'none'; frame-ancestors 'none'; report-uri /csp-violation-report;
```

This CSP allows only scripts with specific integrity hashes or those from trusted sources like Plausible. Inline styles
are verified using SRI, and external objects and iframes are blocked to prevent attacks like Cross-Site Scripting (XSS)
and Clickjacking. Additionally, it blocks data URIs and other potentially malicious sources, which can be common attack
vectors.

## Cross-Site Scripting (XSS), Clickjacking, and Defacement

With the right security measures in place, you can also protect against common threats like Cross-Site Scripting (XSS),
Clickjacking, and Defacement:

- XSS allows attackers to inject malicious scripts that run in users’ browsers, potentially stealing sensitive
  information or hijacking sessions.
- Clickjacking tricks users into performing unintended actions by overlaying malicious elements on legitimate pages,
  such as authorizing transactions or downloading malware.
- Defacement alters the appearance or content of a site, damaging its reputation.

A strong CSP, when combined with SRI, can significantly reduce these risks by preventing unauthorized resources from
being executed.

## Improving CSP with Automation

To better protect our [sites](https://www.factor10.com/websites/), we reassessed our use of third-party analytics,
such as [Plausible](https://plausible.io/), a privacy-focused, GDPR-compliant solution. Initially, we served the
Plausible script through an NGINX proxy, which reduced exposure to external risks. However, we realized that it was
still vulnerable to supply chain attacks like the Polyfill incident.

We implemented several workflow improvements:

1. Automated Script Handling: A utility now downloads the latest version of third-party scripts during the build
   process, ensuring we control when new script changes are introduced.
2. Build Process Integration: Once scripts are downloaded, they are minified and compressed during the build process.
3. Automated Subresource Integrity: Hashes are automatically calculated for all scripts and inline styles, ensuring only
   verified resources are executed.
4. Automated Security Headers: During deployment, a workflow calculates hashes and generates the NGINX configuration
   with the correct CSP rules. If any verification fails, the deployment is discarded, keeping the live site secure.

This approach enhances security while minimizing complexity. By downloading, verifying, and securing these resources as
part of our deployment process, we prevent malicious updates and ensure optimal loading performance. Browsers can verify
and cache resources efficiently, and can only load the exact versions we approve.

## Tools for Security Testing

To evaluate and improve your site’s security, tools like [Google’s CSP Evaluator](https://csp-evaluator.withgoogle.com/)
assess your CSP and provide feedback. For more comprehensive testing, [webperf.se](http://webperf.se) offers an
open-source suite that evaluates performance, sustainability, accessibility, and security.

Here’s a command-line example to test CSP using [webperf core](https://github.com/Webperf-se/webperf_core) with Docker:

```
python3 default.py -r -t 21 --setting sitespeed_use_docker=true --setting csp_only=true --setting details=true -u https://www.yourwebsite.com
```

Running these tests regularly ensures that your security remains up to date. For our sites, we’ve subscribed to
webperf’s premium service to have them run daily and have also set up webhooks to alert us on Slack whenever manual
intervention is required.

## Wrapping Up

Static websites may seem simpler and less vulnerable, but this simplicity can be deceptive. The Polyfill.io attack shows
how even static sites can be targeted through supply chain vulnerabilities. Implementing a defense-in-depth strategy
with CSP, SRI, and automation is essential for mitigating these risks.

Automation reduces human error, ensuring consistent application of security best practices. By automating tasks like
calculating hashes, updating security headers, and verifying third-party resources, you create workflows that enhance
security without adding unnecessary complexity.

Monitoring and regularly updating your policies and workflows is crucial as threats evolve. By integrating strong
security measures with automation and continuously testing your security, you can ensure that even static sites remain
resilient against evolving threats.
