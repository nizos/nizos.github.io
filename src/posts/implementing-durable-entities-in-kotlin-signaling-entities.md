---
title: Implementing Durable Entities in Kotlin - Signaling Entities
description: >-
  Durable Entities remain active across executions, but without external input, they are static.
  This post introduces signaling, a one-way communication method that enables entities to react to
  events dynamically. Using a Counter example, we extend our entity to listen for increment and
  reset operations, making it interactive. By the end, our counter will respond to external
  requests, laying the foundation for more advanced event-driven workflows.
date: 2025-01-03
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

So far, we have created an entity that stores state using custom status, but it remains static. Once
created, there is no way to interact with it or modify its state dynamically. In real-world
applications, stateful objects must react to external inputs.

This is where event-driven updates come in.

In this post, we introduce signaling, a mechanism of sending one-way (fire-and-forget) messages to
an entity. By enabling our counter to listen for external events, we allow it to dynamically update
its state in response to operations like increment and reset.

## Signaling vs. Calling

Entities can be accessed in two ways, as explained in the
[Durable Entities documentation](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-entities?tabs=function-based%2Cin-process%2Cpython-v2&pivots=csharp#access-entities):

- **Signaling** Sends an operation without waiting for a response. It is best suited for updates
  that do not require immediate feedback.
- **Calling** Sends an operation and waits for a result before continuing. This is useful when you
  need to retrieve values from an entity.

In this post, we will focus on signaling and by the end of it our counter entity will become
interactive, responding to external requests.

## Extending the Counter to Handle Events

To enable event-driven updates, we modify the `Counter` orchestration so that it listens for
incoming events. It will wait for external signals and update its state accordingly.

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    // Initialize the counter value and the custom status
    var counter = 0
    ctx.setCustomStatus(counter)

    while (true) {
        // Wait for an external event
        val operation =
            ctx.waitForExternalEvent("EntityOperation", String::class.java).await()

        // Process the requested operation
        when (operation) {
            "Increment" -> counter++ // Increase counter by 1
            "Reset" -> counter = 0   // Reset counter to 0
        }

        // Update the stored state with the new value
        ctx.setCustomStatus(counter)
    }
}
```

Now, instead of being static, the counter remains active, continuously listening for events. When it
receives an operation, it updates its state and waits for the next event.

At this point, the counter can respond to external events, but we still need a way to send these
signals.

## Sending Signals to the Counter

To interact with the counter, we create HTTP-triggered functions that send events to a specific
instance.

### Increment Operation

This function sens an event to increase the counter value.

```kotlin
@FunctionName("Increment")
fun increment(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    // Extract the instanceId from query parameters
    val entityId = request.queryParameters["entityId"]
        ?: return request.badRequest("entityId required")

    // Raise an event to the Counter to increment its value
    ctx.client.raiseEvent(instanceId, "EntityOperation", "Increment")

    // Return an HTTP response with a helpful message
    return request.success("Counter Incremented.")
}
```

### Reset Operation

This function sends an event to reset the counter to 0.

```kotlin
@FunctionName("Reset")
fun increment(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    // Extract the instanceId from query parameters
    val entityId = request.queryParameters["entityId"]
        ?: return request.badRequest("entityId required")

    // Raise an event to the Counter to reset its value
    ctx.client.raiseEvent(instanceId, "EntityOperation", "Reset")

    // Return an HTTP response with a helpful message
    return request.success("Counter Reset.")
}
```

### Abstracting Signal Logic

Right now, we hardcoded the event name `EntityOperation` everywhere. This is an implementation
detail and there is no reason to leak into the rest of the code base. We can introduce a helper
function for signaling that will help us clean up our code:

```kotlin
fun DurableTaskClient.signalEntity(entityId: String, operation: String) {
    this.raiseEvent(entityId, "EntityOperation", operation)
}
```

With our abstraction, the HTTP functions become even cleaner:

```kotlin
@FunctionName("Increment")
fun increment(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    val entityId = request.queryParameters["entityId"]
        ?: return request.badRequest("entityId required")

    ctx.client.signalEntity(entityId, "Increment")

    return request.success("Counter Incremented.")
}
```

This makes signaling cleaner and more intuitive, matching how Durable Entities are used in other
languages.

## Verifying the Implementation

With everything in place, we can now verify that our counter responds to events.

### Step 1: Create a Counter Instance

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Create
Created Counter with ID: b13e7165-6ee4-4429-9295-a5f998d9881d
```

### Step 2: Retrieve Initial State

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter value: 0
```

### Step 3: Increment the Counter

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Increment\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter Incremented.
```

### Step 4: Check the Updated State

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter value: 1
```

### Step 5: Reset the Counter

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Reset\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter Reset.
```

### Step 6: Confirm the Reset

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter value: 0
```

With this, we have successfully made our counter interactive. It now listens for external events and
updates its state dynamically.

## What's Next?

Now that we can send one-way messages to update an entity, the next step is to make these signals
more powerful.

In the next post, we will extend signaling to support input parameters, allowing entities to process
structured commands rather than just operation names.

## Read Further

This post is part of the
[Implementing Durable Entities in Kotlin](/implementing-durable-entities-in-kotlin) series.

- **Previous**: [Creating Entities](/implementing-durable-entities-in-kotlin-creating-entities).
- **Next**:
  [Signaling Entities with Input](/implementing-durable-entities-in-kotlin-signaling-entities-with-input).
