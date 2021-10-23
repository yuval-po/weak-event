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

	protected _handlers: TypedEventHandler<TSender, TArgs>[] = [];

	public attach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.push(handler);
	}

	public detach(handler: TypedEventHandler<TSender, TArgs>): void {
		this.tryRemoveHandler(handler);
	}

	public invoke(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): void {
		invokeEventHandlers(this._handlers, sender, args, options);
	}

	public async invokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): Promise<void> {
		await invokeEventHandlersAsync(this._handlers, sender, args, options);
	}

	private tryRemoveHandler(handlerToRemove: TypedEventHandler<TSender, TArgs>): void {
		const handlerIdx = this._handlers.findIndex((handler) => handler === handlerToRemove);
		if (handlerIdx >= 0) {
			this._handlers.splice(handlerIdx, 1);
		}
	}
}
