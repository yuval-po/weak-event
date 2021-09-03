/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
// eslint-disable @typescript-eslint/no-unused-vars

import { TypedEvent, ITypedEvent } from '../src';

class DummyEventSource {

	public get someProperty(): string {
		return "I'm an event source";
	}

	private _someEvent = new TypedEvent<DummyEventSource, string>();

	public get someEvent(): ITypedEvent<DummyEventSource, string> {
		return this._someEvent;
	}

	private raiseEventSynchronously(): void {
		this._someEvent.invoke(this, 'Some value');

		// We get here after all events have been synchronously invoked
		console.log('Done!');
	}

	private async raiseEventAsynchronously(): Promise<void> {
		this._someEvent.invokeAsync(this, 'Some value');

		// We get here as soon as the 'invokeAsync' method yields. Events are invoked asynchronously
		console.log('Done!');
	}
}

class DummyEventConsumer {

	private _eventSource: DummyEventSource;

	public constructor(eventSource: DummyEventSource) {

		this._eventSource = eventSource;

		// Valid usage. Handler signature matches event.
		eventSource.someEvent.attach(this.onEvent);
	}

	private onEvent(sender: DummyEventSource, e: string): void {
		console.log(`Caller property: ${sender.someProperty}, Event payload: ${e}`);
	}

	public dispose(): void {
		// Detach the event handler
		this._eventSource.someEvent.detach(this.onEvent);
	}
}
