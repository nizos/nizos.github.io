---
title: How I Use LLMs as a Developer
description: >-
  I have been using Large Language Models (LLMs) for the last two years. During this time, I’ve
  noticed that people’s opinions about LLMs vary dramatically. The community seems split—some
  developers swear by them, while others remain skeptical or outright dismissive. Personally, I find
  these differences fascinating because they highlight that there’s no single “right” way to think
  about LLMs, and definitely not a single right way of using them. Instead, the value you get
  largely depends on how you choose to approach them.
date: 2025-04-25
cover: /uploads/llm-visualization-social-image.jpg
coverAlt: Visualization of a Large Language Model
caption:
  Original photo by <a href="https://unsplash.com/@googledeepmind">Google DeepMind</a> on <a
  href="https://unsplash.com/photos/a-bunch-of-different-colored-objects-on-a-white-surface-RO_I_35SX7c">Unsplash</a>
socialImage: /uploads/llm-visualization-social-image.jpg
tags: [ai, llm, development]
featured: true
---

I have been using Large Language Models (LLMs) for the last two years. During this time, I’ve
noticed that people’s opinions about LLMs vary dramatically. The community seems split—some
developers swear by them, while others remain skeptical or outright dismissive. Personally, I find
these differences fascinating because they highlight that there’s no single “right” way to think
about LLMs, and definitely not a single right way of using them. Instead, the value you get largely
depends on how you choose to approach them.

Over the past year, I’ve had several conversations where people asked me how I actually use LLMs in
my day-to-day work. Rather than repeating myself, I decided to write it down. This post is a
reflection of my own journey–how my usage has evolved, what I’ve learned, and how LLMs have changed
the way I work as a developer.

## Exploring and Experimenting

When I first started out, I was mainly curious about what these models could actually do. I tried
asking them to generate tests, code snippets, and documentation. It was impressive, but I quickly
encountered familiar pitfalls: hallucinations,
[prompt drift](https://www.marilynfrank.com/word/prompt-drift), and context or output length
limitations. The rapid pace of model updates also introduced noticeable shifts–some users even
complained that the models felt “lazy” or less helpful after certain updates.

Interestingly, I noticed that I consistently got better results when saying “please” and “thank
you”. At first, this seemed silly, but later studies confirmed that polite interactions genuinely
influence result quality. Eventually, I realized it wasn’t merely about emotional pleading–being
deliberate and precise in my communication made the real difference. Clearly stating goals,
providing explicit context, and sharing relevant examples consistently led to improved outcomes.

Soon, my interactions became naturally conversational. I’d clearly describe an issue, provide tests
or code snippets, and outline exactly what I am aiming to achieve. If the model made incorrect
assumptions, I’d nudge it gently in the right direction. If its suggestions were suboptimal, I’d ask
clarifying questions. Over time, this approach felt less like prompting and more like a technical
discussion.

## Dealing with Context Drift

As conversations lengthened, context drift became noticeable. The model would occasionally lose
track of details provided earlier. However, as someone who practices Test-Driven Development (TDD),
this wasn’t a major issue. Breaking problems into smaller increments naturally prevented context
overload. Between iterations, I’d briefly remind it of critical details or qualities I aimed for.

While structured prompting greatly improved the results, it also made my prompts longer and more
cumbersome over time.

## Becoming A Better Technical Communicator

With practice, I learned to ask clearer, more concise questions without needing lengthy examples or
constant repetition of context. It pushed me to become more precise when articulating technical
challenges, patterns, and specifications–ultimately sharpening my technical communication overall.

For example, instead of pasting a block of code and asking: “I have this code that maps over
observables and applies some logic, but it doesn’t seem to emit anything in some cases. Any idea
what might be wrong?”

I might now ask something like: “I’m working on a data transformation pipeline that filters and maps
over nested observables. Under certain conditions, the inner stream completes before emitting. What
are some clean strategies to avoid silent drops in that case?”

Or if I’m exploring alternatives to a design: “How could we generalize this pattern so it supports
multiple input types while keeping the transformation logic decoupled from the source format?”

Being able to formulate questions like these, without dragging in unrelated implementation details,
has helped me communicate more effectively overall.

## Why I Still Write My Own Code

An important principle I’ve always adhered to is never copy-pasting code written by others into my
projects. Naturally, this extended to code generated by LLMs. Many developers happily embrace direct
code generation, and perhaps someday I’ll reconsider, but right now, it just doesn’t feel right to
me. Maybe it’s philosophical, but I firmly believe the code I introduce should be code that I have
personally written.

This principle has shaped my relationships with LLMs significantly. Rather than using them for code
completion or direct generation, I treat them as conversational partners–tools for discovery,
prototyping, rubber-ducking, and exploring curiosities. My interactions typically begin when I sense
potential improvements or approaches I haven’t yet considered. I ask questions, explore
possibilities, and deepen my understanding. Only once I clearly see the solution, and fully grasp it
myself, do I write the actual code.

## Do LLMs make us Smarter or Lazier?

This approach brings up the classic question: Does using calculators, search engines, or LLMs make
us smarter or lazier? Personally, I think it depends entirely on the mindset. Imagine working
alongside smarter, more experienced colleagues–do you delegate the difficult tasks to them, or do
you actively learn from their expertise? That’s how I view my relationship with LLMs: an opportunity
to question, learn, and become a better developer.

## What’s Next on My Journey?

The pace of innovation around LLMs continues to astonish me. I’m particularly eager to explore
several emerging tools and practices:

- Multi-Document Context \
   Allows models to pull in relevant information from multiple sources, helping them reason more
  effectively across large or fragmented codebases and documents. Instead of giving all the context
  upfront, you define reusable instructions or rules, and the model knows where to look and what to
  apply. ([awesome-mdc](https://github.com/benallfree/awesome-mdc/blob/main/what-is-mdc.md))
- Task Management System \
   These help break complex projects into smaller, manageable tasks and orchestrate their execution
  effectively. ([Claude Task Master](https://github.com/eyaltoledano/claude-task-master),
  [Boomerang Tasks](https://docs.roocode.com/features/boomerang-tasks))
- Model Context Protocol \
   A protocol that lets models seamlessly integrate with various tools and data sources,
  dramatically expanding their capabilities.
  ([MCP Introduction](https://modelcontextprotocol.io/introduction))
- Browser Automation for AI \
   Makes websites directly accessible to AI agents, greatly expanding how models can interact with
  web applications. ([Browser Use](https://docs.browser-use.com/introduction))
- AI Integration with GitHub Actions \
   Integrating AI models directly into development workflows, enriching and automating parts of the
  CI/CD process.
  ([GitHub Actions](https://docs.github.com/en/github-models/integrating-ai-models-into-your-development-workflow#using-ai-models-with-github-actions))

Admittedly, adopting some of these new technologies might challenge my current principle of writing
all the code myself. Nevertheless, I’m eagerly looking forward to seeing where this journey takes me
next.
