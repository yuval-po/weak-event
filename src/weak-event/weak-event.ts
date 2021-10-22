import { TypedEvent } from '../base-event';
import { FinalizableEventHandlerRef, WeakHandlerHolder } from './weak-event-finalization';
import { eventSafeInvoke, eventSafeInvokeAsync } from '../base-event/typed-event-functional';
import {
	EventInvocationOpts,
	IEventSource,
	ITypedEvent,
	TypedEventHandler
} from '../typed-event-interfaces';


/**
 * The default invocation options for the `WeakEvent` class.
 * @type {*}
 */
const DEFAULT_INVOCATION_OPTS: EventInvocationOpts = {
	swallowExceptions: false,
	parallelize: true
};


/**
 * An event who's handlers are weakly referenced
 *
 * @description Handlers attached to this event are weakly referenced and as such may be garbage collected
 * if the handler goes out of scope. This prevents certain types of event-related memory leaks.
 *
 * For information regarding this pattern, please visit:
 * * https://v8.dev/features/weak-references
 * * https://docs.microsoft.com/en-us/dotnet/desktop/wpf/advanced/weak-event-patterns
 *
 * @export
 * @class WeakEvent
 * @implements {IEventSource<TSender, TArgs>}
 * @param {TSender} sender The event's source (usually the particular instance raising the event)
 * as should be provided to the event handlers
 * @param {TArgs} args The arguments to provide to the handlers
 */
export class WeakEvent<TSender, TArgs> implements IEventSource<TSender, TArgs> {

	private _handlers: WeakRef<TypedEventHandler<TSender, TArgs>>[] = [];

	private _refHolder: WeakHandlerHolder<TSender, TArgs>;

	private _handlerFinalizedEvent: TypedEvent<this, FinalizableEventHandlerRef<TSender, TArgs>> = new TypedEvent();

	public handlerFinalizedEvent: ITypedEvent<this, FinalizableEventHandlerRef<TSender, TArgs>> = this._handlerFinalizedEvent;

	public constructor() {
		// Need to add Try Catch here and allow configuring the event to fall back to strong refs on unsupported environments
		this._refHolder = new WeakHandlerHolder<TSender, TArgs>(
			(heldValue: FinalizableEventHandlerRef<TSender, TArgs>) => {
				this.onHandlerFinalizer(heldValue);
			}
		);
	}

	public invoke(sender: TSender, args: TArgs, options?: EventInvocationOpts): void {
		for (const handlerRef of this._handlers) {
			const dereferencedHandler = handlerRef?.deref();
			if (dereferencedHandler) {
				const { succeeded, error } = eventSafeInvoke(dereferencedHandler, sender, args);
				if (!succeeded && options?.swallowExceptions !== true) {
					throw error;
				}
			} else {
				this.releaseHandler(handlerRef);
			}
		}
	}

	public async invokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): Promise<void> {
		if (options?.parallelize === false) {
			await this.sequentialInvokeAsync(sender, args, options);
		} else {
			await this.parallelInvokeAsync(sender, args, options);
		}
	}

	private async sequentialInvokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts): Promise<void> {
		for (const handlerRef of this._handlers) {
			const dereferencedHandler = handlerRef?.deref();
			if (dereferencedHandler) {
				// eslint-disable-next-line no-await-in-loop
				const { succeeded, error } = await eventSafeInvokeAsync(dereferencedHandler, sender, args);
				if (!succeeded && options.swallowExceptions !== true) {
					throw error;
				}
			} else {
				this.releaseHandler(handlerRef);
			}
		}
	}

	private async parallelInvokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts): Promise<void> {
		const handlerPromises: Promise<void>[] = [];
		for (const handlerRef of this._handlers) {
			const dereferencedHandler = handlerRef?.deref();
			if (dereferencedHandler) {
				// Otherwise, invoke them asynchronously and stop on failure (if required)
				handlerPromises.push(eventSafeInvokeAsync(dereferencedHandler, sender, args)
					.then(({ succeeded, error }) => {
						if (!succeeded && options.swallowExceptions !== true) {
							throw error;
						}
					}));
			} else {
				this.releaseHandler(handlerRef);
			}
		}
		await Promise.all(handlerPromises);
	}

	public attach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.push(this._refHolder.getWeakHandler(this, handler));
	}

	/**
	 * Detaches the given `TypedEventHandler` from the event source.
	 * This method does nothing if the handler was not previously registered.
	 * @param handler The `TypedEventHandler` to detach
	 */
	public detach(handler: TypedEventHandler<TSender, TArgs>): void {
		const ref = this._refHolder.releaseWeakHandler(handler);
		this.tryRemoveHandlerRef(ref);
	}

	private onHandlerFinalizer(heldValue: FinalizableEventHandlerRef<TSender, TArgs>) {
		this.tryRemoveHandlerRef(heldValue?.handlerRef);
		this._handlerFinalizedEvent.invokeAsync(this, heldValue, { swallowExceptions: true });
	}

	private tryRemoveHandlerRef(ref: WeakRef<TypedEventHandler<TSender, TArgs>>): void {
		const handlerIdx = this._handlers.findIndex((handlerRef) => handlerRef === ref);
		if (handlerIdx >= 0) {
			this._handlers.splice(handlerIdx, 1);
		}
	}

	private releaseHandler(ref: WeakRef<TypedEventHandler<TSender, TArgs>>) {
		this._refHolder.unregisterRef(ref);
		this.tryRemoveHandlerRef(ref);
	}
}
