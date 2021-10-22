
/**
 * An object specifying options for an event invocation
 * @export
*/
export type EventInvocationOpts = {

	/**
	 * Determines whether the `ITypedEvent` ignores handler exceptions during invocations
	 * @description If `true`, exceptions will be caught and not propagated to the caller.
	 * If `false`, the the handler will stop as soon as an exception is raised and no further handlers will be invoked.
	 * Note that in async invocations, the `ITypedEvent` will make a best-effort but running invocations may conclude after an error
	 *
	 * @default false
	 *
	 * @type {boolean}
	 */
	swallowExceptions?: boolean;

	/**
	 * When used in an asynchronous invocation, determines whether the `ITypedEvent`
	 * executes the attached handlers one by one (with `await`) or all at once
	 *
	 * @default true
	 * @type {boolean}
	 */
	parallelize?: boolean;
};

/**
 * A typed event
 *
 * @description This interface is meant to serve as the 'external' interface to the event;
 * The 'internal' side of this interface is `IEventSource<TSender, TArgs>` which is meant to be used by
 * the owner of the event itself
 *
 * @interface ITypedEvent
 * @template TSender The event's 'sender' i.e. source (usually the particular instance raising the event)
 * @template TArgs The event's arguments
 */
export interface ITypedEvent<TSender, TArgs> {

	/**
	 * Attaches the given handler to the event
	 *
	 * @description The same handler may be attached multiple times and will be invoked the same number of times
	 *
	 * @param {TypedEventHandler<TSender, TArgs>} handler An event handler function to attach
	 * @memberof ITypedEvent
	 */
	attach(handler: TypedEventHandler<TSender, TArgs>): void;

	/**
	 * Detaches the given handler from the event
	 *
	 * @description When detaching a handler that is attached multiple times, only one instance will be detached.
	 * This method does nothing if the given handler was not already attached.
	 *
	 * @param {TypedEventHandler<TSender, TArgs>} handler The event handler function to detach
	 * @memberof ITypedEvent
	 */
	detach(handler: TypedEventHandler<TSender, TArgs>): void;
}

/**
 * A typed event source
 *
 * @description This interface is the internal 'leg' of the event and allows the event's
 * owner to both produce and consume the event.
 *
 * In a standard design, this interface should be exposed only to the event's owner, not consumers.
 *
 * @export
 * @interface IEventSource
 * @extends {ITypedEvent<TSender, TArgs>}
 * @template TSender
 * @template TArgs
 */
export interface IEventSource<TSender, TArgs> extends ITypedEvent<TSender, TArgs> {

	/**
	 * Synchronously invokes all handlers for the event
	 *
	 * @param {TSender} sender The event's source (usually the particular instance raising the event)
	 * as should be provided to the event handlers
	 * @param {TArgs} args The arguments to provide to the handlers
	 * @param {EventInvocationOpts} [options] An optional configuration to control certain aspects of the event invocation
	 * @memberof IEventSource
	 */
	invoke(sender: TSender, args: TArgs, options?: EventInvocationOpts): void

	/**
	 * A-synchronously invokes all handlers for the event
	 *
	 * @param {TSender} sender The event's source (usually the particular instance raising the event)
	 * as should be provided to the event handlers
	 * @param {TArgs} args The arguments to provide to the handlers
	 * @param {EventInvocationOpts} [options] An optional configuration to control certain aspects of the event invocation
	 * @return {*}  {Promise<void>} A promise that is fulfilled when all handlers have been invoked
	 * @memberof IEventSource
	 */
	invokeAsync(sender: TSender, args: TArgs, options?: EventInvocationOpts): Promise<void>;
}

/**
 * The signature all event handlers must adhere to
*/
export type TypedEventHandler<TSender, TArgs> = (sender: TSender, args: TArgs) => unknown | Promise<unknown>;
