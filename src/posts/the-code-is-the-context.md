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
featured: true
---

Most advice on working with agents focuses on orchestration and interaction strategies. But I keep
finding renewed significance in the software development fundamentals we've always known. After all,
agents don't just respond to how we prompt them, they also respond to what they find in the
codebase.

## Discovery

Agents start each session fresh, with no memory of previous work, just the prompt and whatever
context files we provide. So they search, read, and infer, assembling context from what they find.

This discovery process is constant. When writing a test, they search for patterns to follow. When a
fix fails, they explore to understand why. When preparing a commit message, they read changes to
summarize intent.

You can shape discovery through how you interact with and orchestrate the agents:

- **Delegation** keeps the main context clean. Subagents handle exploration and return only what's
  relevant.
- **Progressive disclosure** provides information just-in-time rather than front-loading everything.
- **Feedback loops** catch mistakes early. The faster agents can verify their work through tests,
  type checks, and linting, the less they diverge.

I cover these in my
[TDD Guard webinar](https://factor10.com/news/on-demand-webinar-5-pro-tips-from-developing-and-using-tdd-guard/).
But interaction strategies have limits. The deeper factor is the codebase itself: unclear code
forces more searching, disorganized systems lead to false assumptions, and complexity requires
lengthy explanations.

## What's Old Becomes New Again

When you work closely with a codebase for months or years, you develop home blindness. The
convoluted function that "works fine". The abstraction that made sense at the time. The naming
obvious to you but obscure to anyone else.

Agents don't have your context. They see the code as it is, not as you remember it.

Watch where they search repeatedly for the same concept. Notice when they misunderstand what a
function does despite reading it. Pay attention when they need long explanations to understand
concepts and constraints the code should express.

That friction is information. It points to familiar territory:

- **Self-documenting code** means less searching. When the functions and variables reveal their
  intent, agents don't need to trace through their implementations.

- **Single responsibility** means fewer surprises. When a function does one thing, assumptions hold.
  Fewer surprises means less recovery and backtracking.

- **Simplicity** means faster reasoning. Complex solutions require more context to understand. The
  less there is to infer, the faster discovery completes.

- **Tests** serve as executable documentation. Well-written tests tell agents what the code should
  do without requiring archaeology.

These aren't new. Agents make them visible in a new way.

## Closing Thoughts

This isn't a call to refactor your entire codebase. It's an invitation to notice what the agents
reveal, then act on it where it matters. The changes that help agents discover faster also make code
easier to review, reason about, and maintain.
