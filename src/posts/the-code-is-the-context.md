---
title: The Code is the Context
description: >-
  Most advice on working with agents focuses on orchestration and interaction strategies. But I keep finding renewed significance in the software development fundamentals we've always known. After all, agents don't just respond to how we prompt them, they also respond to what they find in the codebase.
date: 2025-12-01
cover: /uploads/lighthouse.jpg
coverAlt: Close-up of a lighthouse lantern room with glass panels and metal railing, symbolizing navigation and timeless guidance
caption: Original photo by <a href="https://unsplash.com/@leslie_outofdoors">Leslie Cross</a> on <a href="https://unsplash.com/photos/a-black-and-white-photo-of-a-lighthouse-_uBfo8qRBEg">Unsplash</a>
socialImage: /uploads/lighthouse.jpg
tags: [ai, llm, development, agents]
featured: false
draft: true
---

Most advice on working with agents focuses on orchestration and interaction strategies. But I keep
finding renewed significance in the software development fundamentals we've always known. After all,
agents don't just respond to how we prompt them, they also respond to what they find in the
codebase.

## Discovery

Agents start each session fresh, with no memory of previous work, just the prompt and whatever
context files we provide. So they search, read, and infer, building a mental model from what they
find.

This discovery process is constant. When writing a test, they search for patterns to follow. When a
fix fails, they explore to understand why. When preparing a commit message, they read changes to
summarize intent.

The cost, however, depends on the codebase itself. Unclear code forces more searching, disorganized
systems lead to false assumptions, and complexity requires lengthy explanations.

## Reducing Discovery Costs

You can reduce discovery costs from two directions. The first is how you interact with agents during
the work itself. The second is the quality of the code they encounter.

### Orchestration Strategies

Several techniques make discovery more efficient. I cover these in my
[tdd-guard webinar](https://factor10.com/news/on-demand-webinar-5-pro-tips-from-developing-and-using-tdd-guard/),
including:

- **Delegation** keeps the main context clean. Subagents handle exploration and return only what's
  relevant.
- **Progressive disclosure** provides information just-in-time rather than front-loading everything.
- **Feedback loops** catch mistakes early. The faster agents can verify their work through tests,
  type checks, and linting, the less they wander.

But interaction strategies only go so far. The codebase itself shapes how efficiently agents can
discover what they need.

### Software Qualities

The same agent performs differently across codebases, sometimes even within different parts of the
same codebase, despite identical interaction strategies and tools. A few qualities drive this
difference:

- **Self-documenting code** means less searching. When the functions and variables reveal their
  intent, agents don't need to trace through implementations to understand what something does.

- **Single responsibility** means fewer surprises. When a function does one thing, assumptions hold.
  Fewer surprises means less recovery and backtracking. You want to encapsulate complexity without
  obscuring it.

- **Simplicity** means faster reasoning. Complex solutions require more context to understand.
  Simple solutions fit into the agent's working memory. The less there is to infer, the faster
  discovery completes.

- **Tests** serve as executable documentation. Well-written tests tell agents what the code should
  do without requiring archaeology. They provide examples of usage, expected behavior, and edge
  cases.

These principles aren't new. But working with agents makes their importance visible in ways you
might have stopped noticing.

## What's Old Becomes New Again

When you work closely with a codebase for months or years, you develop home blindness. The
convoluted function that "works fine". The abstraction that made sense at the time. The naming
obvious to you but obscure to anyone else.

Agents don't have your context. They see the code as it is, not as you remember it. When they
struggle, that struggle is information. It points at friction you stopped noticing.

Watch where they search repeatedly for the same concept. Notice when they misunderstand what a
function does despite reading it. Pay attention when they need long explanations to understand
constraints that should be obvious from the code structure itself.

This struggle reveals what matters. When agents consistently trip over the same issues, they're
pointing at principles worth reinforcing: self-documenting code, single responsibility, simplicity,
to name a few.

## Closing Thoughts

This isn't a call to refactor your entire codebase. It's an invitation to notice what the agents
reveal, then act on it where it matters. The changes that help agents discover faster also make code
easier to review, reason about, and maintain.
