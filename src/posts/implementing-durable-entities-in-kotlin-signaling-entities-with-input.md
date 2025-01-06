---
title: Implementing Durable Entities in Kotlin - Signaling Entities with Input
description: >-
  Signaling allows entities to process operations dynamically, but until now, signals have been
  limited to simple operation names. In this post, we extend our implementation to support input
  data, enabling entities to handle structured commands. By passing values with signals, our counter
  can now process operations like adding a specified amount. This enhancement brings our entities
  closer to real-world applications where interactions require more than basic state changes.
date: 2025-01-04
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

So far, we have implemented signaling to interact with entities dynamically, allowing our counter to
respond to operations like increment and reset. However, these signals have been limited to simple
operation names, restricting flexibility.

In this post, we extend our signaling mechanism to support input data, enabling more complex
interactions. By passing structured data with each signal, we allow operations like adding a
specific amount to the counter. With this enhancement, our counter entity will support more
realistic interactions, moving closer to the flexibility required in real-world applications.

## Passing Input with Signals

### Defining a Data Model for Operations

Instead of sending plain operation names, we define a structured `Operation` data class that
includes both an operation type and optional input. Since Durable Functions use Jackson for
serialization, we follow the same approach for consistency.

```kotlin
val objectMapper = jacksonObjectMapper()

data class Operation(
    val name: String,
    val input: Any? = null
)
```

This allows signals to carry additional information, such as an integer to modify the counter.

### Updating the SignalEntity Function

To handle structured input, we modify the `signalEntity` function to send JSON-encoded operations.

```kotlin
fun DurableTaskClient.signalEntity(
    entityId: String,
    operationName: String,
    operationInput: Any? = null
) {
    val operation = Operation(name = operationName, input = operationInput)
    val operationJSON = objectMapper.writeValueAsString(operation)
    this.raiseEvent(entityId, "EntityOperation", operationJSON)
}
```

This ensures that every entity receives structured events, making event-driven interactions more
powerful.

## Handling Input in The Counter Entity

### Processing Events with Data Input

We modify the `Counter` entity to parse structured signals and apply operations accordingly.

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    var counter = 0
    ctx.setCustomStatus(counter)

    while (true) {
        val operationJson =
            ctx.waitForExternalEvent("EntityOperation", String::class.java).await()
        val operation = objectMapper.readValue<Operation>(operationJson)

        when (operation.name) {
            "Increment" -> counter++
            "Add" -> counter += (operation.input as? Int) ?: 0
            "Reset" -> counter = 0
        }

        ctx.setCustomStatus(counter)
    }
}
```

Now, the counter can increment by one, add a custom value, or reset based on structured input.

## Sending Input from an HTTP Function

To take advantage of this functionality, we introduce an HTTP function that allows users to specify
an amount to be added to the counter.

```kotlin
@FunctionName("Add")
fun add(
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
    val amount = request.queryParameters["amount"]
        ?: return request.badRequest("amount required")

    ctx.client.signalEntity(entityId, "Add", amount.toInt())

    return request.success("Amount added.")
}
```

This function extracts the `entityId` and `amount` from the request, signals the entity with the
provided value, and finally returns a success message.

## Testing the Implementation

With everything in place, we can now verify that the `Add` function correctly updates the counter.

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Create
Created Counter with ID: 42587159-ca0e-4342-8514-2cdeee214953

❯ curl -s https://durable-app.azurewebsites.net/api/Add\?\
entityId\=42587159-ca0e-4342-8514-2cdeee214953\&amount\=7
Amount added.

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=42587159-ca0e-4342-8514-2cdeee214953
Counter value: 7

❯ curl -s https://durable-app.azurewebsites.net/api/Add\?\
entityId\=42587159-ca0e-4342-8514-2cdeee214953\&amount\=2
Amount added.

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=42587159-ca0e-4342-8514-2cdeee214953
Counter value: 9
```

The counter correctly updates based on the values provided.

## Refactoring for Cleaner Event Handling

### Simplifying Event Handling with a Helper Function

To streamline the counter's logic, we introduce a helper function that waits for and parses incoming
operations:

```kotlin
fun TaskOrchestrationContext.waitForEntityOperation(): Operation {
    val json = this.waitForExternalEvent("EntityOperation", String::class.java).await()
    return objectMapper.readValue<Operation>(json)
}
```

### Refactoring the Counter Entity

Using this helper function, we simplify our counter implementation.

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    var counter = 0
    ctx.setCustomStatus(counter)

    while (true) {
        val operation = ctx.waitForEntityOperation()

        when (operation.name) {
            "Add" -> counter += (operation.input as? Int) ?: 0
            "Reset" -> counter = 0
        }

        ctx.setCustomStatus(counter)
    }
}
```

This update eliminates unnecessary JSON parsing within the main loop, keeping the entity concise and
readable.

## What's Next?

Now that our entities can process structured signals, they are no longer limited to basic state
changes but can dynamically react to user input. In the next post, we will explore cross-entity
communication, enabling entities to interact with each other, further expanding the scope of what we
can build.

## Read Further

This post is part of the
[Implementing Durable Entities in Kotlin](/implementing-durable-entities-in-kotlin) series.

- **Previous**: [Signaling Entities](/implementing-durable-entities-in-kotlin-signaling-entities).
- **Next**: [Cross-Communication](/implementing-durable-entities-in-kotlin-cross-communication).
