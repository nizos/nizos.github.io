---
title: Lean Claude Code for Production
description: >-
  Many agentic coding demos showcase landing pages, one-off scripts, or greenfield projects. While
  technically impressive, they often produce single files with little thought for maintainability.
  Even OpenAI's ChatGPT 5 launch demo followed this pattern. At the other extreme, some content
  focuses almost entirely on elaborate integrations and orchestrations.
date: 2025-08-15
cover: /uploads/scaffolding.jpg
coverAlt:
  Multi-level scaffolding with intersecting stairs and beams, evoking structured workflows and
  support systems
caption:
  Original photo by <a href="https://www.pexels.com/@valentinantonucci/">Valentin Antonucci</a> on
  <a href="https://www.pexels.com/photo/scaffolding-in-grayscale-photo-860963/">Pexels</a>
socialImage: /uploads/scaffolding.jpg
tags: [ai, llm, development, agents, tdd]
featured: true
---

Many agentic coding demos showcase landing pages, one-off scripts, or greenfield projects. While
technically impressive, they often produce single files with little thought for maintainability.
Even OpenAI's ChatGPT 5 launch demo followed this pattern. At the other extreme, some content
focuses almost entirely on elaborate integrations and orchestrations.

Both have their place, but neither reflect how I ship production code with agents. That gap in
middle-ground coverage feeds two common misconceptions:

- AI-generated code cannot meet disciplined, production-grade standards.
- Agentic coding is inherently complex and needs heavy upfront investment.

Here's the middle path I use in real projects. Simple setup, clear guardrails, deliberate steering,
and no ceremony.

## Project Setup

Claude Code keeps project context and details in `CLAUDE.md`, usually created with the `/init`
command when you first start working on a project. A common trap I've fallen into myself is stuffing
it with every rule and best practice. It feels logical. You want the agent to "know everything"
upfront, but in practice, it often backfires.

When the file contains many goals and constraints at the same level, the model struggles to
prioritize. This isn't forgetfulness—it's how large language models work when instructions compete
for attention.

This increases inconsistency and makes behavior feel frustratingly unreliable.

What works for me is keeping `CLAUDE.md` lean, ideally under 100 lines, focusing on:

- The project's context, purpose, and tech stack
- A brief project structure
- Common scripts to run

Here's roughly what I include:

```md
# Project Name

A brief description of what this project does.

## Structure

- src/validators/      # Input validation patterns
- src/middlewares/     # Express middleware
- src/utils/           # Shared utilities and helpers
- test/factories/      # Test data factories

## Commands

npm run test           # Run all tests
npm run test:unit      # Run unit tests only
npm run lint           # Check code quality
```

This lean file helps the agent with things it typically struggles with or would waste time and
tokens figuring out repeatedly:

- Understanding the domain and aligning execution with the project's purpose
- Avoiding costly full-codebase scans to find existing interfaces, implementations, and helpers
- Knowing which scripts to run without having to look them up each time

This isn't about lowering your coding standards: abandoning design patterns, functional programming
principles, or testing requirements. It's about enforcing these standards through guardrails rather
than bloated instructions.

## Devcontainers

Even in a simple setup, [devcontainers](https://docs.anthropic.com/en/docs/claude-code/devcontainer)
are worth it. They provide a consistent, reproducible, and isolated environment with all project
dependencies pre-installed and pre-configured.

They prevent clashes between system and project dependencies and can gate network access with a
whitelist firewall.

## Code Quality

### Test-Driven Development

The biggest quality gain comes from enforcing strict Test-Driven Development (TDD):

1. Write a failing test first.
2. Write the minimal code to pass.
3. Refactor while keeping tests green.

Agents are good at producing code quickly. They are less consistent at sequencing work. TDD supplies
the sequence. It also gives short, objective feedback loops that the agent can reason about.

Without this structure, agents tend to:

- Jump straight to implementation code
- Write all tests at once
- Skip test runs
- Skip the refactoring step
- Implement more than the current test requires

The result is untested code, poor design decisions, over-engineering, and technical debt.

To make TDD non-negotiable, I built [TDD-Guard](https://github.com/nizos/tdd-guard) for Claude Code.
It blocks violations such as implementing without a failing test, adding multiple tests at once, or
over-implementing.

Beyond TDD, it can enforce linting rules, like strict functional programming patterns, ensuring the
agent follows your coding standards automatically.

With these rules enforced automatically, I focus on the problem and the design instead of policing
process. TDD itself encourages better design, thorough test coverage, and creates living
documentation of your codebase.

### Linting, Formatting, and Commits

Similarly, I use [husky](https://github.com/typicode/husky) with
[lint-staged](https://github.com/lint-staged/lint-staged) to automatically lint and format code
before commits. With [commitlint](https://github.com/conventional-changelog/commitlint), I enforce
conventional commit messages. This frees up more context and produces more consistent behavior.

## Planning Work

Claude Code's planning mode is where I usually start. Here, the agent focuses on gathering
information and mapping out the steps to complete a task.

The key is to be deliberate and explicit in your instructions, while pointing it to the files and
references it needs. Instead of verbose guidelines on testing and design, I show it an existing,
well-structured component and its tests as an example.

When the plan is ready, I don't obsess over perfection. The real value is in the context the agent
has gathered. I only intervene at this stage if it clearly missed an important aspect or if I spot
signs of over-engineering. It's usually more effective to address issues as they arise rather than
front-loading all corrections.

Finally, I rarely use auto-accept mode. Even though it can be faster, manually approving or steering
each step gives me more control and helps catch small deviations before they snowball.

## Managing Context

Models have a limited context window—think of it as their working memory. As it fills up,
performance gradually degrades.

Planning mode is excellent for gathering context without overloading the main agent with irrelevant
details. It can delegate investigation to subagents, which read the relevant files, filter out
noise, and pass back only the important findings.

This keeps the main agent's context lean and focused. You'll see Claude Code using this strategy
when it performs a `Task`. You can use the same strategy in any mode by simply asking it to use a
subagent to do any investigation work you need.

Even with this strategy, you'll eventually reach the limit. When that happens, Claude Code will
offer to compact the context, replacing it with a summary.

The problem is that summaries aren't perfect. They sometimes prioritize the wrong things or leave
out critical details.

This is especially true when priorities shift mid-session. For example, you might spend most of the
session on trial-and-error, then pivot after a breakthrough. If the compacted summary still focuses
on the earlier, discarded work, the agent's future decisions will be skewed.

To avoid this, I give custom instructions when triggering `/compact`, telling the agent exactly
which details to preserve. This keeps the session better aligned with the findings I value.

Sometimes my work spans multiple sessions, or I've built up a context I want to preserve for later.
In these cases, I ask the agent to save the current context or findings to a temporary markdown
file, essentially a session-specific `CLAUDE.md`.

Before we finish, I often have the agent propose updates to this document based on our progress or
new findings. This quick review step removes noise, clarifies ambiguous points, and ensures the
saved version captures only what's worth carrying forward.

In the next session, I point the agent to that file and have it read it in full, followed by
gathering any additional information it needs. This approach avoids relying on compaction summaries
and gives a clean, intentional handoff between sessions.

## Bottom Line

I've been using this setup for the last couple of months, and I'm very happy with the results.

Custom agents, personas, MCPs, and orchestration can help in specific cases. You most likely don't
need them to start, especially if your main objective is business value and software quality.

Prompt optimization has limited return here, especially when you already know the outcome you want.
The bigger gains come from practice and building intuition for effectively interacting with agents.

For me, the formula is simple:

- Be deliberate and explicit about what you want to achieve.
- Give the agent an efficient way to find the information it needs.
- Point it towards relevant examples of the approach you want it to follow.

If work drifts, stop it early, explain the correction, and continue. Claude Code also lets you press
`Escape` twice to roll back to a previous point in the session.

No elaborate orchestration needed—just lean, deliberate practice.
