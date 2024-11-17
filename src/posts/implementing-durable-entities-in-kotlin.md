---
title: Implementing Durable Entities in Kotlin
description: >-
  This series explores how to implement Durable Entities in Kotlin, which are stateful objects that
  manage their own state and enable seamless persistence and resumption in serverless workflows.
  Though not natively supported in Kotlin, this series provides a step-by-step guide to replicating
  their functionality using orchestration instances. The series covers topics such as managing
  state, signaling entities, and cross-entity communication.
date: 2024-11-20
cover: /uploads/chess.jpg
coverAlt: Black and white chess pieces on a blurred background.
caption:
  Photo by <a href="https://unsplash.com/@hellenicsun">Fotis Nakos</a> on <a
  href="https://unsplash.com/photos/a-chess-board-with-a-chess-piece-MMgrFmTRpSU">Unsplash</a>
socialImage: /uploads/chess-social.jpg
tags: [automation, workflows, kotlin]
draft: true
---

I've been fortunate to work with some of the [greatest minds](https://factor10.com/) early in my
career, an opportunity I'm endlessly grateful for. Over the past year, I've worked with Erik Meijer
on [Automind](https://fortune.com/2024/04/02/mark-zuckerberg-ai-jobs-meta-brain-drain-erik-meijer/),
tackling some truly exciting challenges.

This experience introduced to Durable Functions, an abstraction that simplifies building stateful
workflows in serverless environments. Among its many features, Durable Entities stands out by
enabling developers to model stateful objects that manage their own state.

However, there's a catch: Durable Entities aren't supported in Kotlin or Java. Knowing Erik,
suggesting another language was out of the question. This set the stage for my challenge:
implementing Durable Entities in Kotlin.

## What are Durable Entities?

Before diving into implementation, let's first understand Durable Entities. They enable applications
to persist state across executions, conserve resources when idle, and seamlessly resume workflows
when needed. This makes them particularly valuable in scenarios like:

- Event-driven architectures.
- External approvals.
- Distributed workflows.

In essence, Durable Entities behave like long-lived, lightweight actors. They preserve their state
using event sourcing, a pattern where state changes are logged as events, allowing state to be
reconstructed by replaying these events. Entities also execute operations deterministically,
ensuring consistency even in distributed environments.

For example, the official C# documentation provides a simple counter entity, which maintains a value
and supports operations like adding, resetting, and retrieving the current value:

```csharp
[FunctionName("Counter")]
public static void Counter([EntityTrigger] IDurableEntityContext ctx)
{
    ctx.OperationName.ToLowerInvariant() switch
    {
        "add" => ctx.SetState(ctx.GetState<int>() + ctx.GetInput<int>()),
        "reset" => ctx.SetState(0),
        "get" => ctx.Return(ctx.GetState<int>())
    };
}
```

This functionality is powerful, but replicating it in Kotlin requires a creative approach. Let's
dive into how that can be achieved.

## The Challenge and Insight

Initially, I explored gRPC and the
[durabletask-protobuf](https://github.com/microsoft/durabletask-protobuf) library, inspired by
implementations in other languages. While this approach was promising, it wasn't successful.

A critical insight came from [Chris Gillum](https://github.com/cgillum), the creator of Durable
Functions, who highlighted that Durable Entities are
[implemented in other languages using orchestration instances](https://github.com/microsoft/durabletask-java/issues/194#issuecomment-2397984973).
This realization was a turning point, and not long after, I had my first Durable Entity in Kotlin.

## Introducing the Series

This series will guide you through the development process, step by step. Along the way, we'll
examine the principle and constraints that underpin Durable Entities, ensuring that our
implementation stays true to the design requirements.

Here's an example of a counter entity implemented in Kotlin, modeled after the C# example above. It
demonstrates how to define an entity and handle operations like "add", "reset", and "get":

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    asEntity(ctx, initialState = 0) {
        when (operationName) {
            "add" -> setState(getState<Int>() + getInput<Int>())
            "reset" -> setState(0)
            "get" -> returnResult(getState<Int>())
        }
    }
}
```

## What's Next

This series will cover the following topics step-by-step:

1. Managing State with Custom Status
2. Accessing Entities
3. One-Way Communication: Signaling Entities
4. One-Way Communication: Signaling Entities with Input
5. One-Way Communication: Cross-Communication
6. Two-Way Communication: Calling Entities

Whether you're already familiar with Durable Functions or exploring stateful serverless workflows
for the first time, this series will offer something for everyone. Stay tuned!
