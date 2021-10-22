import { EventInvocationOpts, TypedEventHandler } from '../typed-event-interfaces';

/**
 * The result of an event invocation.
 *
 * Since handlers are 'void', this type contains only whether the invocation succeeded
 * and, if it has not, what the error was
*/
export type EventInvocationResult = { succeeded: boolean, error?: unknown };


/**
 * Safely invokes the given event handler
 *
 * @export
 * @template TSender The type of the event's sender (source)
 * @template TArgs The type of the arguments provided to the event handler
 * @param {TypedEventHandler<TSender, TArgs>} handler The handler to invoke
 * @param {TSender} sender the 'sender' to provide to the handler
 * @param {TArgs} args The arguments to provide to the handler
 * @return {*}  {EventInvocationResult} The handler invocation result
 */
export function eventHandlerSafeInvoke<TSender, TArgs>(
	handler: TypedEventHandler<TSender, TArgs>,
	sender: TSender,
	args: TArgs
): EventInvocationResult {
	try {
		handler(sender, args);
		return { succeeded: true };
	} catch (error) {
		return { error, succeeded: false };
	}
}

/**
 * Safely and asynchronously invokes the given event handler
 *
 * @export
 * @template TSender The type of the event's sender (source)
 * @template TArgs The type of the arguments provided to the event handler
 * @param {TypedEventHandler<TSender, TArgs>} handler The handler to invoke
 * @param {TSender} sender the 'sender' to provide to the handler
 * @param {TArgs} args The arguments to provide to the handler
 * @return {*} {Promise<EventInvocationResult>} A promise that is fulfilled when the handler execution concluded.
 * Contains a boolean specifying whether the invocation was successful and, if not, what the error was.
 */
export async function eventHandlerSafeInvokeAsync<TSender, TArgs>(
	handler: TypedEventHandler<TSender, TArgs>,
	sender: TSender,
	args: TArgs
): Promise<EventInvocationResult> {

	try {
		await handler(sender, args);
		return { succeeded: true };
	} catch (error) {
		return { error, succeeded: false };
	}
}

/**
 * Invokes all given event handlers in accordance with the given `EventInvocationOpts`
 *
 * @export
 * @template TSender The type of the event's sender (source)
 * @template TArgs The type of the arguments provided to the event handlers
 * @param {Iterable<TypedEventHandler<TSender, TArgs>>} handlers
 * @param {TSender} sender the 'sender' to provide to the handlers
 * @param {TArgs} args The arguments to provide to the handlers
 * @param {EventInvocationOpts} options Options to control the exact behavior of the invocation
 */
export function invokeEventHandlers<TSender, TArgs>(
	handlers: Iterable<TypedEventHandler<TSender, TArgs>>,
	sender: TSender,
	args: TArgs,
	options: EventInvocationOpts
): void {
	for (const handler of handlers) {
		const { succeeded, error } = eventHandlerSafeInvoke(handler, sender, args);
		if (!succeeded && options?.swallowExceptions !== true) {
			throw error;
		}
	}
}

/**
 * Asynchronously invokes all given event handlers in accordance with the given `EventInvocationOpts`
 *
 * @export
 * @template TSender The type of the event's sender (source)
 * @template TArgs The type of the arguments provided to the event handlers
 * @param {Iterable<TypedEventHandler<TSender, TArgs>>} handlers
 * @param {TSender} sender the 'sender' to provide to the handlers
 * @param {TArgs} args The arguments to provide to the handlers
 * @param {EventInvocationOpts} options Options to control the exact behavior of the invocation
 * @return {*} {Promise<void>} A Promise that is fulfilled when all event handlers have been invoked
 */
export async function invokeEventHandlersAsync<TSender, TArgs>(
	handlers: Iterable<TypedEventHandler<TSender, TArgs>>,
	sender: TSender,
	args: TArgs,
	options: EventInvocationOpts
): Promise<void> {

	if (options?.parallelize === false) {
		for (const handler of handlers) {
			// eslint-disable-next-line no-await-in-loop
			const { succeeded, error } = await eventHandlerSafeInvokeAsync(handler, sender, args);
			if (!succeeded && options?.swallowExceptions !== true) {
				throw error;
			}
		}
	} else {
		const handlerPromises: Promise<void>[] = [];
		for (const handler of handlers) {
			// Otherwise, invoke them asynchronously and stop on failure (if required)
			handlerPromises.push(eventHandlerSafeInvokeAsync(handler, sender, args).then(({ succeeded, error }) => {
				if (!succeeded && options?.swallowExceptions !== true) {
					throw error;
				}
			}));
		}
		await Promise.all(handlerPromises);
	}
}
