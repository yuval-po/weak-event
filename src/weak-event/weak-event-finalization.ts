import { TypedEvent } from '../base-event';
import { ITypedEvent, TypedEventHandler } from '../typed-event-interfaces';

export type FinalizableEventHandlerRef = { eventSource: ITypedEvent<unknown, unknown>, handler: TypedEventHandler<unknown, unknown> };


// Will this throw on unsupported browsers? Need to check...
if (!FinalizationRegistry) {
	throw new Error(
		'FinalizationRegistry is not defined. Weak Events cannot be used. '
		+ " Please consult 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry'"
		+ ' for compatibility information'
	);
}

const finalizationEvent: TypedEvent<null, FinalizableEventHandlerRef> = new TypedEvent();
export const handlerFinalizedEvent: ITypedEvent<null, FinalizableEventHandlerRef> = finalizationEvent;

const GLOBAL_LISTENERS_REGISTRY: FinalizationRegistry<FinalizableEventHandlerRef> = new FinalizationRegistry(
	(heldValue: FinalizableEventHandlerRef) => {
		heldValue.eventSource.detach(heldValue.handler);
		finalizationEvent.invokeAsync(null, heldValue);
	}
);

function wrapHandler<TSender, TArgs>(handler: TypedEventHandler<TSender, TArgs>): TypedEventHandler<TSender, TArgs> {
	const ref = new WeakRef(handler);
	return (sender: TSender, e: TArgs) => {
		return ref.deref()?.(sender, e);
	};
}

export function createWeakEventHandler<TSender, TArgs>(
	eventSource: ITypedEvent<TSender, TArgs>,
	handler: TypedEventHandler<TSender, TArgs>
): TypedEventHandler<TSender, TArgs> {

	const wrappedHandler = wrapHandler(handler) as TypedEventHandler<unknown, unknown>;
	// const castHandler = handler as TypedEventHandler<unknown, unknown>;
	GLOBAL_LISTENERS_REGISTRY.register(
		handler,
		{
			eventSource,
			handler: wrappedHandler
		},
		wrappedHandler
	);
	return wrappedHandler;
}

export function unregisterWeakEventHandler<TSender, TArgs>(
	handler: TypedEventHandler<TSender, TArgs>
): TypedEventHandler<TSender, TArgs> {

	const wrappedHandler = wrapHandler(handler);
	GLOBAL_LISTENERS_REGISTRY.unregister(wrappedHandler);
	return wrappedHandler;
}
