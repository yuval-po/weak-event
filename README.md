# weak-event

C#-Style Typescript Events/Weak Events

[![weak-event](https://github.com/yuval-po/weak-event/actions/workflows/weak-event.yml/badge.svg)](https://github.com/yuval-po/weak-event/actions/workflows/weak-event.yml) [![Coverage Status](https://coveralls.io/repos/github/yuval-po/weak-event/badge.svg?branch=main)](https://coveralls.io/github/yuval-po/weak-event?branch=main)


Javascript's event are somewhat awkward to use and lack first-class typing support.
This package seeks to allow for lightweight, zero dependency, easy to use C#-style events that work on NodeJS and modern browsers.

The package is quite similar to [strongly-typed-events](https://github.com/KeesCBakker/Strongly-Typed-Events-for-TypeScript) but is significantly
smaller and less featured.

It does however support `WeakEvent`s that transpile on ES2021 and require NodeJS 14.6+ or an updated, modern browser due to
the use of [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)

`WeakEvent` are useful when object lifecycles cannot be guaranteed or controlled. This tends to happen in collaborative/enterprise scenarios where several developers may create or consume events or entities without fully understanding their lifecycles and exceptionals or the code's ecosystem.
Usage of weak references in such cases may help prevent hard to detect event handler leaks which are some of the most common ones.

<br />

### Typed Event

```typescript
import { TypedEvent, ITypedEvent } from 'weak-event';

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

		// We get here as soon as the 'invokeAsync' method yields.
		// Events are invoked asynchronously.
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


```
<br />

### Weak Event

The below example is a simplified but rather typical usecase where an event listener object goes
out of scope. Under normal circumstances, the Garbage Collector would not reclaim the object as it's still
referenced by the the event source's listener's dictionary.

Using `WeakEvent`, however, GC can mark the object for deletion and, at an indeterminate time (depending on the current platform's Javascript engine)
sweep the object, at which point a finalizer will be invoked and the dead reference cleaned from the event source's map.
This ensures memory is eventually reclaimed and can over time make a significant difference.

```typescript
import { TypedEvent, ITypedEvent } from 'weak-event';

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

```
