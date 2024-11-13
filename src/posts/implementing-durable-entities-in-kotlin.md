---
title: Implementing Durable Entities in Kotlin
description: >-

date: 2024-11-08
cover: /uploads/chess.jpg
coverAlt: Black and white chess pieces on a blurred background.
caption:
  Photo by <a href="https://unsplash.com/@hellenicsun">Fotis Nakos</a> on <a
  href="https://unsplash.com/photos/a-chess-board-with-a-chess-piece-MMgrFmTRpSU">Unsplash</a>
socialImage: /uploads/chess-social.jpg
tags: [automation, workflows, kotlin]
draft: true
---

I am in a fortunate position to work with some of the [greatest minds](https://factor10.com/) at an
early stage of my career, something that I can't be grateful enough for. Most recently, I got to
work with Erik Meijer for the past year on
[Automind](https://fortune.com/2024/04/02/mark-zuckerberg-ai-jobs-meta-brain-drain-erik-meijer/).
This has allowed me to learn a lot and also work on some of the most exciting things.

Through this, I got introduced to Durable Functions. An abstraction that allows building stateful
workflows in serverless environments. Durable Entities, and extension of the former, goes further by
allowing developers to model stateful objects that manage their own state. They are useful for
scenarios where we want to maintain state across function executions.

The problem is that Durable Entities, at the time of writing, are not available for Java, and by
extension, for Kotlin either. The thing is, and to put it mildly, Erik likes Kotlin. Some nights I
wondered if he made a promise to never use any other language.

By now, the challenge has presented itself. To keep Erik happy, I would need to find a way to
implement Durable Entities in Kotlin.

The path wasn't straightforward but now that I have the solution, I would like to share it with you.

Durable Entities are supported in multiple languages, Java however is not one of them. This however
gave us an opportunity to study the source code in different languages to understand how it works. A
task, that in all fairness, wasn't easy due to the complexity of the abstractions. After a failed
attempt at using grpc, shims, sidecars, I reached out to the Developers on GitHub.

[Chris](https://github.com/cgillum) was kind enough to share with me the fact that Durable Entities
in other languages are
[implemented using orchestration instances](https://github.com/microsoft/durabletask-java/issues/194#issuecomment-2397984973).
Somehow, like a detective who was insistent on a specific theory off the get-go, I felt foolish for
missing that detail. Nonetheless, I was happy with my new insight, and it was all I needed to figure
out the rest.

Orchestrator Functions, as the name implies, are functions that coordinate the execution of
activities. They happen to have a status, which we can use for storing our state.

## Durable Entities

The durable entity is durable in the sense that its state persists across different executions. The
application can hibernate when not in use and will still maintain the state when it's back up again.
This is useful in situations such as when dealing with long-running tasks, such as waiting for human
approval, among many else. This way, the service does not have to stay alive and the entity does not
have to stay in memory and hug resources. Instead, it can be offloaded and brought back when needed.
Such as when a human has approved an operation.

The official documentation in C# has the following example of a durable entity:

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

This entity has a state which is the counter value, it also has operations so that it can manage the
value of the counter. Other components such as triggers and orchestrations can interact with this
counter. They can signal it to reset its value, call it to get its value, and provide it with data
to adjust its value.

In this article, we will develop the necessary functionality to be able to achieve this but in
Kotlin. By the end of this article, we will be able to emulate it in kotlin as such:

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

## Saving State

As previously mentioned, durable entities, in other languages, are implemented around orchestration
instances. Orchestrations have a custom status metadata property. We can use this to store the state
of the instance.

To start with, let us create a simple orchestration instance that we call a Counter. With time, it
will become a durable entity as we develop the necessary functionality. For now, we will simply
demonstrate how we can use the custom status of the orchestration instance to store our state.

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    ctx.setCustomStatus(0)
}
```

With our We will use an HTTP function to create instances of it.

```kotlin
@FunctionName("Create")
fun create(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val counterEntityId =
        durableContext.client.scheduleNewOrchestrationInstance("Counter")
    return request
        .createResponseBuilder(HttpStatus.OK)
        .body("Created Counter with ID: $counterEntityId\n")
        .build()
}
```

This function simply creates an instance of our Counter and returns a string containing the instance
ID which we will use later on to interact with it.

### Demo

Using curl, we can see that the HTTP function indeed returns an instance ID:

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Create
Created Counter with ID: 9864a3e8-4f01-4201-8920-0b628c739bee
```

### Clean Up

Since we will be handling a lot of HTTP requests, I've created two extension functions to simplify
the code going forward. This is to simply reduce the verbosity such that it becomes easier to focus
on the meaningful changes we make:

```kotlin
fun HttpRequestMessage<Optional<String>>.badRequest(
    message: String
): HttpResponseMessage =
    createResponseBuilder(HttpStatus.BAD_REQUEST).body(message).build()

fun HttpRequestMessage<Optional<String>>.success(message: String): HttpResponseMessage =
    createResponseBuilder(HttpStatus.OK).body(message).build()
```

With those extension functions, we can wwrite Here is how our function looks like with the updated
request handing:

```kotlin
@FunctionName("Create")
fun create(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val entityId = durableContext.client.scheduleNewOrchestrationInstance("Counter")

    return request.success("Created Counter with ID: $entityId")
}
```

## Reading State

To get the value of the counter, we access it from the instance metadata using the entity id:

```kotlin
@FunctionName("Get")
fun get(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val entityId =
        request.queryParameters["entityId"]
            ?: return request.badRequest("entityId not found")

    val counterValue =
        durableContext.client
            .getInstanceMetadata(entityId, true)
            ?.readCustomStatusAs(Int::class.java)

    return request.success("Counter value: $counterValue")
}
```

### Demo

Passing the id of a newly created counter to our Get function shows its value

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Create
Created Counter with ID: af842648-5ffe-4be3-bb17-27aabf303dcb

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=af842648-5ffe-4be3-bb17-27aabf303dcb
Counter value: 0
```

### Clean Up

We can align the usage with the native implementation by creating an extension function where we
hide away the implementation details:

```kotlin
fun <T> DurableTaskClient.getEntityState(entityId: String, returnType: Class<T>): T? {
    return this.getInstanceMetadata(entityId, true)?.readCustomStatusAs(returnType)
}
```

With this, reading an entity's state is much cleaner:

```kotlin
@FunctionName("Get")
fun get(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val entityId =
        request.queryParameters["entityId"]
            ?: return request.badRequest("entityId not found")

    val counterValue = durableContext.client.getEntityState(entityId, Int::class.java)

    return request.success("Counter value: $counterValue")
}
```

## Signaling an Entity

There are many ways to signal an entity. We will start with the simplest one for now which is to
signal it from an HTTP function.

We will adjust our counter entity so that it awaits external events and either increments or resets
the counter based on the requested operation. We also make sure that it updates the state after each
operation.

Here, we will use a single event name called `"EntityOperation"` and include the operation details
in the payload.

TODO: Async code weaving

```kotlin
@FunctionName("Counter")
fun counter(@DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext) {
    var counter = 0
    ctx.setCustomStatus(counter)

    while (true) {
        val operation =
            ctx.waitForExternalEvent("EntityOperation", String::class.java).await()

        when (operation) {
            "Increment" -> counter++
            "Reset" -> counter = 0
        }

        ctx.setCustomStatus(counter)
    }
}
```

To trigger the new operations, we will create two new HTTP functions. To increment the counter:

```kotlin
@FunctionName("Increment")
fun increment(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val entityId =
        request.queryParameters["entityId"]
            ?: return request.badRequest("entityId not found")

    durableContext.client.raiseEvent(entityId, "EntityOperation", "Increment")

    return request.success("Counter Incremented.")
}
```

Similarly, to reset the counter:

```kotlin
@FunctionName("Reset")
fun reset(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val entityId =
        request.queryParameters["entityId"]
            ?: return request.badRequest("entityId not found")

    durableContext.client.raiseEvent(entityId, "EntityOperation", "Reset")

    return request.success("Counter Reset.")
}
```

### Clean Up

As you can see, we use `EntityOperation` as the event name. This is an implementation detail and
there is no reason to leak into the rest of the code base. We can create a similar extension
function as before but this time for signaling entities:

```kotlin
fun DurableTaskClient.signalEntity(entityId: String, operation: String) {
    this.raiseEvent(entityId, "EntityOperation", operation)
}
```

This allows us to update our HTTP functions as such:

```kotlin
@FunctionName("Increment")
fun increment(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val entityId =
        request.queryParameters["entityId"]
            ?: return request.badRequest("entityId not found")

    durableContext.client.signalEntity(entityId, "Increment")

    return request.success("Counter Incremented.")
}
```

This is cleaner and aligns with the usage in the native implementation.

### Demo

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/Create
Created Counter with ID: b13e7165-6ee4-4429-9295-a5f998d9881d

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter value: 0

❯ curl -s https://durable-app.azurewebsites.net/api/Increment\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter Incremented.

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter value: 1

❯ curl -s https://durable-app.azurewebsites.net/api/Increment\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter Incremented.

❯ curl -s https://durable-app.azurewebsites.net/api/Increment\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter Incremented.

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter value: 3

❯ curl -s https://durable-app.azurewebsites.net/api/Reset\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter Reset.

❯ curl -s https://durable-app.azurewebsites.net/api/Get\?\
entityId\=b13e7165-6ee4-4429-9295-a5f998d9881d
Counter value: 0
```

## Signaling with Input

We now have a simple counter entity and are able to instantiate it, get, increment, and reset its
value. There are situation when we also want to pass data to an entity. Let us see how we can do
that by creating a new `add` operation that takes an amount to add to the counter.

As we will be passing more than just an operation name, we can make use of a data class here. We
will also make use of an object mapper here. The durable functions implementation uses jackson for
serialization so we will stick to it to keep things simple:

```kotlin
val objectMapper = jacksonObjectMapper()

data class Operation(
    val name: String,
    val input: Any? = null
)
```

We will also update our `signalEntity` extension function from earlier so that it can send both an
operation name and input:

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

We will also update our Counter so that it can parse both the operation name and any eventual
operation input as such:

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

Finally, we create a new HTTP function for adding a given amount to our counter:

```kotlin
@FunctionName("Add")
fun add(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val entityId =
        request.queryParameters["entityId"]
            ?: return request.badRequest("entityId required")

    val amount =
        request.queryParameters["amount"] ?: return request.badRequest("amount required")

    durableContext.client.signalEntity(entityId, "Add", amount.toInt())

    return request.success("Amount added.")
}
```

### Demo

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

### Clean Up

We can create a function extension to contain the handling of entity operation events as such:

```kotlin
fun TaskOrchestrationContext.waitForEntityOperation(): Operation {
    val json = this.waitForExternalEvent("EntityOperation", String::class.java).await()
    return objectMapper.readValue<Operation>(json)
}
```

This allows us to simplify our Counter Entity as such:

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

Note that we have removed the increment operation for brevity.

## Cross-Communication

We sometimes want to communicate with an entity from functions where a client is not available.
Here, we will develop our code so that we can send our signals from orchestration instances or other
entities.

For this example, we will create a monitor and have our entity signal it when the counter reaches
certain amounts.

For the monitor, we will create a very simple instance that will simply listen for an "Update" event
upon which it will simply output a log message informing us off the progress:

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

We will also create a new HTTP function that will create both a monitor and a counter, passing the
id of the monitor to the counter when it creates it ensure that it can signal it once the milestone
is reached:

```kotlin
@FunctionName("CreateMonitorAndCounter")
fun createMonitorAndCounter(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {

    val monitorId = durableContext.client.scheduleNewOrchestrationInstance("Monitor")

    val counterId =
        durableContext.client.scheduleNewOrchestrationInstance("Counter", monitorId)

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

Since orchestration instances can call activities, which can be injected with a client, we will
create an activity for this specific purpose, to communicate between orchestration instances, which
our entities are.

We will use a data class to pass both the target entity id that we want to signal along with the
operation data.

Here is how our data classes look like so far after this change:

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

The activity will simply reuse the `signalEntity` extension function that we created earlier. Here
is how it looks like:

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

With this, we can update our Counter entity to ensure that it can receive a monitorEntityId, which
is the instance that it will signal once the counter reaches a value of 5 or higher. We will also
add the necessary logic to send this signal when expected:

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

### Demo

```shell
❯ curl -s https://durable-app.azurewebsites.net/api/CreateMonitorAndCounter
Created Monitor and Counter.
Monitor ID: f224fd54-c343-49b6-9305-50e96f6b76d4
Counter ID: e415d7bb-8b6a-4134-a0ba-d81420839657

❯ curl -s https://durable-app.azurewebsites.net/api/Add\?\
entityId\=e415d7bb-8b6a-4134-a0ba-d81420839657\&amount\=10
Amount added.
```

When we check the logs we see:

```txt
2024-11-12T12:17:19Z   [Information]   Progress update: 10.0%
```

### Clean Up

Instead of calling the activity and preparing all the input directly in the entity, we can make use
of an extension function similar to what we have done before. Except this time, it is an extension
the `TaskOrchestrationContext`. Here is how that looks like:

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

With this, we simplify the communication and align it with how it is done elsewhere. The result
looks like this:

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
            ctx.signalEntity(monitorEntityId, "Update", counter)
        }
    }
}
```

## Calling Entities

We sometimes want to trigger an operation on an entity and receive a result back from it at the same
time. Here, we will develop our code so that we can do exactly that.

The first thing that we need to do is that we need to be able to pass the requester's id along with
a name of an event that we should listen to for the respose event.

We will update our data classes which now look like this:

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

With this, an entity that receives a signal will have enough information to send a signal back.

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

```kotlin
fun TaskOrchestrationContext.signalEntity(input: SignalEntityInput) {
    this.callActivity("SignalEntity", input)
}

@FunctionName("SignalEntity")
fun signalEntityActivity(
    @DurableActivityTrigger(name = "input") input: SignalEntityInput,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
) {
    durableContext.client.signalEntity(input)
}

fun DurableTaskClient.signalEntity(input: SignalEntityInput) {
    val operationJSON = objectMapper.writeValueAsString(input.operation)
    val eventName = input.eventName ?: "EntityOperation"
    this.raiseEvent(input.entityId, eventName, operationJSON)
}
```

```kotlin
fun TaskOrchestrationContext.signalEntity(input: SignalEntityInput) {
    this.callActivity("SignalEntity", input)
}

fun DurableTaskClient.signalEntity(input: SignalEntityInput) {
    val operationJSON = objectMapper.writeValueAsString(input.operation)
    val eventName = input.eventName ?: "EntityOperation"
    this.raiseEvent(input.entityId, eventName, operationJSON)
}

@FunctionName("SignalEntity")
fun signalEntityActivity(
    @DurableActivityTrigger(name = "input") input: SignalEntityInput,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
) {
    durableContext.client.signalEntity(input)
}
```

To demonstrate this, we will add a `Get` operation that signals the value of the counter back to the
requester. We will also get rid of the monitoring logic, but we will reuse the signalEntity
extension function that we created for it:

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

To do this, we will create an extension function that wraps this logic for us:

To test it out, we will create a CounterCaller that will perform the call operation for us:

```kotlin
@FunctionName("CounterCaller")
fun counterCaller(
    @DurableOrchestrationTrigger(name = "ctx") ctx: TaskOrchestrationContext,
    context: ExecutionContext,
) {
    context.logger.info("CounterCaller: Started")
    val counterEntityId = ctx.getInput(String::class.java)

    // For demo: Yield control to ensure the runtime registers everything first
    ctx.createTimer(Duration.ofSeconds(5)).await()

    val counterValue =
        ctx.callEntity(
            entityId = counterEntityId,
            operationName = "Get",
            returnType = Int::class.java,
        )

    context.logger.info("CounterCaller: received $counterValue")
}
```

```kotlin
@FunctionName("CreateCounterOrchestration")
fun createCounterOrchestration(
    @HttpTrigger(
        name = "req",
        methods = [HttpMethod.GET],
        authLevel = AuthorizationLevel.ANONYMOUS,
    )
    request: HttpRequestMessage<Optional<String>>,
    @DurableClientInput(name = "durableContext") durableContext: DurableClientContext,
): HttpResponseMessage {
    val counterId = durableContext.client.scheduleNewOrchestrationInstance("Counter")

    val callerId =
        durableContext.client.scheduleNewOrchestrationInstance(
            "CounterCaller",
            counterId,
        )

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

### Demo

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

### Clean Up

Let us move the logic for returning the result in a signal to an extension function:

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

This allows us to clean up our entity as such:

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

## Final Clean Up

TODO: Explanation

TODO: Immutability Text

We can wrap up our entity logic in a DurableEntityContext class as such:

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

This allows us to update our Counter entity as such:

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

TODO: Rehydration Text

```kotlin
fun initializeState(initialValue: Any?) {
    val state = ctx.getEntityState(ctx.instanceId, Any::class.java).await()
    if (state == null) {
        ctx.setCustomStatus(initialValue)
    }
}
```

TODO: DSL Text

We can clean this up a bit more by moving the loop operation into the DurableEntityContext. We
simply add the following method to our DurableEntityContext class:

```kotlin
fun runEntityLoop(handleOperation: DurableEntityContext.() -> Unit) {
    while (true) {
        waitForOperation()
        this.handleOperation()
    }
}
```

We can also create a function as such:

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

Giving us our final form for our entity:

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

TODO: Conclusion Text

TODO: Improvements, performance, batching
