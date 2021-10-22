import { EventInvocationOpts, IEventSource, TypedEventHandler } from '../typed-event-interfaces';
import { invokeEventHandlers, invokeEventHandlersAsync } from './typed-event-functional';

/**
 * The default invocation options for the `WeakEvent` class.
 * @type {*}
 */
const DEFAULT_INVOCATION_OPTS: EventInvocationOpts = {
	swallowExceptions: false,
	parallelize: true
};

/**
 * A basic, typed event
 *
 * @export
 * @class TypedEvent
 * @implements {IEventSource<TSender, TArgs>}
 * @param {TSender} sender The event's source (usually the particular instance raising the event)
 * as should be provided to the event handlers
 * @param {TArgs} args The arguments to provide to the handlers
 */
export class TypedEvent<TSender, TArgs> implements IEventSource<TSender, TArgs> {

	protected _handlers: Set<TypedEventHandler<TSender, TArgs>> = new Set<TypedEventHandler<TSender, TArgs>>();

	public attach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.add(handler);
	}

	public detach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.delete(handler);
	}

	public invoke(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): void {
		invokeEventHandlers(this._handlers, sender, args, options);
	}

	public async invokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): Promise<void> {
		await invokeEventHandlersAsync(this._handlers, sender, args, options);
	}
}
