/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
// eslint-disable @typescript-eslint/no-unused-vars


import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { inspect } from 'util';
chai.use(chaiAsPromised);

import { WeakEvent, FinalizableEventHandlerRef } from '../src';
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

	it('Handlers are not invoked after they are detached', () => {
		const event = new WeakEvent<undefined, boolean>();
		let hitCount: number = 0;
		const handler = (sender: undefined, e: boolean) => { hitCount++; }

		event.attach(handler);
		event.detach(handler);
		event.invoke(undefined, true);

		expect(hitCount).to.equal(0);
	});
});

describe('Weak-Event Edge-cases', () => {
	/**
	 * C# Events can register the same handler multiple times. Same behavior here
	 */
	it("When attaching the same handler N times, the handler is invoked exactly N times", () => {
		const event = new WeakEvent<undefined, boolean>();
		let hitCount: number = 0;
		const handler = (sender: undefined, e: boolean) => { hitCount++; }

		event.attach(handler);
		event.attach(handler);
		event.attach(handler);

		event.invoke(undefined, true)
		expect(hitCount).to.equal(3);
	});

	it("When multiple copies of the same handler are registered, only one is removed by un-registering", () => {
		const event = new WeakEvent<undefined, boolean>();
		let hitCount: number = 0;
		const handler = (sender: undefined, e: boolean) => { hitCount++; }

		event.attach(handler);
		event.attach(handler);
		event.attach(handler);
		event.attach(handler);

		event.detach(handler);

		event.invoke(undefined, true)
		expect(hitCount).to.equal(3);
	});

	it("Doesn't throw when removing an unregistered handler", () => {
		expect(() => {
			const event = new WeakEvent<undefined, boolean>();
			const handler = (sender: undefined, e: boolean) => { throw new Error(); };

			event.detach(handler);
			event.invoke(undefined, true)
		}).to.not.throw();
	});
});

describe('Weak-Event Synchronous Error Handling', () => {

	it("Synchronous handler exceptions should cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'undefined'", () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); };
		event.attach(handler);
		expect(() => event.invoke(undefined, true)).to.throw();
	});

	it("Synchronous handler exceptions should cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'false'", () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); };
		event.attach(handler);
		expect(() => event.invoke(undefined, true, { swallowExceptions: false })).to.throw();
	});


	it("Synchronous handler exceptions do not cause 'WeakEvent.invoke' to throw when 'swallowExceptions' is 'true'", () => {
		const event = new WeakEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); };
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
	it('Dead handlers are finalized', async () => {

		// Create a handler with an extra field for easy tracking
		const event = new WeakEvent<undefined, undefined>();

		// Create a promise that's fulfilled when the FinalizationRegistry finalizes the handler
		// Note that handlers from previous tests may very well still reside in the registry
		// so the event may be fired multiple times
		const handlerReclaimed = new Promise((resolve) => {
			event.handlerFinalizedEvent.attach((sender, e) => {
				if (e.eventSource === event) {
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
	}).slow(25000).timeout(45000) // GC lives by its own rules. On testing machine, reclamation/notification took around 8800 ms

	it("Doesn't break during stress test", async () => {
		const NUM_OF_EVENTS = 100000;

		// Please take a gander at test 'Dead handlers are finalized' for thorough documentation
		let reclaimedHandlers: number = 0;
		const allHandlersReclaimed = new Promise((resolve) => {
	
			const events: TaggedEvent[] = [];
			// Leak NUM_OF_EVENTS event + handler pairs and check whether they're all reclaimed
			for (let i = 0; i < NUM_OF_EVENTS + 1; i++) {
				events[i] = new TaggedEvent(i);
				events[i].handlerFinalizedEvent.attach((sender, e) => {
					const castEvent = e.eventSource as TaggedEvent;
					if (typeof castEvent?.tag === 'number') {
						reclaimedHandlers++;
						if (reclaimedHandlers === NUM_OF_EVENTS) {
							resolve(true);
						}
					} else {
						throw new Error(`Unexpected finalization event- ${inspect(e)}`);
					}
				});
				leakReference(events[i]);
			}

		});

		await eval("%CollectGarbage('all')");

		// Wait for the FinalizationRegistry to finalize the handler
		await expect(allHandlersReclaimed).to.be.fulfilled;
	}).slow(45000).timeout(75000)
});
