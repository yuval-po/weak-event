import { EventInvocationOpts, TypedEventHandler } from '../typed-event-interfaces';

export type EventInvocationResult = { succeeded: boolean, error?: unknown };


export function eventSafeInvoke<TSender, TArgs>(
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

export async function eventSafeInvokeAsync<TSender, TArgs>(
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

export function eventInvoke<TSender, TArgs>(
	handlers: Iterable<TypedEventHandler<TSender, TArgs>>,
	sender: TSender,
	args: TArgs,
	options: EventInvocationOpts
): void {
	for (const handler of handlers) {
		const { succeeded, error } = eventSafeInvoke(handler, sender, args);
		if (!succeeded && options.swallowExceptions !== true) {
			throw error;
		}
	}
}

export async function eventInvokeAsync<TSender, TArgs>(
	handlers: Iterable<TypedEventHandler<TSender, TArgs>>,
	sender: TSender,
	args: TArgs,
	options: EventInvocationOpts
): Promise<void> {

	if (options?.parallelize === false) {
		for (const handler of handlers) {
			// eslint-disable-next-line no-await-in-loop
			const { succeeded, error } = await eventSafeInvokeAsync(handler, sender, args);
			if (!succeeded && options.swallowExceptions !== true) {
				throw error;
			}
		}
	} else {
		const handlerPromises: Promise<void>[] = [];
		for (const handler of handlers) {
			// Otherwise, invoke them asynchronously and stop on failure (if required)
			handlerPromises.push(eventSafeInvokeAsync(handler, sender, args).then(({ succeeded, error }) => {
				if (!succeeded && options.swallowExceptions !== true) {
					throw error;
				}
			}));
		}
		await Promise.all(handlerPromises);
	}
}
