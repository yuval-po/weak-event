/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
// eslint-disable @typescript-eslint/no-unused-vars


import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { WeakEvent, handlerFinalizedEvent, FinalizableEventHandlerRef } from '../src';
import { leakReference, TaggedEvent } from './weak-event-finalization-helpers';

describe('Weak-Event Sanity', () => {

	it('Does not throw when created', () => {
		expect(() => new WeakEvent<undefined, boolean>()).to.not.throw();
	});

	it('Does not throw when used synchronously', () => {
		const event = new WeakEvent<undefined, boolean>();
		expect(() => event.invoke(undefined, true)).to.not.throw();
	});

	it('Does not throw when used Asynchronously', () => {
		const event = new WeakEvent<undefined, boolean>();
		expect(async () => await event.invokeAsync(undefined, true)).to.not.throw();
	});

	it('Event is handled when used synchronously', async () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { }
		event.attach(handler);
		expect(() => event.invoke(undefined, true)).to.not.throw();
	});

	it('Event is handled when used Asynchronously', async () => {
		const resolutionPromise = new Promise<void>(resolve => {
			const event = new WeakEvent<undefined, boolean>();

			const handler = (sender: undefined, e: boolean) => { resolve(); }
			event.attach(handler);
			event.invokeAsync(undefined, true);
		});
		expect(async () => { return await resolutionPromise; }).to.not.throw();
	});

	it('Does not throw when detached', () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { }
		event.attach(handler);
		expect(() => event.detach(handler)).to.not.throw();
	});
});

describe('Weak-Event Synchronous Error Handling', () => {

	it("Synchronous handler exceptions should cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'undefined'", () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		expect(() => event.invoke(undefined, true)).to.throw();
	});

	it("Synchronous handler exceptions should cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'false'", () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		expect(() => event.invoke(undefined, true, { swallowExceptions: false })).to.throw();
	});


	it("Synchronous handler exceptions do not cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'true'", () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		expect(() => event.invoke(undefined, true, { swallowExceptions: true })).to.not.throw();
	});
});

describe('Weak-Event Asynchronous Error Handling', () => {

	it("Asynchronous handler exceptions should cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'undefined' and 'parallelize' is 'false'", async () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { parallelize: false })).to.be.rejected;
	});

	it("Asynchronous handler exceptions should cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'false' and 'parallelize' is 'false'", async () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { swallowExceptions: false, parallelize: false })).to.be.rejected;
	});


	it("Asynchronous handler exceptions do not cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'true' and 'parallelize' is 'false'", async () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { swallowExceptions: true, parallelize: false })).is.fulfilled;
	});


	it("Asynchronous handler exceptions should cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'false' and 'parallelize' is 'true'", async () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { swallowExceptions: false, parallelize: true })).to.be.rejected;
	});
});

describe('Weak-Event Finalization', () => {
	it('Dead handlers are cleaned by GC', async () => {

		// Create a handler with an extra field for easy tracking
		const event = new TaggedEvent();
		
		// Create a promise that's fulfilled when the FinalizationRegistry finalizes the handler
		// Note that handlers from previous tests may very well still reside in the registry
		// so the event may be fired multiple times
		const handlerReclaimed = new Promise((resolve) => {
			handlerFinalizedEvent.attach((sender, e) => {
				const castEvent = e.eventSource as TaggedEvent;
				if (castEvent === event) {
					// Resolve only if the finalized handler belongs to the TaggedEvent declared above
					resolve(true)
				}
			});
		});

		// Leak an event handler
		leakReference(event);

		// Use V8 native API to (sort-of) force GC to collect all handlers.
		// This is, from the code's perspective, non-deterministic and may take a good few seconds
		await eval("%CollectGarbage('all')");

		// Wait for the FinalizationRegistry to finalize the handler
		await expect(handlerReclaimed).to.be.fulfilled;
	}).slow(20000).timeout(30000) // GC lives by its own rules. On testing machine, reclamation/notification took around 8800 ms
});
