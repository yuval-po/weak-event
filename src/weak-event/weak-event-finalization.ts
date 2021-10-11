import { ITypedEvent, TypedEventHandler } from '../typed-event-interfaces';
import { FinalizationRegistryMissingError } from './errors';

export type FinalizableEventHandlerRef<TSender, TArgs> = {
	eventSource: ITypedEvent<TSender, TArgs>,
	handlerRef: WeakRef<TypedEventHandler<TSender, TArgs>>
};

type Finalizer<TSender, TArgs> = (heldValue: FinalizableEventHandlerRef<TSender, TArgs>) => void;


export class WeakHandlerHolder<TSender, TArgs> {

	private _finalizationRegistry: FinalizationRegistry<FinalizableEventHandlerRef<TSender, TArgs>>;

	private _refs: WeakRef<TypedEventHandler<TSender, TArgs>>[] = [];

	public constructor(finalizer: Finalizer<TSender, TArgs>) {
		try {
			this._finalizationRegistry = new FinalizationRegistry(finalizer);
		} catch (err) {
			const asRefErr = err as ReferenceError;
			if (asRefErr.name === 'FinalizationRegistry') {
				throw new FinalizationRegistryMissingError(
					'FinalizationRegistry is not defined. Weak Events cannot be used. '
					+ ' Please consult '
					+ "'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry'"
					+ ' for compatibility information'
				);
			}
			throw err;
		}
	}

	public getWeakHandler(
		eventSource: ITypedEvent<TSender, TArgs>,
		handler: TypedEventHandler<TSender, TArgs>
	): WeakRef<TypedEventHandler<TSender, TArgs>> {

		const handlerRef = new WeakRef(handler);
		this._finalizationRegistry.register(handler, { eventSource, handlerRef }, handlerRef);
		this._refs.push(handlerRef);
		return handlerRef;
	}

	public releaseWeakHandler(handler: TypedEventHandler<TSender, TArgs>): WeakRef<TypedEventHandler<TSender, TArgs>> {
		const existingRef = this._refs.find((ref) => ref?.deref() === handler);
		const refToUse = existingRef || new WeakRef(handler);
		this._finalizationRegistry.unregister(refToUse);
		return refToUse;
	}

	public unregisterRef(ref: WeakRef<TypedEventHandler<TSender, TArgs>>): void {
		this._finalizationRegistry.unregister(ref);
	}

}
