---
title: Implementing Durable Entities in Kotlin - Final Enhancements
description: >-
  Throughout this series, we've explored Durable Entities from the ground up: managing state,
  creating entities, signaling, cross-communication, and two-way interactions. There steps have
  culminated in a flexible and functional system for handling stateful workflows in Kotlin. In this
  final post, we'll refine and enhance our implementation. By introducing abstractions and a
  DSL-like syntax, we'll improve readability, and aligns it with the native experience. This
  consolidation will prepare our implementation for real-world usage and future expansions.
date: 2025-01-07
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

Throughout this series, we've explored Durable Entities from the ground up: managing state, creating
entities, signaling, cross-communication, and two-way interactions. There steps have culminated in a
flexible and functional system for handling stateful workflows in Kotlin.

In this final post, we'll refine and enhance our implementation. By introducing abstractions and a
DSL-like syntax, we'll improve readability, and aligns it with the native experience. This
consolidation will prepare our implementation for real-world usage and future expansions.

## Enhancing Durable Entities with Abstractions

### Creating the DurableEntityContext Class

We encapsulate common entity operations into a reusable `DurableEntityContext` class. This
abstraction simplifies the implementation of entity logic:

```kotlin
class DurableEntityContext(val ctx: TaskOrchestrationContext) {
    var currentOperation: Operation? = null

    fun waitForOperation(): Operation {
        currentOperation =
            ctx.waitForExternalEvent("EntityOperation", String::class.java)
                .await()
                .let { objectMapper.readValue<Operation>(it) }
        return currentOperation
            ?: throw IllegalStateException("Operation could not been initialized.")
    }

    inline fun <reified T> getState(): T {
        return ctx.getEntityState(ctx.instanceId, T::class.java).await()
            ?: throw IllegalStateException("Entity state has not been initialized.")
    }

    fun setState(newState: Any?) {
        ctx.setCustomStatus(newState)
    }

    inline fun <reified T : Any> getInput(): T {
        return T::class.cast(currentOperation?.input)
    }

    fun <T> returnResult(value: T) {
        val operation =
            currentOperation
                ?: throw IllegalStateException(
                    "No operation in progress to return result for"
                )

        val (requesterId, responseEventName) =
            operation.requesterId to operation.responseEventName

        if (requesterId != null && responseEventName != null) {
            val resultOperation = Operation(name = "Result", input = value)
            val signalInput =
                SignalEntityInput(
                    entityId = requesterId,
                    operation = resultOperation,
                    eventName = responseEventName,
                )
            ctx.signalEntity(signalInput)
        } else {
            throw IllegalArgumentException(
                "Requester ID or response event name not provided"
            )
        }
    }
}
```

## Retrieving Entity State with Activities

### Creating the getEntityState Function

We define a helper function for retrieving the state of an entity using an activity:

```kotlin
fun <T> TaskOrchestrationContext.getEntityState(
    entityId: String,
    returnType: Class<T>,
): Task<T> {
    return this.callActivity(
        "GetEntityState",
        GetEntityStateInput(entityId),
        returnType,
    )
}

@FunctionName("GetEntityState")
fun getEntityStateActivity(
    @DurableActivityTrigger(name = "input") input: GetEntityStateInput,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): Int? {
    return durableContext.client
        .getInstanceMetadata(input.entityId, true)
        ?.readCustomStatusAs(Int::class.java)
}
```

## Refactoring the Counter Entity

### Updating the Counter Logic

With the `DurableEntityContext` abstraction, the `Counter` entity is simplified:

```kotlin
@FunctionName("Counter")
fun counter(
    @DurableOrchestrationTrigger(name = "taskCtx") taskCtx: TaskOrchestrationContext
) {
    val ctx = DurableEntityContext(taskCtx)
    ctx.setState(0)

    while (true) {
        ctx.waitForOperation()

        when (ctx.currentOperation?.name?.lowercase()) {
            "add" -> ctx.setState(ctx.getState<Int>() + ctx.getInput<Int>())
            "reset" -> ctx.setState(0)
            "get" -> ctx.returnResult(ctx.getState<Int>())
        }
    }
}
```

## Adding State Rehydration

### Initializing State

To ensure the entity state is properly initialized, we define an `initializeState` function:

```kotlin
fun initializeState(initialValue: Any?) {
    val state = ctx.getEntityState(ctx.instanceId, Any::class.java).await()
    if (state == null) {
        ctx.setCustomStatus(initialValue)
    }
}
```

## Introducing a DSL-like Syntax

### Simplifying the Entity Loop

We encapsulate the entity loop in the `DurableEntityContext`:

```kotlin
fun runEntityLoop(handleOperation: DurableEntityContext.() -> Unit) {
    while (true) {
        waitForOperation()
        this.handleOperation()
    }
}
```

### Abstracting the Entity Function

We introduce an `asEntity` function to further streamline entity definitions:

```kotlin
fun asEntity(
    taskCtx: TaskOrchestrationContext,
    initialState: Any? = null,
    block: DurableEntityContext.() -> Unit,
) {
    val ctx = DurableEntityContext(taskCtx)
    ctx.initializeState(initialState)
    ctx.runEntityLoop { block(ctx) }
}
```

### Final Entity Implementation

The Counter entity now has a clean and expressive syntax:

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    asEntity(ctx, initialState = 0) {
        when (currentOperation?.name?.lowercase()) {
            "add" -> setState(getState<Int>() + getInput<Int>())
            "reset" -> setState(0)
            "get" -> returnResult(getState<Int>())
        }
    }
}
```

## Conclusion

With this final post, we have refined our Durable Entities implementation, making it cleaner, more
expressive, and better suited for real-world usage. By introducing abstractions like
DurableEntityContext, we reduced boilerplate and improved maintainability. We also added state
rehydration and entity state retrieval via activities, ensuring consistency and reliability.
Finally, a DSL-like syntax makes entity definitions more intuitive and streamlined.

This concludes our series, having covered all fundamental functionalities. The implementation
provides a solid foundation and can be further optimized for performance.

## Read More

This post is part of the
[Implementing Durable Entities in Kotlin](/implementing-durable-entities-in-kotlin) series.

- **Previous**: [Calling Entities](/implementing-durable-entities-in-kotlin-calling-entities).
