import { WeakEvent } from "../src";

export class TaggedEvent extends WeakEvent<undefined, undefined> {
	public tagged = true;
}

class Scope {
	private _handler: () => void;
	constructor(event: TaggedEvent) {
		this._handler = () => { throw new Error(); }
		event.attach(this._handler);
	}

}

export function leakReference(event: TaggedEvent) {
	new Scope(event);
}
