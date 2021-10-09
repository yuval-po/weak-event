import { IEventSource, WeakEvent } from "../src";

export class TaggedEvent extends WeakEvent<undefined, undefined> {
	public tag: string | number;

	public constructor(tag?: string | number) {
		super();
		this.tag = tag || 'tagged';
	}
}

class Scope<TSender, TArgs> {
	private _handler: () => void;
	constructor(event: IEventSource<TSender, TArgs>) {
		this._handler = () => { throw new Error(); }
		event.attach(this._handler);
	}

}

export function leakReference<TSender, TArgs>(event: IEventSource<TSender, TArgs>) {
	new Scope(event);
}
