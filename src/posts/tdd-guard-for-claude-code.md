---
title: TDD Guard for Claude Code
description: >-
  Claude Code fit well into my workflow, but sticking to Test-Driven Development (TDD) principles
  still needed occasional reminders: one test at a time, fail first, no over-implementation. It
  worked, but it wasn’t effortless. So I built TDD Guard, a utility that handles that for me and
  keeps my attention focused on designing solutions rather than policing TDD.
date: 2025-07-21
cover: /uploads/industrial-machine.jpg
coverAlt: Close-up of interlocking metal gears in an industrial machine
caption:
  Original photo by <a href="https://www.pexels.com/@pixabay/">Pixabay</a> on <a
  href="https://www.pexels.com/photo/gray-scale-photo-of-gears-159298/">Pexels</a>
socialImage: /uploads/industrial-machine.jpg
tags: [ai, llm, development, agents, tdd]
featured: true
---

Claude Code fit well into my workflow, but sticking to Test-Driven Development (TDD) principles
still needed occasional reminders: one test at a time, fail first, no over-implementation. It
worked, but it wasn’t effortless. So I built [TDD Guard](https://github.com/nizos/tdd-guard), a
utility that handles that for me and keeps my attention focused on designing solutions rather than
policing TDD.

## Leveraging Hooks

The breakthrough occurred when Anthropic announced
[Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) for Claude Code—coincidentally, the
very day I was seeking a better solution. Hooks automatically execute commands based on predefined
conditions, such as before or after an agent’s action, making them ideal for enforcing coding
standards.

I began by creating a hook that intercepts all file modification operations before execution,
triggering validation checks for common TDD violations:

- Implementing functionality without a relevant failing test
- Implementing more than necessary to pass a test
- Adding more than one test at a time

The validator integrates hook event data, the agent’s current todo list, and the latest test run
output. It then invokes a separate Claude Code session to verify adherence to TDD principles.

Since Claude Code hooks run as separate processes, TDD Guard persists context data to files between
each phase. This approach allows different hooks, like TDD validation before a change and lint
checks after, to access shared state without relying on complex inter-process communication. It
keeps the system reliable and easy to reason about.

If no violations are detected, the hook proceeds without interference. But when a violation is
found, it blocks the action and returns feedback clearly stating the issues, along with corrective
guidance.

<video controls width="100%" class="blog-video">
  <source src="/uploads/videos/tdd-guard-demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Dogfooding the Development

With the prototype integrated directly into my workflow, improvements were immediately apparent.
Eliminating manual reminders was a refreshing change. Yet, this initial success seemed suspiciously
smooth, suggesting the agent might be influenced by contextual TDD terminology rather than
validation logic.

Testing TDD Guard in an unrelated project confirmed this suspicion. Some clear violations slipped
through, while valid actions were mistakenly blocked, sometimes prompting humorous attempts by the
agent to circumvent restrictions using terminal commands.

## Integration Testing

That prompted me to invest in robust integration tests. I implemented comprehensive test data
factories covering various scenarios:

- Empty, in-progress, completed, or irrelevant todo lists
- Diverse test outputs, including empty, irrelevant passes, and various failure types
- Modifications including minimal implementations, excessive functionality, multiple tests, and
  diverse refactoring cases

This strategy enabled easy adjustments to data structures and facilitated quick support for new
languages like Python without extensive test rewrites. These tests also accommodated Claude Code’s
distinct modification tools: Write, Edit, and MultiEdit.

## Context Engineering

Each of Claude Code's file operation tools behaves differently. Write generates complete file
contents, while Edit and MultiEdit apply targeted modifications to existing code. These differences
made static prompts feel inefficient and misaligned across many cases.

One-size-fits-all prompts often led to confusing or conflicting behavior, especially when only some
context was relevant to the operation. For example, Edit or MultiEdit might attempt to introduce
three tests, two of which already existed and were simply refactored. In such cases, the prompt
needed to include guidance for identifying genuinely new tests. But the same guidance would be
irrelevant for a Write operation, which always starts from a clean state.

To address this, I built a dynamic system that assembles only the relevant instruction modules based
on the operation type and situation. This ensures the model receives clear, concise context tailored
to the task at hand.

## Multi-Model Support

As test complexity increased, performance optimization became crucial. Slow integration tests
impeded rapid iterations required to refine validation instructions effectively. To address this, I
integrated Anthropic’s API into TDD Guard, enabling separate configurations for production and
integration environments. This significantly accelerated feedback loops and also exposed unexpected
parsing issues, as some models frequently elaborated or provided code examples before finalizing
responses.

## Rules vs. Mindset

Despite improvements, scenario tests still exhibited inconsistencies due to subjective model
interpretations of TDD principles, notably during refactoring. Explicit rule enforcement resolved
test inconsistencies but led to mechanical adherence by the agent, which did not translate into
improved software quality.

In one experiment, I had Claude Code implement a shopping cart without explicit quality
instructions. While TDD Guard effectively blocked violations, the resultant code demonstrated issues
such as tight coupling, duplication, and poor overall design.

Inspired by my mentor, Per at factor10, who recently shared
[reflections on this topic](https://programmaticallyspeaking.com/a-tdd-mindset.html), I began
exploring how to encourage a genuine TDD mindset. Could aspects of this mindset be emulated using
hooks?

## Meaningful Refactoring

Initially, I considered employing a reviewing model to suggest meaningful refactorings. However,
lacking sufficient system-wide context, this approach risked inadvertently increasing complexity
rather than simplifying the solution, a common problem with local rather than global optimization.
Providing comprehensive context to the model proved both impractical and prohibitively expensive.

Instead, I integrated lightweight linting tools such as Sonar to identify complexities and code
standard violations, prompting refactoring tasks.

Unfortunately, post-action hooks were weakly enforced, frequently resulting in deferred or ignored
refactoring tasks. To strengthen enforcement, I stored identified issues, mandating resolution in
subsequent pre-action validation phases. Deliberately withholding specific issue details initially
encouraged the agent to attempt meaningful refactorings independently. Persistent issues were later
explicitly communicated as feedback.

## Balancing Art and Science

Defining “meaningful refactoring” remains inherently subjective and context-dependent, with varying
interpretations of quality standards, design principles, and complexity among developers and teams.

Moreover, automated linting rules primarily encouraged superficial changes, such as smaller function
sizes, rather than coherent functionality. Recognizing this limitation, I concluded TDD Guard should
enforce basic linting rules during refactoring cycles, leaving deeper, meaningful design
considerations to the developers themselves. After all, engaging actively in system design and
architecture remains one of programming’s most enjoyable aspects.

## Wrapping up

The TDD Guard project began two weeks ago during a relaxed, collaborative yearly event, a BBQ at
[Jimmy](https://jimmynilsson.com/)’s place with colleagues from
[factor10](https://www.factor10.com/). The initial prototype, a simple “cat detector” blocking
modifications containing “mew”, served as a quick validation of core concepts.

I intentionally retained these early explorations in the project’s history as a testament to
something I deeply believe in: that joy, authenticity, meaningful companionship, and psychological
safety nurture random curiosity and creativity into tangible innovations.

Applying TDD principles and dogfooding throughout the development enabled rapid iterations and
valuable community contributions, including Python support. The community’s warm reception,
enthusiastic feedback, and collaborative spirit have been profoundly motivating.

I'm especially grateful to my mentor [Martin](https://recurse.se/), whose encouragement and belief
in the idea helped bring it to life.

Feel free to explore [TDD Guard](https://github.com/nizos/tdd-guard), and please reach out with
feedback or contributions. Your insights are invaluable and greatly appreciated.
