---
title: Implementing Durable Entities in Kotlin - Persisting State
description: >-
  Durable Entities require a structured way to reference specific instances. This post introduces
  Entity IDs, which uniquely identify entity instances, and refines entity creation with a
  lightweight abstraction. By aligning with how Durable Entities are structured in other languages,
  we make instance creation more intuitive while keeping the implementation clean and flexible.
date: 2025-01-01
cover: /uploads/chess.jpg
coverAlt: Black and white chess pieces on a blurred background.
caption:
  Photo by <a href="https://unsplash.com/@hellenicsun">Fotis Nakos</a> on <a
  href="https://unsplash.com/photos/a-chess-board-with-a-chess-piece-MMgrFmTRpSU">Unsplash</a>
socialImage: /uploads/chess-social.jpg
tags: [automation, workflows, durable-entities]
draft: false
featured: false
---

## Introduction

Durable Entities provide a way to model long-lived, stateful objects in serverless workflows, but
they aren't natively supported in Kotlin. In the
[previous post](/implementing-durable-entities-in-kotlin/), we introduced Durable Entities and
explored their key principles, such as event sourcing and deterministic execution.

A fundamental requirement of Durable Entities is persisting state across executions to ensure
entities remain functional between invocations. Since Durable Entities aren't available in Kotlin,
we can achieve this using custom status metadata, a built-in feature of Durable Orchestrations that
allows storing arbitrary state tied to an instance.

This post demonstrates how to persist and retrieve state using custom status. We will walk through
initializing and reading the state of a Counter entity, establishing a foundation for more advanced
features in later posts.

## Persisting State in an Orchestration

The first step in making an entity stateful is to ensure it can store and retain values between
executions. We define a Counter orchestration that initializes a stored value.

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    // Set initial value
    ctx.setCustomStatus(0)
}
```

This function initializes a Counter entity and assigns it a starting value of 0 using
`ctx.setCustomStatus(0)`. The orchestration is currently static as it stores a value but does not
yet support modifications to it. In later posts, we will extend it to allow updates through external
inputs.

## Creating An Orchestration Instance

Before interacting with the Counter, we need to create instances of it. In Durable Functions,
orchestrations are typically instantiated using HTTP-triggered functions, which allow external
systems to create and manage them on demand.

The following function starts a new instance of the Counter orchestration:

```kotlin
@FunctionName("Create")
fun create(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    // Start a new Counter instance
    val instanceId = ctx.client.scheduleNewOrchestrationInstance("Counter")

    // Return the instance ID so we can interact with it later
    return request
        .createResponseBuilder(HttpStatus.OK)
        .body("Created Counter with ID: $instanceId\n")
        .build()
}
```

The function starts an orchestration by calling `scheduleNewOrchestrationInstance("Counter")` and
returns the generated instance ID which will be used later to interact with it. We can now create a
counter instance using `curl`:

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Create
Created Counter with ID: 9864a3e8-4f01-4201-8920-0b628c739bee
```

At this point, we have an instance that persists state, but we need a way to retrieve its stored
value.

## Retrieving State from the Orchestration

To fetch the stored value of the Counter, we define another HTTP-triggered function:

```kotlin
@FunctionName("Get")
fun get(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    // Extract instanceId from query parameters
    val instanceId = request.queryParameters["instanceId"]
        ?: return request.createResponseBuilder(HttpStatus.BAD_REQUEST)
            .body("instanceId required\n")
            .build()

    // Retrieve the counter value from custom status
    val counterValue = ctx.client
        .getInstanceMetadata(instanceId, true)
        ?.readCustomStatusAs(Int::class.java)

    // Return the current counter value
    return request.createResponseBuilder(HttpStatus.OK)
        .body("Counter value: $counterValue\n")
        .build()
}
```

This function looks up an orchestration instance by its `instanceId`, retrieves its stored custom
status, and returns the current counter value. To make the retrieval logic more reusable and
maintainable, we introduce an extension function:

```kotlin
fun <T> DurableTaskClient.getEntityState(entityId: String, returnType: Class<T>): T? {
    return this.getInstanceMetadata(entityId, true)?.readCustomStatusAs(returnType)
}
```

With this abstraction, our `Get` function becomes cleaner and more intuitive:

```kotlin
@FunctionName("Get")
fun get(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    // Get entityId from request query parameters
    val entity = request.queryParameters["entityId"]
        ?: return request.badRequest("entityId required")

    // Get the state of the Counter entity as an Int
    val counterValue = ctx.client.getEntityState(entity, Int::class.java)

    // Return an HTTP response containing counter's current value
    return request.createResponseBuilder(HttpStatus.OK)
        .body("Counter value: $counterValue\n")
        .build()
}
```

This approach hides implementation details, keeping our code readable.

## Verifying State Persistence

Now that we can create and retrieve a counter instance, let us verify that the state persists:

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Create
Created Counter with ID: af842648-5ffe-4be3-bb17-27aabf303dcb

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=af842648-5ffe-4be3-bb17-27aabf303dcb
Counter value: 0
```

The counter instance correctly initializes and maintains its state. Even if we rerun the second
command hours or days later, it will still return the same value. This persistence will become more
evident when we introduce event-driven updates in later posts.

## What's Next?

Now that we have a working Counter entity that persists state, the next step is to make it
interactive.

In the upcoming posts, we will introduce:

- Entity IDs to uniquely identify instances.
- Event-driven updates that allow modifying state dynamically.

These enhancements will bring us closer to fully emulating Durable Entities in Kotlin.

## Read Further

This post is part of the
[Implementing Durable Entities in Kotlin](/implementing-durable-entities-in-kotlin) series.

- **Previous**: [Series Introduction](/implementing-durable-entities-in-kotlin).
- **Next**: [Creating Entities](/implementing-durable-entities-in-kotlin-creating-entities).
