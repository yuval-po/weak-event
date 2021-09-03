import { BaseTypedEvent } from '../base-event/base-typed-event';
import { TypedEventHandler } from '../typed-event-interfaces';
import { createWeakEventHandler, unregisterWeakEventHandler } from './weak-event-finalization';

export class TypedWeakEvent<TSender, TArgs> extends BaseTypedEvent<TSender, TArgs> {

	public attach(handler: TypedEventHandler<TSender, TArgs>): void {
		super.attach(createWeakEventHandler(this, handler));
	}

	public detach(handler: TypedEventHandler<TSender, TArgs>): void {
		super.detach(unregisterWeakEventHandler(handler));
	}
}
