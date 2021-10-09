import { EventInvocationOpts, IEventSource, TypedEventHandler } from '../typed-event-interfaces';
import { eventInvoke, eventInvokeAsync } from './typed-event-functional';

const DEFAULT_INVOCATION_OPTS: EventInvocationOpts = {
	swallowExceptions: false,
	parallelize: true
};

export class TypedEvent<TSender, TArgs> implements IEventSource<TSender, TArgs> {

	protected _handlers: Set<TypedEventHandler<TSender, TArgs>> = new Set<TypedEventHandler<TSender, TArgs>>();

	public attach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.add(handler);
	}

	public detach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.delete(handler);
	}

	public invoke(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): void {
		eventInvoke(this._handlers, sender, args, options);
	}

	public async invokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): Promise<void> {
		await eventInvokeAsync(this._handlers, sender, args, options);
	}
}
