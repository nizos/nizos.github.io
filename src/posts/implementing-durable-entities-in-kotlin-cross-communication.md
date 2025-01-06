---
title: Implementing Durable Entities in Kotlin - Cross Communication
description: >-
  Entities in a distributed system often need to collaborate, but Durable Functions impose
  constraints on direct communication. In this post, we introduce cross-entity signaling while
  maintaining orchestration integrity. By implementing a monitor entity that listens for updates
  from a counter, we explore structured signaling models, activity functions, and best practices for
  reliable inter-entity communication in Kotlin.
date: 2025-01-05
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

So far, we have built stateful entities that persist data and respond dynamically to external input
through signaling. However, all interactions have been one-directional: clients send commands, but
entities remain isolated from each other.

Real-world applications often require entities to collaborate, exchanging updates and triggering
actions across a distributed system. This post introduces cross-entity communication, where entities
can signal each other and work together toward a shared goal.

To demonstrate this, we introduce a monitor entity that listens for updates from the counter entity
whenever it reaches specific milestones.

## Why Can't We Signal Entities Directly?

Signaling an entity from another entity or orchestrator using `DurableTaskClient` might seem
straightforward, but it introduces reliability issues. Orchestrators replay executions for fault
tolerance and scalability. If they interact directly with external clients, they risk sending
duplicate signals, leading to unintended side effects.

This constraint is fundamental to Durable Functions, ensuring consistency in distributed workflows,
as detailed in the
[Durable Entities constraints documentation](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-code-constraints?tabs=csharp#bindings).
Instead of allowing direct signaling, we introduce an activity function to handle communication.
Activities do not replay, ensuring that each signal is sent exactly once while maintaining
orchestration integrity.

## Enabling Cross-Entity Communication

To ensure structured and reliable entity signaling, we introduce a signaling model that standardizes
communication between entities.

### Defining a Structured Signaling Model

Instead of sending raw data, we define a structured format for consistent and predictable
inter-entity communication. The `Operation` class remains unchanged and represents an action an
entity should take, optionally carrying input data. The `SignalEntityInput` class bundles the target
entity ID with the operation, making signaling clearer and reusable.

```kotlin
data class Operation(
    val name: String,
    val input: Any? = null
)

data class SignalEntityInput(
    val entityId: String,
    val operation: Operation
)
```

By encapsulating signaling details, this model simplifies passing information to the activity
function.

## Handling Signals with an Activity Function

With a structured model in place, we define an activity function to safely handle signaling. Unlike
orchestrations, activities do not replay, making them the correct place to interact with
`DurableTaskClient`.

```kotlin
@FunctionName("SignalEntity")
fun signalEntityActivity(
    @DurableActivityTrigger(name = "input") input: SignalEntityInput,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
) {
    durableContext.client.signalEntity(
        input.entityId,
        input.operation.name,
        input.operation.input,
    )
}
```

The activity takes a `SignalEntityInput` and sends a signal on behalf of the caller. Since
activities execute only once, they prevent duplicate signals, ensuring reliable inter-entity
communication.

## Updating the Counter to Signal the Monitor

Now that we have a safe signaling mechanism, we modify the `Counter` entity to notify the `Monitor`
when reaching specific milestones. The counter initializes its state, listens for operations, and
updates its value accordingly. Whenever it reaches a multiple of 10, it signals the monitor.

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    var counter = 0
    ctx.setCustomStatus(counter)
    val monitorEntityId = ctx.getInput(String::class.java)

    while (true) {
        val operation = ctx.waitForEntityOperation()

        when (operation.name) {
            "Add" -> counter += (operation.input as? Int) ?: 0
            "Reset" -> counter = 0
        }

        ctx.setCustomStatus(counter)

        if (counter % 10 == 0) {
            val responseOperation = Operation(name = "Update", input = counter)
            val signalInput = SignalEntityInput(monitorEntityId, responseOperation)
            ctx.callActivity("SignalEntity", signalInput)
        }
    }
}
```

The counter now receives the monitor's ID as input and signals it when reaching key milestones.
Instead of handling the signaling directly, it delegates the task to the activity function, ensuring
orchestration constraints are respected.

## Defining the Monitor

The `Monitor` entity listens for updates from the `Counter` and logs the received progress.

```kotlin
@FunctionName("Monitor")
fun monitor(
    @DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext,
    context: ExecutionContext,
) {
    while (true) {
        val operation = ctx.waitForEntityOperation()

        when (operation.name) {
            "Update" -> {
                context.logger.info("Progress update: ${operation.input}%")
            }
        }
    }
}
```

By continuously listening for updates, the monitor keeps track of milestones reached by the counter.

## Initializing Both Entities via HTTP

To establish communication between the `Counter` and `Monitor`, we define an HTTP function that
creates both entities in a single request. The monitor is created first, and its ID is passed to the
counter.

```kotlin
@FunctionName("CreateMonitorAndCounter")
fun createMonitorAndCounter(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    // Create a Monitor and a Counter, passing the monitorId to the counter
    val monitorId = Entity(ctx.client, "Monitor")
    val counterId = Entity(ctx.client, "Counter", monitorId)

    // Return an HTTP response with the IDs
    val responseBody =
        """
        Created Monitor and Counter.
        Monitor ID: $monitorId
        Counter ID: $counterId
    """
            .trimIndent()
    return request.success(responseBody)
}
```

This ensures the counter knows where to send updates.

## Verifying Cross-Communication

We can now verify the `Counter` can signal the `Monitor` by instantiating them and adding a value of
10 to the counter, triggering the monitored milestone:

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/CreateMonitorAndCounter
Created Monitor and Counter.
Monitor ID: f224fd54-c343-49b6-9305-50e96f6b76d4
Counter ID: e415d7bb-8b6a-4134-a0ba-d81420839657

❯ curl -s https://durable-app.azurewebsites.net/api/Add\?\
entityId\=e415d7bb-8b6a-4134-a0ba-d81420839657\&amount\=10
Amount added.
```

Logs confirm that the `Monitor` received the signal:

```txt
2024-11-12T12:17:19Z   [Information]   Progress update: 10.0%
```

The `Counter` and `Monitor` are now communicating dynamically.

## Abstracting Cross-Communication

To streamline our implementation, we introduce a helper function for entity signaling.

```kotlin
fun TaskOrchestrationContext.signalEntity(
    entityId: String,
    operationName: String,
    operationInput: Any? = null,
) {
    val operation = Operation(name = operationName, input = operationInput)
    val signalInput = SignalEntityInput(entityId, operation)
    this.callActivity("SignalEntity", signalInput)
}
```

Using this abstraction, we simplify the `Counter` entity further:

```kotlin
if (counter % 10 == 0) {
    ctx.signalEntity(monitorEntityId, "Update", counter)
}
```

This keeps the logic concise and easy to read while ensuring entity signals are handled correctly..

## What's Next?

Now that our entities can communicate with each other, we can move beyond fire-and-forget signals.

In the next post, we explore entity calling, allowing entities to send requests and receive
responses, further enhancing their capabilities.

## Read Further

This post is part of the
[Implementing Durable Entities in Kotlin](/implementing-durable-entities-in-kotlin) series.

- **Previous**:
  [Signaling Entities with Input](/implementing-durable-entities-in-kotlin-signaling-entities-with-input).
- **Next**: [Calling Entities](/implementing-durable-entities-in-kotlin-calling-entities).
