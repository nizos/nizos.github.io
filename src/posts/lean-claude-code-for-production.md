---
title: Lean Claude Code for Production
description: >-

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
featured: false
---

Many agentic coding demos showcase building landing pages, one-off scripts, or greenfield projects.
While those feats are impressive, the outputs are often single files with little thought for
maintainability. Even OpenAI fell into this trap in the ChatGPT 5 launch demo.

On the other end, some content focuses almost entirely on elaborate MCPs and agent orchestration
systems.

Both approaches have their place, but neither reflects how I use coding agents in real professional
software development. This lack of middle-ground coverage fuels two common misconceptions:

- Agentic coding is overly complex and requires heavy upfront investment.
- AI-generated code is unsuitable for disciplined, production-grade development.

Here's the workflow I've developed to consistently get strong, reliable results, without complex
orchestration or obsessive prompt tuning.

## Project Setup

Claude Code uses a `CLAUDE.md` file, usually in the project root, to store context and project setup
details. It's often created with the `/init` command when you first start working on a project.

A common mistake, one I've made myself, is stuffing this file with every conceivable instruction,
guideline, and best practice. It feels logical, you want the agent to "know everything" upfront, but
in practice, it backfires.

When the agent receives too many instructions at once, it's forced to juggle competing priorities.
This isn't just forgetfulness; it's a limitation of how large language models balance relevance when
instructions compete for attention. The result is inconsistent behavior and an experience that feels
frustratingly unreliable.

What works for me is keeping `CLAUDE.md` lean, ideally under 100 lines, focusing on:

- The project's context, purpose, and tech stack
- A brief project structure
- Common scripts to run

```markdown
# Project Name

A brief description of what this project does.

## Structure

- src/validators/ # Input validation patterns
- src/middlewares/ # Express middleware
- src/utils/ # Shared utilities and helpers
- test/factories/ # Test data factories

## Commands

npm run test # Run all tests npm run test:unit # Run unit tests only npm run lint # Check code
quality
```

This smaller, sharper file helps the agent with things it typically struggles with, or that are
unnecessarily expensive for it to figure out repeatedly on its own:

- Understanding the domain and aligning execution with the project's purpose
- Avoiding costly full-codebase scans to find existing interfaces, implementations, and helpers
- Knowing which scripts to run without having to look them up each time

This isn't about lowering your standards--it's about focusing the agent and enforcing rules through
guardrails, not bloated instructions.

## Devcontainers

While this is a "simple setup" guide, devcontainers deserve a spot here. They provide unmatched
consistency, simplicity, and security when working with agents. In fact, they're usually the only
real "setup" I do for my projects.

I use them to:

- Keep a consistent, isolated development environment
- Avoid conflicts between system and project dependencies
- Configure network isolation via a whitelist firewall

Even though I'm deliberate about dependencies and avoid auto-accept mode, the extra layer of
isolation is reassuring. It separates the development environment from the rest of the system.

You can find a simple starter here, check out how I configure it, or read more about it here.

## Code Quality

### Test-Driven Development

The biggest improvement in my agent-generated code quality has come from enforcing strict
Test-Driven Development (TDD):

1. Write a failing test first
2. Write the minimal code needed to pass
3. Refactor while keeping tests green

TDD encourages better design, thorough test coverage, and creates living documentation of your
codebase.

It works especially well for agentic coding because agents tend to:

- Jump straight to implementation code
- Write all tests at once or not run them
- Skip the refactoring step
- Implement more than the current test requires

The result is untested code, poor design decisions, over-engineering, and technical debt.

The challenge was getting the agent to follow TDD without constant reminders. My solution was
TDD-Guard, a tool that serves as a set of guardrails for Claude Code. It detects and blocks
violations such as implementing without a failing test, adding multiple tests at once, or
over-implementing.

With these rules enforced automatically, I can focus on solving problems and designing solutions
instead of policing the agent's TDD adherence.

### Linting, Formatting, and Commits

Similarly, I use `husky` with `lint-staged` to automatically lint and format code before commits.
With `commitlint`, I enforce conventional commit messages. This frees up more context and produces
more consistent behavior.

## Planning Work

Claude Code's planning mode is where I usually start. Here, the agent focuses on gathering
information and mapping out the steps to complete a task.

The key is to be deliberate and explicit in your instructions, while pointing it to the files and
references it needs. Instead of verbose guidelines on testing and design, I often point it to an
existing, well-structured component and its tests to use as a reference.

When the plan is ready, I don't obsess over perfection. The real value is in the context the agent
has gathered. I only intervene at this stage if it clearly missed an important aspect or if I spot
signs of over-engineering. It's usually more effective to address issues as they arise rather than
front-loading all corrections.

Finally, I rarely use auto-accept mode. Even though it can be faster, manually approving or steering
each step gives me more control and helps catch small deviations before they snowball.

## Managing Context

Models have a limited context window, think of it as their working memory. As it fills up,
performance gradually degrades.

Planning mode is excellent for gathering context without overloading the main agent with irrelevant
or low value details. This is because subagents are used to read all the relevant files, filter out
the noise, and then pass only the important findings back to the main agent.

This keeps the main agent's context lean and focused. You can know when Claude Code uses this
strategy when it is performing a `Task`. You can use the same strategy in any mode by simply asking
it to use a subagent to do any investigation work you need.

Even with this strategy, you'll eventually reach the limit. When that happens, Claude Code will
offer to compact the context; replacing it with a summary.

The problem is that summaries aren't perfect. They sometimes prioritize the wrong things or leave
out critical details. This is especially true when priorities shift mid-session. For example, you
might spend most of the session on trial-and-error, then pivot after a breakthrough. If the
compacted summary still focuses on the earlier, discarded work, the agent's future decisions will be
skewed.

To avoid this, I give custom instructions when triggering `/compact`, telling the agent exactly
which details to preserve. This keeps the session better aligned with the findings I value.

Sometimes my work spans multiple sessions, or I've built up a context I want to preserve for later.
In these cases, I ask the agent to save the current context or findings to a temporary markdown
file, essentially a session-specific `CLAUDE.md`.

Before saving, I often have the agent propose updates based on progress or new findings. This quick
review step removes noise, clarifies ambiguous points, and ensures the saved version captures only
what's worth carrying forward.

In the next session, I point the agent to that file and have it to read it in full, followed by
gathering any additional information it needs. This approach avoids relying on compaction summaries
and gives a clean, intentional handoff between sessions.

## Wrapping up

This has been my setup for the last couple of months, and I'm very happy with the results.

While there are situations where it might make sense to add custom subagents, personas, experiment
with MCPs, or build more advanced orchestration, these aren't things you need to start with, and
they're often not necessary if your main objective is software quality.

I also find that "prompt optimization" offers very little return for agentic coding, especially when
you know what you want. The real gains come from hands-on experience and building an intuition for
how to interact with the agent effectively.

For me, the formula is simple:

- Be deliberate and explicit about what you want to achieve.
- Give the agent an efficient way to find the information it needs.
- Point it towards relevant examples of the approach you want it to follow.

If the work drifts in the wrong direction, stop it early, explain the correction, and continue. You
can also press `Escape` twice to roll back to a previous point in the session.
