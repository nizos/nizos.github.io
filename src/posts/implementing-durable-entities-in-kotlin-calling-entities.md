---
title: Implementing Durable Entities in Kotlin - Calling Entities
description: >-
  So far, our Durable Entities have interacted through signaling, but they lacked direct, two-way
  communication. In this post, we introduce entity calling, enabling entities and orchestrations to
  request operations and receive responses. This addition unlocks new possibilities, such as
  querying state, making informed decisions, and structuring workflows with real-time
  interactions—all while preserving Durable Functions constraints.
date: 2025-01-06
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

So far, we have built a solid foundation for Durable Entities in Kotlin. We have established
stateful entities that persist data and allowed them to interact dynamically through signaling. We
have also introduced cross-entity communication, where entities can notify each other of significant
events.

However, all interactions so far have been fire-and-forget. Entities can send signals, but they
don't receive immediate responses. This approach is sufficient for many scenarios, but real-world
applications often require two-way communication.

In this post, we introduce entity calling, which allows entities to invoke operations and receive
responses. This unlocks more advanced workflows, such as querying state, making decisions based on
results, and chaining interactions in a more structured way.

To demonstrate this, we enhance our `Counter` entity to support calls, allowing clients and
orchestrations to retrieve its current value. Along the way, we'll introduce best practices for
handling entity calls safely with Durable Functions constraints.

## Constraints in Durable Orchestrations

In a previous post where we introduced state persistence, we demonstrated how we can query the state
of an entity using the custom status metadata. However, as we have previously seen, orchestrations
replay their executions to ensure reliability. Any non-deterministic operation, such as fetching a
new timestamp or making an external API request, could lead to inconsistent results. Because of
this, entity calls need a structured, replay-safe mechanism to avoid breaking the orchestration
model.

Instead of calling entities directly, we establish a request-response patterns where the caller
requests an operation from an entity, the entity processes the request and sends a response, and the
caller waits for and retrieves the response.

Another challenge is ensuring that responses are mapped to their corresponding requests. Since each
entity call runs within an orchestrator that may replay multiple times, using a traditional random
ID to track calls would introduce non-determinism. Instead, we need a deterministic way to generate
unique event names to safely map responses to their originating requests.

## Building a Request-Response Pattern for Entity Calls

### Extending the Data Model

To support entity calls, we extend our data classes. Instead of just sending operation names and
input values, we now include metadata for responses.

```kotlin
data class Operation(
    val name: String,
    val input: Any? = null,
    val requesterId: String? = null,
    val responseEventName: String? = null,
)

data class SignalEntityInput(
    val entityId: String,
    val operation: Operation,
    val eventName: String? = null,
)
```

The `requesterId` field identifies who made the request, while `responseEventName` specifies the
name of the event to which the response should be sent. The `eventName` in the `SignalEntityInput`
ensures the result is mapped correctly to its corresponding request.

## Implementing the Call Logic

With our extended data model in place, we define a `callEntity` function that facilitates
request-response interactions between orchestrators and entities. Unlike fire-and-forget signals,
this function ensures that an orchestrator can invoke an operation and reliably retrieve a response.

To achieve this, we introduce a structured event-based mechanism that maintains determinism and
orchestration safety. When an orchestrator calls an entity, it generates a deterministically unique
event name to track its corresponding response. The orchestrator then waits for an external event to
receive the result before continuing execution.

```kotlin
fun <T> TaskOrchestrationContext.callEntity(
    entityId: String,
    operationName: String,
    operationInput: Any? = null,
    returnType: Class<T>,
): T {
    // Generate a deterministically safe and unique response event name
    val responseEventName = "ResponseEvent_${this.newUUID()}"

    // Set up the listener for the response event
    val resultTask = this.waitForExternalEvent(responseEventName, String::class.java)

    // Generate the payload
    val operation =
        Operation(
            name = operationName,
            input = operationInput,
            requesterId = this.instanceId,
            responseEventName = responseEventName,
        )
    val input = SignalEntityInput(entityId = entityId, operation = operation)

    // Emit the signal to the entity
    this.signalEntity(input)

    // Wait for the response event
    val resultJson = resultTask.await()

    // Parse operation input into requested return type and return it
    val resultOperation = objectMapper.readValue<Operation>(resultJson)
    return objectMapper.convertValue(resultOperation.input, returnType)
}
```

To maintain determinism, we generate a unique response event name using `newUUID()`, which is safe
for orchestration replays as it remains consistent. Using a non-deterministic value like
`UUID.randomUUID()` would break replay behavior, making it unsuitable for Durable Functions.

Once the event name is generated, we register an event listener using `waitForExternalEvent`. We
then package the request into `SignalEntityInput` and send it to the entity. The entity processes
the request and emits a response event back to the orchestrator using the stored
`responseEventName`. WHen the orchestrator receives the response, it deserializes the result and
returns it as the expected data type.

### Enhancing Signal Logic

To facilitate structured entity communication, we enhance our signaling logic by introducing an
activity function that serves as an intermediary. The `signalEntity` function is now responsible for
routing signals safely while ensuring Durable Functions constraints are followed.

```kotlin
fun TaskOrchestrationContext.signalEntity(input: SignalEntityInput) {
    this.callActivity("SignalEntity", input)
}

@FunctionName("SignalEntity")
fun signalEntityActivity(
    @DurableActivityTrigger(name = "input") input: SignalEntityInput,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
) {
    ctx.client.signalEntity(input)
}

fun DurableTaskClient.signalEntity(input: SignalEntityInput) {
    val operationJSON = objectMapper.writeValueAsString(input.operation)
    val eventName = input.eventName ?: "EntityOperation"
    this.raiseEvent(input.entityId, eventName, operationJSON)
}
```

By routing signals through an activity function, we ensure that Durable Task Client from within an
orchestrator. Additionally, the `eventName` parameter ensures that responses are mapped correctly to
their corresponding requests.

### Adding Support for Entity Calls

With a safe signaling mechanism in place, we modify our counter to support calls rather than just
fire-and-forget signals. Specifically, we introduce a `Get` operation that returns the current
counter value to the requester.

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    var counter = 0
    ctx.setCustomStatus(counter)

    while (true) {
        val operation = ctx.waitForEntityOperation()

        when (operation.name) {
            "Add" -> counter += (operation.input as? Int) ?: 0
            "Get" -> {
                if (
                    operation.requesterId != null && operation.responseEventName != null
                ) {
                    val resultOperation = Operation(name = "Result", input = counter)
                    val signalInput =
                        SignalEntityInput(
                            entityId = operation.requesterId,
                            operation = resultOperation,
                            eventName = operation.responseEventName,
                        )
                    ctx.signalEntity(signalInput)
                }
            }
            "Reset" -> counter = 0
        }

        ctx.setCustomStatus(counter)
    }
}
```

Instead of immediately returning the value, the counter packages the result as an operation and
sends it to the requester. The `requesterId` and `responseEventName` ensure that the response is
delivered to the correct waiting orchestrator.

### Abstracting the Result Logic

We encapsulate the logic for returning results into an extension function:

```kotlin
fun <T> TaskOrchestrationContext.returnResult(operation: Operation, value: T) {
    if (operation.requesterId != null && operation.responseEventName != null) {
        val resultOperation = Operation(name = "Result", input = value)
        val signalInput =
            SignalEntityInput(
                entityId = operation.requesterId,
                operation = resultOperation,
                eventName = operation.responseEventName,
            )
        this.signalEntity(signalInput)
    } else {
        throw IllegalArgumentException(
            "Requester ID or response event name not provided"
        )
    }
}
```

With this, we simplify the `Counter` entity further:

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    var counter = 0
    ctx.setCustomStatus(counter)

    while (true) {
        val operation = ctx.waitForEntityOperation()

        when (operation.name) {
            "Add" -> counter += (operation.input as? Int) ?: 0
            "Get" -> ctx.returnResult(operation, counter)
            "Reset" -> counter = 0
        }

        ctx.setCustomStatus(counter)
    }
}
```

## Testing Entity Calls

### Creating a CounterCaller Orchestration

We define a `CounterCaller` orchestration to test the `callEntity` function:

```kotlin
@FunctionName("CounterCaller")
fun counterCaller(
    @DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext,
    context: ExecutionContext,
) {
    // Get the ID of the Counter from the input
    val counterId = ctx.getInput(String::class.java)

    // For demo: Yield control to ensure the runtime registers everything first
    ctx.createTimer(Duration.ofSeconds(5)).await()

    // Call the Get operation on the Counter
    val counterValue =
        ctx.callEntity(
            entityId = counterEntityId,
            operationName = "Get",
            returnType = Int::class.java,
        )

    // Log the returned counter value
    context.logger.info("Received $counterValue")
}
```

### Defining the Orchestration HTTP Trigger

We create an HTTP trigger to initialize both the `Counter` and `CounterCaller`:

```kotlin
@FunctionName("CreateCounterOrchestration")
fun createCounterOrchestration(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "ctx") ctx: DurableClientContext,
): HttpResponseMessage {
    // Create a Counter and a CounterCaller
    val counterId = Entity(ctx.client, "Counter")
    val callerId = Entity(ctx.client, "CounterCaller", counterId)

    // Return an HTTP response containing the IDs
    val responseBody =
        """
        Created Counter and CounterCaller.
        Counter ID: $counterId
        Caller ID: $callerId
    """
            .trimIndent()
    return request.success(responseBody)
}
```

### Validating the Output

We run the setup and check the logs for the retrieved counter value:

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/CreateCounterOrchestration
Created Counter and CounterCaller.
Counter ID: 3feb953a-0f90-4aaa-81fa-13a96c3c9a6b
Caller ID: 7005eee2-b644-4f71-9ec7-b7d18b09bc55
```

```txt
2024-11-13T07:17:18Z   [Information]   CounterCaller: Started
2024-11-13T07:17:18Z   [Information]   CounterCaller: received 0
```

## What's Next?

With this we have developed the functionalities that we need to use Durable Entities in Kotlin. In
the next and final post in the series, we will refine our implementation by introducing abstractions
to simplify interactions and align our approach with the native Durable Entities experience.

## Read Further

This post is part of the
[Implementing Durable Entities in Kotlin](/implementing-durable-entities-in-kotlin) series.

- **Previous**: [Cross-Communication](/implementing-durable-entities-in-kotlin-cross-communication).
- **Next**: [Final Enhancements](/implementing-durable-entities-in-kotlin-final-enhancements/).
