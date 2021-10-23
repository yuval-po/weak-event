/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
// eslint-disable @typescript-eslint/no-unused-vars


import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { TypedEvent } from '../src';

describe('Typed-Event Sanity', () => {

	it('Does not throw when created', () => {
		expect(() => new TypedEvent<undefined, boolean>()).to.not.throw();
	});

	it('Does not throw when used synchronously', () => {
		const event = new TypedEvent<undefined, boolean>();
		expect(() => event.invoke(undefined, true)).to.not.throw();
	});

	it('Does not throw when used Asynchronously', () => {
		const event = new TypedEvent<undefined, boolean>();
		expect(async () => await event.invokeAsync(undefined, true)).to.not.throw();
	});

	it('Event is handled when used synchronously', async () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { }
		event.attach(handler);
		expect(() => event.invoke(undefined, true)).to.not.throw();
	});

	it('Event is handled when used Asynchronously', async () => {
		const resolutionPromise = new Promise<void>(resolve => {
			const event = new TypedEvent<undefined, boolean>();

			const handler = (sender: undefined, e: boolean) => { resolve(); }
			event.attach(handler);
			event.invokeAsync(undefined, true);
		});
		expect(async () => { return await resolutionPromise; }).to.not.throw();
	});

	it('Does not throw when detached', () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { }
		event.attach(handler);
		expect(() => event.detach(handler)).to.not.throw();
	});

	it('Handlers are not invoked after they are detached', () => {
		const event = new TypedEvent<undefined, boolean>();
		let hitCount: number = 0;
		const handler = (sender: undefined, e: boolean) => { hitCount++; }

		event.attach(handler);
		event.detach(handler);
		event.invoke(undefined, true);

		expect(hitCount).to.equal(0);
	});
});

describe('Typed-Event Edge-cases', () => {
	/**
	 * C# Events can register the same handler multiple times. Same behavior here
	 */
	it("When attaching the same handler N times, the handler is invoked exactly N times", () => {
		const event = new TypedEvent<undefined, boolean>();
		let hitCount: number = 0;
		const handler = (sender: undefined, e: boolean) => { hitCount++; }

		event.attach(handler);
		event.attach(handler);
		event.attach(handler);

		event.invoke(undefined, true)
		expect(hitCount).to.equal(3);
	});

	it("When multiple copies of the same handler are registered, only one is removed by un-registering", () => {
		const event = new TypedEvent<undefined, boolean>();
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
			const event = new TypedEvent<undefined, boolean>();
			const handler = (sender: undefined, e: boolean) => { throw new Error(); };

			event.detach(handler);
			event.invoke(undefined, true)
		}).to.not.throw();
	});
});

describe('Typed-Event Synchronous Error Handling', () => {

	it("Synchronous handler exceptions should cause 'TypedEvent.invoke' to throw when 'swallowExceptions' is 'undefined'", () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); };
		event.attach(handler);
		expect(() => event.invoke(undefined, true)).to.throw();
	});

	it("Synchronous handler exceptions should cause 'TypedEvent.invoke' to throw when 'swallowExceptions' is 'false'", () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); };
		event.attach(handler);
		expect(() => event.invoke(undefined, true, { swallowExceptions: false })).to.throw();
	});


	it("Synchronous handler exceptions should not cause 'TypedEvent.invoke' to throw when 'swallowExceptions' is 'true'", () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = (sender: undefined, e: boolean) => { throw new Error(); };
		event.attach(handler);
		expect(() => event.invoke(undefined, true, { swallowExceptions: true })).to.not.throw();
	});
});

describe('Typed-Event Asynchronous Error Handling', () => {

	it("Asynchronous handler exceptions should cause 'TypedEvent.invoke' to throw when 'swallowExceptions' is 'undefined' and 'parallelize' is 'false'", async () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { parallelize: false })).to.be.rejected;
	});

	it("Asynchronous handler exceptions should cause 'TypedEvent.invoke' to throw when 'swallowExceptions' is 'false' and 'parallelize' is 'false'", async () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { swallowExceptions: false, parallelize: false })).to.be.rejected;
	});


	it("Asynchronous handler exceptions should not cause 'TypedEvent.invoke' to throw when 'swallowExceptions' is 'true' and 'parallelize' is 'false'", async () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { swallowExceptions: true, parallelize: false })).is.fulfilled;
	});


	it("Asynchronous handler exceptions should cause 'TypedEvent.invoke' to throw when 'swallowExceptions' is 'false' and 'parallelize' is 'true'", async () => {
		const event = new TypedEvent<undefined, boolean>();
		const handler = async (sender: undefined, e: boolean) => { throw new Error(); }
		event.attach(handler);
		await expect(event.invokeAsync(undefined, true, { swallowExceptions: false, parallelize: true })).to.be.rejected;
	});
});
