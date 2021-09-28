/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
// eslint-disable @typescript-eslint/no-unused-vars


import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { WeakEvent, handlerFinalizedEvent, FinalizableEventHandlerRef } from '../src';

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

		function attachHandler(event: WeakEvent<undefined, boolean>): Promise<void> {
			// Force a new scope
			const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
			event.attach(handler);

			return new Promise((resolve) => {
				handlerFinalizedEvent.attach(() => resolve());
				eval("%CollectGarbage('all')");
			})
		}

		const event = new WeakEvent<undefined, boolean>();
		const finalizationNotifier = attachHandler(event);

		// Force V8 GC to collect the handler

		await expect(finalizationNotifier).to.be.fulfilled;
	});
});
