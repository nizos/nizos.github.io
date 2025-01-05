---
title: Implementing Durable Entities in Kotlin - Creating Entities
description: >-
  So far, we've learned how Durable Entities can persist state across executions and conserve
  resources, and we've used custom status and metadata to manage state for a basic counter entity.
  In this post, we'll build on that by introducing Entity IDs which are unique identifiers that
  allow us to create and interact with specific entities. By abstracting entity creation into a
  reusable pattern, we simplify the process and prepare for handling operations efficiently in
  upcoming posts.
date: 2025-01-02
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

So far, we have seen how Durable Entities persist state across executions and conserve resources. We
have used custom status and metadata to store and retrieve state for a basic Counter entity.
However, to interact with entities efficiently, we need a structured way to identify and reference
them.

This post introduce Entity IDs, which uniquely identify specific instances of an entity. To make
instance creation simpler and more intuitive, we also introduce a lightweight abstraction that
aligns with how Durable Entities are created in other languages.

## Understanding Entity IDs

When working with Durable Entities, each instance must be uniquely identifiable. According to the
[Durable Entities documentation](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-entities?tabs=function-based%2Cin-process%2Cpython-v2&pivots=csharp#entity-id),
an entity ID consists of an entity name, which represents the type of the entity, and an entity key,
which uniquely identifies a specific instance.

This structure enables the creation of multiple instances of the same entity while keeping them
distinct. For example, in C#, an entity ID for a counter entity can be created like this:

```csharp
var entityId = new EntityId(nameof(Counter), "myCounter");
```

Here, `Counter` is the entity name, and `myCounter` is the key that uniquely identifies this
instance.

With this approach, we can reference and interact with specific entities in a structured way.

## Abstracting Entity Creation

### Why introduce an Abstraction?

Right now, we manually schedule an orchestration each time we create an entity. While this approach
works, it exposes unnecessary implementation details. Instead of handling entity creating explicitly
in each function, we can introduce an abstraction that simplifies the process.

Encapsulating entity creation in a dedicated class makes instance creation more intuitive, aligns
with Durable Entities in other languages, and keeps the code cleaner.

### Implementing the Entity Class

To achieve this, we define an `Entity` class that takes an entity name, and optional key to
distinguish instances, and an optional input parameter. It uses DurableTaskClient to schedule an
orchestration and returns the instance ID.

```kotlin
class Entity
private constructor(
    client: DurableTaskClient,
    name: String,
    key: String? = null,
    input: Any? = null,
) {
    // Create an instance of the requested Entity
    val instanceId: String = client.scheduleNewOrchestrationInstance(name, input, key)

    // Factory method for entity creation
    companion object {
        operator fun invoke(
            client: DurableTaskClient,
            name: String,
            input: Any? = null,
            key: String? = null,
        ): String {
            val entity = Entity(client, name, input, key)
            return entity.instanceId
        }
    }
}
```

With this abstraction in place, creating an entity instance is now as simple as:

```kotlin
val entityId = Entity(ctx.client, "Counter", "myCounter")
```

At this stage, we return the instance ID, but we could modify it to return a formatted string like
`@Counter@Game1` to align more closely with the native implementation.

Note that we have also added an input parameter as well. We will use this later when we want to
provide input to an entity when we instantiate it.

## Refactoring the Create Function

With the new abstraction, we can simplify our `Create` function:

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
    // Create a new Counter instance with a specific key
    val entityId = Entity(ctx.client, "Counter", "myCounter")

    // Return an HTTP response containing the entity ID
    return request
        .createResponseBuilder(HttpStatus.OK)
        .body("Created Counter with ID: $entityId\n")
        .build()
}
```

This keeps the code focused on the business logic rather than exposing orchestration details.

## Simplifying HTTP Handling

Since we will be handling multiple HTTP-triggered functions, we can reduce repetitive
response-handling code by introducing two extension functions:

```kotlin
fun HttpRequestMessage<Optional<String>>.badRequest(
    message: String
): HttpResponseMessage =
    createResponseBuilder(HttpStatus.BAD_REQUEST).body(message).build()

fun HttpRequestMessage<Optional<String>>.success(message: String): HttpResponseMessage =
    createResponseBuilder(HttpStatus.OK).body(message).build()
```

Using these, our `Create` function becomes even cleaner:

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
    val entityId = Entity(ctx.client, "Counter", "myCounter")
    return request.success("Created Counter with ID: $entityId\n")
}
```

This reduces clutter and makes the functions easier to read.

## What's Next?

With Entity IDs in place, we now have a structured way to create and reference Durable Entities. The
next step is to make these entities interactive by introducing event-driven updates.

In the next post, we will explore signaling, a mechanism that allows sending operations to entities
without awaiting for a response.

## Read Further

This post is part of the
[Implementing Durable Entities in Kotlin](/implementing-durable-entities-in-kotlin) series.

- **Previous**: [Persisting State](/implementing-durable-entities-in-kotlin-persisting-state).
- **Next**: [Signaling Entities](/implementing-durable-entities-in-kotlin-signaling-entities).
