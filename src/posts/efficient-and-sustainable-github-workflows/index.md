---
title: 'Efficient and Sustainable GitHub Workflows'
description: "In today's fast-paced development environment, efficiency is important, not just in terms of time and cost but also sustainability. Over the past couple of years, I've integrated GitHub Actions into my daily workflow, discovering several simple yet effective strategies to make my processes more sustainable. Here, I share these insights to help you enhance your workflows with minimal effort."
date: 2024-06-07
author: Nizar
permalink: /{{ title | slugify }}/index.html
cover: 'assets/wind-turbine.jpg'
socialImage: '/assets/images/simple-tips-for-sustainable-workflows-social-image.jpg'
caption: 'Original photo by <a href="https://unsplash.com/@bfigas">Bruno Figueiredo</a> on <a href="https://unsplash.com/photos/white-windmill-during-day-KAXSflHqAl0">Unsplash</a>'
tags: [ci, automation, sustainability]
draft: true
---

In today's fast-paced development environment, efficiency is important, not just in terms of time and cost but also
sustainability. Over the past couple of years, I've integrated GitHub Actions into my daily workflow, discovering
several simple yet effective strategies to make my processes more sustainable. I hope these insights can help you
enhance your workflows with minimal effort.

## Cancel Redundant Jobs

When working on active branches, changes are often pushed in quick succession, leading to multiple instances of the
same workflows getting queued up or running in parallel. This redundancy can be quite wasteful, particularly for
pull request (PR) checks.

Fortunately, we can use [concurrency groups](https://docs.github.com/en/enterprise-cloud@latest/actions/using-jobs/using-concurrency#using-concurrency-in-different-scenarios)
to manage workflow executions more efficiently. By specifying a concurrency key, we can group workflows and control
their execution. GitHub ensures that only one job or workflow in the same concurrency group runs at a time.
Additionally, there can be at most one running and one pending job in a concurrency group at any given time.

The `cancel-in-progress` expression allows us to cancel any running job or workflow in the same concurrency group
when a new instance is triggered. The following example adds the workflow to a concurrency group called
`integration-tests` and ensures that only one instance of the workflow runs at any given time, canceling any
in-progress jobs when a new instance is triggered.

```yaml
on:
  push:
    branches:
      - main

concurrency:
  group: integration-tests
  cancel-in-progress: true
```
We can further customize the execution conditions by using dynamic expressions in the group naming.
For example, by referencing the branch that triggered the workflow, we can group workflows by branch.

{% raw %}
```yaml
concurrency:
  group: integration-tests-${{ github.ref }}
  cancel-in-progress: true
```
{% endraw %}

This ensures that the concurrency conditions are limited to the branches they are triggered by, so a workflow triggered
on one branch does not cancel or affect one running on another branch.

With this simple adjustment, we can ensure that our PR checks are efficient and do not waste resources by running
multiple redundant or outdated jobs, while still maintaining the integrity of our code base.

## Set Workflow Timeouts

The default workflow timeout is 6 hours, which can be wasteful if a process hangs. For workflows that typically finish
in under 2 minutes, setting a timeout of 10 minutes is more than sufficient.
This can be done by specifying `timeout-minutes` for the workflow.

```yaml
jobs:
  lint-checks:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```

There's no need to keep it running for another 5 hours and 50 minutes to know something went wrong. Instead, we can put
those 350 GitHub Actions minutes to better use elsewhere.

Optimizing timeouts is a straightforward step but can greatly enhance the sustainability of your workflows by minimizing the
idle resource consumption. You can find more information [here](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions).

## Utilize Caching for Efficiency

### Optimize Dependency Handling

Many workflow runs share the exact same dependencies, which must be downloaded each time. We can save time and
resources by caching them properly. For this, I like to use the
[setup actions](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#about-caching-workflow-dependencies).

The following example shows how to set up Node.js with caching:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
```

The action performs the caching on the `~/.npm` directory instead of the `node_modules`, providing benefits such as
smaller size and increased reusability across different environments since they are stored as tarballs and metadata
rather than installed packages.

Using `npm ci` instead of `npm install` also speeds up builds as it installs exact versions specified in the
`package-lock.json` file, thereby ensuring reproducible builds and avoiding dependency resolution overheads.

### Cache and Restore Build Assets

In some scenarios, we want to cache certain build outputs that do not change frequently and take a lot of time and
resources to create. We can use the [cache action](https://github.com/actions/cache) for those.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:

      - name: Cache Assets
        uses: actions/cache@v4
        with:
          path: assets
          key: assets
```

In the above example, we create the `assets` directory by restoring it from the cache. Any changes we make to it later
on will also be applied to the cache. An example use for this would be handling responsive image generation.
By restoring the images from the cache, the build process can skip generating images that already exist, and any new
images it creates will be saved in the cache for the next time. This saves time and resources.

However, if there are no key hits, the `assets` directory will not be restored and the build process will have to
recreate everything. This can happen when we use dynamic expressions in the key naming. For example, if we want to
reference the branches or operating systems, and so on. In those cases, we can specify `restore-key`, which will be
used to restore the cache if no hit is found for the `key`.

{% raw %}
```yaml
- name: Cache Assets
  uses: actions/cache@v4
  with:
    path: assets
    key: assets-${{ github.run_id }}
    restore-keys: |
      assets-
```
{% endraw %}

The example above references the branch in the `key` value. This means that it first tries to match against the most
recent assets cache for the current branch. If none are found, it tries to restore from the most recent assets cache
for any branch. This is because it will try to match against the most recent cache key that starts with `assets-`.

For further customizations, such as taking the operating system into the account, check the
[official repository](https://github.com/actions/cache).

## Optimize Workflow Triggers

We can avoid running workflows when they are not needed by using `paths` and `paths-ignore`, specifying which files or
directories should trigger workflows. This helps in focusing our resources on meaningful changes.

For example, to skip workflows for documentation changes:

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
```

Here, any change in the `docs` directory will not trigger the workflow, conserving resources for non-code updates.

To run workflows only for front-end code changes (e.g., JavaScript files):

```yaml
on:
  push:
    paths:
      - 'frontend/**.js'
```

This workflow triggers only when `js` files in the `frontend` directory are modified, ensuring relevant tasks like
linting are run only when there are relevant changes.

Using `paths` and `paths-ignore` efficiently reduces unnecessary workflow executions, making your processes more
sustainable and cost-effective.

For more advanced usage, refer to the official GitHub Actions documentation
[here](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore).

## Leverage ARM Architecture for Efficiency

GitHub has recently announced the availability of
[ARM-based runners](https://github.blog/2024-06-03-arm64-on-github-actions-powering-faster-more-efficient-build-systems/)
for GitHub Team and Enterprise Cloud plans and plans to offer them for open-source projects before the end of the year.

These runners provide improvements in speed and energy consumption thanks to their reduced instruction set. They have
been shown to consume 30-40% less energy for some of the most widely deployed workflows. They are also 37% cheaper than
their x64 counterparts, making them a no-brainer for suitable workflows.

However, not all workflows are ideal for ARM runners. For instance, workflows that depend on software or libraries not
yet optimized for ARM architecture, or that rely on x64-specific optimizations, may not run as well. Testing and
evaluating your workflows will help you identify any compatibility issues and measure the potential benefits in terms
of speed, cost, and energy consumption.

## Estimate Workflow Energy Consumption

It is not always clear which strategy consumes fewer resources. Tools like the
[eco-ci-energy-estimation](https://github.com/green-coding-solutions/eco-ci-energy-estimation) action allow us to get
estimates and help us make informed decisions.

For example, I wasn't sure whether caching npm dependencies would reduce resource consumption. With the help of this
tool, I ran 5 workflow runs with caching and 5 without and found that caching npm dependencies reduced overall energy
consumption and time.

{% image "./assets/energy-comparison.png", "Energy comparison of using caching vs not using caching" %}
*Energy comparison of using caching vs not using caching*

The following example shows how to set it up in a workflow to take measurements. Call `start-measurement` before
running the work to be measured, and `get-measurement` and `display-results` after.

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

Once the workflow is completed, it produces a summary like this:

{% image "./assets/estimation-summary.png", "Workflow summary showing measurement estimates" %}
*Workflow summary showing measurement estimates*

The action sends metrics data to metrics.green-coding.io by default. If you do not want that, set `send-data`
to `false`.

## More Ways to Optimize Workflows

With these simple tips, you might save a lot of cost, time, and resources that can be put to better use. For more tips,
I highly recommend watching the
"[Things your Pipeline Should (Not) Do](https://www.youtube.com/watch?v=mYBkSg1dz2Y)" presentation by my colleague
Raniz, who inspired me to write this post.
