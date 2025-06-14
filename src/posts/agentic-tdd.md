---
title: Agentic TDD
description: >-
  I've always written my own code. Not because I had to, but because I wanted to. Even after years
  of using LLMs (Large Language Models) in my workflow, I remained adamant about handling production
  code myself. That changed, at least a little, last week.
date: 2025-06-16
cover: /uploads/hand-tools.jpg
coverAlt: Two crossed wrenches on a white surface, symbolizing development tools and craftsmanship
caption:
  Original photo by <a href="https://www.pexels.com/@pixabay/">Pixabay</a> on <a
  href="https://www.pexels.com/photo/stainless-steel-close-wrench-on-spanner-210881/">Pexels</a>
socialImage: /uploads/hand-tools.jpg
tags: [ai, llm, development, agents]
featured: false
---

I've always written my own code. Not because I had to, but because I wanted to. Even after years of
using LLMs (Large Language Models) in my workflow, I remained adamant about handling production code
myself. That changed, at least a little, last week.

## Exploring Coding Agents

I subscribed to Claude Code to experience firsthand how an AI-powered coding agent feels in
practice. My first project was creating a FigJam-inspired whiteboard. Claude Code handled almost
everything—from suggesting dependencies and initializing the project to setting up tools,
configuring GitHub CI and security workflows, and even proposing a detailed project plan with tasks.

Although I've seen plenty of demonstrations online, experiencing it myself was genuinely surprising.
There was something uniquely special about how it understood my intentions and interacted with me.

## First Encounter with Agentic TDD

One particularly memorable moment was guiding it through Test-Driven Development (TDD). Initially, I
had to clearly outline the process in the instructions document. Once those guidelines were set,
watching it autonomously adhere to TDD principles felt profound. It reminded me of hearing the
[first song sung by a computer](https://en.wikipedia.org/wiki/Daisy_Bell)—unexpected, imperfect, but
a glimpse of something profound.

![Demo of Claude Code doing TDD](/uploads/claude-code-tdd.gif)

I found providing Claude Code with a pre-commit script, which handled formatting, linting, and
running unit and integration tests, very helpful. This simplified the agent's workflow and reduced
the amount of explicit guidance needed.

## Where the Agent Falls Short

Despite these impressive capabilities, I quickly recognized why software engineers remain necessary.
I still had to handle critical architectural decisions and testing strategies, which is especially
tricky when working with canvas-rendered elements not easily tested through standard DOM queries. I
frequently had to balance simplicity and complexity.

Claude Code often added new functions instead of refactoring existing ones, likely to avoid breaking
working code. It also missed refactoring opportunities in the test code unless explicitly prompted.
Personally, I prefer tests to remain clean and concise, a habit I learned from senior colleagues at
[factor10](https://factor10.com/). Extracting common setup logic into shared helpers ensures tests
remain readable and maintainable.

One frustration I encountered was Claude Code's use of `any` in implementation code, accompanied by
disabling linting rules to silence complaints. It also tried reverting a package upgrade due to
required configuration changes. Both instances required me to intervene, clarify my preferences, and
update its guidelines.

## Putting it to Work in Production

I also tested Claude Code in a real-world customer project evaluating AI development tools. Its
ability to navigate larger, practical scenarios exceeded my expectations! It still required
deliberate guidance, but the tool proved invaluable for prototyping and swiftly handling vast
amounts of information. I often found myself "babysitting", refining test helpers and suggesting
architectural simplifications. Overall, the early results pleased both the client and my colleagues.

## Productivity Gains & Their Costs

Reflecting further, I recognized this productivity boost could be leveraged differently. As a
developer, I could dedicate extra time to quality improvements—optimizing performance, refining
tooling, or enhancing user experience—while maintaining the same pace. Alternatively, I maintain
existing quality levels while significantly increasing development speed. Currently, I find myself
balancing both increased speed and quality improvements.

Another notable observation was how increased productivity shifted bottlenecks toward code reviews.
Personally, I'm not a big fan of traditional pull request workflows; important design decisions
ideally occur upfront through pair programming or quick collaborative discussions. Real-time
interactions clarify intentions and issues effectively, reducing later friction.

Performance of tests and pipelines is another potential bottleneck. With agentic coding and TDD,
tests run multiple times per change, quickly accumulating and causing significant delays if not
optimized.

## Why Agentic TDD

Using TDD with agentic coding might not resonate with everyone, and that's perfectly fine.
Personally, TDD keeps me productive, effective, and sane. Although it slows down the agent, TDD
ensures I understand and agree with the changes it makes. The reasoning and tests created by the
agent provide me with the context to follow along and interfere when needed.

I also wonder if TDD might reduce the risk of inadvertently introducing protected or memorized code.
I'm uncertain, but it's intriguing.

## Conclusion

Stepping back, it's fascinating how swiftly agentic coding became mainstream, seemingly overnight,
even though the fundamental technology behind LLMs remains unchanged. Previously, we manually
managed task lists and prompted models methodically, reviewing outputs and providing feedback.
Essentially, we acted as intermediaries between the LLM and our system. Now, we've stepped aside,
allowing models to
directly handle this [loop and receive immediate feedback via tools](https://philz.dev/blog/agent-loop/).

Similarly, it is impressive how the
[MCP (Model Context Protocol) loop](https://www.anthropic.com/news/agent-capabilities-api) is both
simple yet impactful. Claude Code retrieves available tools, reasons about appropriate actions,
executes tool calls, and iterates until successful.

While I sometimes prefer making quick changes myself, I'm exploring how to minimize situations where
I feel compelled to step in. There are, however, times when that is not as easy due to tooling
limitations. This becomes clear when Claude Code tries to rename something across files using `grep`
or `regex`, but fails due to syntax variations.

Despite this, Claude Code didn't just assist—it changed how I think about building software. I'm
still learning to work with it, but I'm already sure of one thing: I don't want to go back.

## Practical Tips

If you're curious about Claude Code or are already experimenting, here are personal tips:

- Interrupt early if the agent veers off track.
- Commit frequently. You can also ask it to undo changes.
- Compact context between large tasks for best results.
- Regularly refine instructions, something I admittedly don't always prioritize enough.

Things to try:

- Use [MCP servers](https://github.com/punkpeye/awesome-mcp-servers) to provide the agent with
  direct feedback.
- Try the planning mode for investigative tasks.
- Share screenshots to clarify complex tasks.
- Leverage tools like
  [Prompt Improver](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-improver).
- For advanced users: experiment with the
  [git worktree pattern](https://github.com/anthropics/claude-code/issues/1052).

Here's a guideline example to encourage autonomous TDD:

- Always start with a test that fails for the correct reason.
- Write only one test at a time.
- Use a single assertion per test.
- Verify test infrastructure before testing actual behavior.
- Provide stub implementations to avoid errors unrelated to actual behavior.
- Tests should fail due to incorrect behavior, not on missing methods/properties.
- Implement the minimal necessary code to pass the test.
- Don't add properties, methods, or logic that aren't required by the current failing test.
- Once the test passes, refactor both test and implementation code.

Lastly, check out the official
[Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
guide. It's genuinely helpful.
