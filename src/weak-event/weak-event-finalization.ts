import { ITypedEvent, TypedEventHandler } from '@/typed-event-interfaces';

type FinalizableEventHandlerRef = { eventSource: ITypedEvent<unknown, unknown>, handler: TypedEventHandler<unknown, unknown> }


// Will this throw on unsupported browsers? Need to check...
let GLOBAL_LISTENERS_REGISTRY: FinalizationRegistry<FinalizableEventHandlerRef>;

if (!FinalizationRegistry) {
	throw new Error('FinalizationRegistry is not defined. Weak Events cannot be used. '
		+ " Please consult 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry' "
		+ 'for compatibility information');
}

GLOBAL_LISTENERS_REGISTRY = new FinalizationRegistry(
	(heldValue: FinalizableEventHandlerRef) => {
		heldValue.eventSource.detach(heldValue.handler);
	}
);

function wrapHandler<TSender, TArgs>(handler: TypedEventHandler<TSender, TArgs>): TypedEventHandler<TSender, TArgs> {
	const ref = new WeakRef(handler);
	return (sender: TSender, e: TArgs) => {
		ref.deref()?.(sender, e);
	};
}

export function createWeakEventHandler<TSender, TArgs>(
	eventSource: ITypedEvent<TSender, TArgs>,
	handler: TypedEventHandler<TSender, TArgs>
): TypedEventHandler<TSender, TArgs> {

	const castHandler = handler as TypedEventHandler<unknown, unknown>;
	GLOBAL_LISTENERS_REGISTRY.register(eventSource, { eventSource, handler: castHandler }, handler);
	return wrapHandler(handler);
}

export function unregisterWeakEventHandler<TSender, TArgs>(
	handler: TypedEventHandler<TSender, TArgs>
): TypedEventHandler<TSender, TArgs> {

	GLOBAL_LISTENERS_REGISTRY.unregister(handler);
	return wrapHandler(handler);
}
