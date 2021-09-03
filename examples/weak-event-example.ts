/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
// eslint-disable @typescript-eslint/no-unused-vars

import { WeakEvent, ITypedEvent } from '../src';

class DummyEventSource {

	private _someEvent = new WeakEvent<DummyEventSource, boolean>();

	public get someEvent(): ITypedEvent<DummyEventSource, boolean> {
		return this._someEvent;
	}

	private async raiseEventAsynchronously(): Promise<void> {
		this._someEvent.invokeAsync(this, true);
	}
}

class DummyEventConsumer {

	public constructor(eventSource: DummyEventSource) {

		// Valid usage. Handler signature matches event.
		eventSource.someEvent.attach(this.onEvent);
	}

	private onEvent(sender: DummyEventSource, e: boolean): void {
		console.log(`Event payload: ${e}`);
	}
}

class LeakyClass {

	private _eventSource = new DummyEventSource();

	public createConsumer(): void {
		const consumer = new DummyEventConsumer(this._eventSource);
		/* Do something with consumer
		 ...
		 ...
		 ...
		 Forget to 'dispose'. Consumer goes out of scope
		*/
	}
}
