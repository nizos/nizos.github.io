---
title: 'Optimizing GitHub Workflows for Efficiency and Sustainability'
description: "In recent years, integrating automation into my development workflows has become increasingly important. This post outlines several strategies I've employed to optimize the efficiency and sustainability of these workflows. Topics covered include canceling redundant jobs, setting appropriate workflow timeouts, optimizing caching techniques, and effectively managing workflow triggers."
date: 2024-06-11
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/wind-turbine.jpg'
socialImage: '/assets/images/optimizing-github-workflows-for-efficiency-and-sustainability-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@bfigas">Bruno Figueiredo</a> on <a href="https://unsplash.com/photos/white-windmill-during-day-KAXSflHqAl0">Unsplash</a>'
tags: [ci, automation, sustainability]
draft: true
---

In recent years, integrating automation into my development workflows has become increasingly important.
This post outlines several strategies I've employed to optimize the efficiency and sustainability of these workflows.
Topics covered include canceling redundant jobs, setting appropriate workflow timeouts,
optimizing caching techniques, and effectively managing workflow triggers.

## Cancel Redundant Jobs

Active development branches often receive rapid, successive updates, triggering multiple instances of the same workflow.
This redundancy, particularly for pull request (PR) checks, consumes excessive resources and can be wasteful.

One effective solution is to utilize [concurrency groups](https://docs.github.com/en/enterprise-cloud@latest/actions/using-jobs/using-concurrency#using-concurrency-in-different-scenarios).
By assigning a concurrency key, you can group workflows, thereby controlling their execution more effectively.
GitHub ensures that within a concurrency group, only one job or workflow runs at a time, limiting it to one running
and one pending job.

Here is how to configure the `cancel-in-progress` property, which cancels any ongoing workflow within the same
concurrency group when a new one is triggered:

```yaml
on:
  push:
    branches:
      - main

concurrency:
  group: integration-tests
  cancel-in-progress: true
```

For more granular control, consider using dynamic expressions in the group naming, such as the branch triggering
the workflow:

{% raw %}
```yaml
concurrency:
  group: integration-tests-${{ github.ref }}
  cancel-in-progress: true
```
{% endraw %}

This adjustment ensures that workflows triggered on different branches do not interfere with each other, optimizing
PR checks by avoiding redundant or outdated jobs while maintaining the integrity of our codebase.

## Set Workflow Timeouts

The default workflow timeout is 6 hours, which is often excessive for processes that complete within minutes.
Setting a more appropriate duration prevents wasteful use of resources, such as when a process hangs.
For instance, a lint check that typically completes within two minutes might only need a 10-minute timeout:

```yaml
jobs:
  lint-checks:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```

This simple adjustment prevents resources from being idly consumed, directing them towards more critical tasks and
enhancing the sustainability of your workflows.

## Utilize Caching for Efficiency

### Optimize Dependency Handling

Workflow runs often share the exact same dependencies, which must be downloaded each time. Efficient caching can save
both time and resources. I recommend using the [setup actions](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#about-caching-workflow-dependencies)
for setting up environments like Node.js with caching enabled:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
```

This configuration caches the `~/.npm` directory, which stores tarballs and metadata rather than the `node_modules`,
reducing size and enhancing reusability across different environments.

Using `npm ci` instead of `npm install` further accelerates builds by installing exact versions from the
`package-lock.json`, ensuring reproducible builds and eliminating dependency resolution delays.

### Cache and Restore Build Assets

For assets that are resource-intensive to recreate and don't frequently change, consider using the
[cache action](https://github.com/actions/cache):

{% raw %}
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:

      - name: Cache Assets
        uses: actions/cache@v4
        with:
          path: assets
          key: assets-${{ github.run_id }}
          restore-keys: |
            assets-
```
{% endraw %}

This configuration caches the `assets` directory, restoring it at the start of each build.
By referencing the run ID in the cache key, each build attempt will initially seek its own unique cache.
If there isn't an exact match, the `restore-keys` option allows the build to use the most recent cache starting with
`assets-`. This technique is particularly useful for processes like generating responsive images, where restoring them
from the cache can save significant time and resources.

Note: GitHub retains caches for 7 days after the last access. For infrequent workflows, a storage-based solution might
be more appropriate. Cache management, including invalidation, can be handled through the repository's [web interface](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#deleting-cache-entries).

## Optimize Workflow Triggers

Efficiently using `paths` and `paths-ignore` to specify which files or directories should trigger workflows can help
focus resources on meaningful changes.

For instance, to exclude documentation updates from triggering workflows:

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
```

This configuration prevents any change in the `docs` directory from triggering the workflow, conserving resources for
non-code updates.

To trigger workflows only for changes in front-end code (e.g., JavaScript files):

```yaml
on:
  push:
    paths:
      - 'frontend/**.js'
```

This setting ensures that workflows are triggered only when `js` files in the `frontend` directory are modified,
ensuring relevant tasks like linting are executed only when necessary.

Using `paths` and `paths-ignore` efficiently reduces unnecessary workflow executions, making your processes more
sustainable and cost-effective.

For more advanced usage, refer to the official GitHub Actions documentation [here](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore).
Feel free to also check out the [paths-filter](https://github.com/dorny/paths-filter) action which offers more advanced
features.

## Leverage ARM Architecture for Efficiency

GitHub recently announced [ARM-based runners](https://github.blog/2024-06-03-arm64-on-github-actions-powering-faster-more-efficient-build-systems/)
for GitHub Team and Enterprise Cloud plans, with plans to offer them for open-source projects before the year's end.

These runners provide improvements in speed and energy consumption due to their reduced instruction set. They consume
30-40% less energy for some of the most widely deployed workflows and are 37% cheaper than their x64 counterparts.

However, not all workflows are ideal for ARM runners, especially those that depend on software or libraries not yet
optimized for ARM architecture, or that rely on x64-specific optimizations. Testing and evaluating your workflows will
help you identify any compatibility issues and measure the potential benefits in terms of speed, cost, and energy
consumption.

## Estimate Workflow Energy Consumption

Determining which strategy consumes fewer resources can sometimes be challenging. Tools like the [eco-ci-energy-estimation](https://github.com/green-coding-solutions/eco-ci-energy-estimation)
action allow us to get estimates and help us make informed decisions.

For instance, to determine whether caching npm dependencies would reduce resource consumption, I ran 5 workflow runs
with caching and 5 without. The result showed that caching npm dependencies reduced overall energy consumption and time.

{% image "./assets/energy-comparison.png", "Energy comparison of using caching vs not using caching" %}
*Energy comparison of using caching vs not using caching*

The following example demonstrates how to integrate this measurement tool into a workflow. Call `start-measurement`
before running the work to be measured, and `get-measurement` and `display-results` after.

```yaml
- name: Initialize Energy Estimation
  uses: green-coding-solutions/eco-ci-energy-estimation@v3
  with:
    task: start-measurement

- name: Tests measurement
  uses: green-coding-solutions/eco-ci-energy-estimation@v3
  with:
    task: get-measurement
    label: 'Install'

- name: Show Energy Results
  uses: green-coding-solutions/eco-ci-energy-estimation@v3
  with:
    task: display-results
```

Upon completion, the workflow produces a summary that looks like this:

{% image "./assets/estimation-summary.png", "Workflow summary showing measurement estimates" %}
*Workflow summary showing measurement estimates*

The action sends metrics data to metrics.green-coding.io by default. If you prefer not to send data, simply set
`send-data` to `false`.

## More Ways to Optimize Workflows

With these simple tips, you can significantly reduce costs, save time, and better allocate resources. For more tips,
I highly recommend the presentation "[Things your Pipeline Should (Not) Do](https://www.youtube.com/watch?v=mYBkSg1dz2Y)"
by my colleague Raniz, who inspired me to write this post.
