import { ITypedEvent, TypedEventHandler } from '../typed-event-interfaces';

export type EventInvocationOpts = {
	swallowExceptions?: boolean;
	parallelize?: boolean;
};

const DEFAULT_INVOCATION_OPTS: EventInvocationOpts = {
	swallowExceptions: false,
	parallelize: true
};

type InvocationResult = { succeeded: boolean, error?: unknown };

export class TypedEvent<TSender, TArgs> implements ITypedEvent<TSender, TArgs> {

	protected _handlers: Set<TypedEventHandler<TSender, TArgs>> = new Set<TypedEventHandler<TSender, TArgs>>();

	public attach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.add(handler);
	}

	public detach(handler: TypedEventHandler<TSender, TArgs>): void {
		this._handlers.delete(handler);
	}

	public invoke(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): void {
		for (const handler of this._handlers) {
			const { succeeded, error } = this.tryInvokeInternal(handler, sender, args);
			if (!succeeded && options.swallowExceptions !== true) {
				throw error;
			}
		}
	}

	public async invokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): Promise<void> {
		if (options?.parallelize === false) {
			for (const handler of this._handlers) {
				// eslint-disable-next-line no-await-in-loop
				const { succeeded, error } = await this.tryAsyncInvokeInternal(handler, sender, args);
				if (!succeeded && options.swallowExceptions !== true) {
					throw error;
				}
			}
		} else {
			const handlerPromises: Promise<void>[] = [];
			for (const handler of this._handlers) {
				// Otherwise, invoke them asynchronously and stop on failure (if required)
				handlerPromises.push(this.tryAsyncInvokeInternal(handler, sender, args).then(({ succeeded, error }) => {
					if (!succeeded && options.swallowExceptions !== true) {
						throw error;
					}
				}));
			}
			await Promise.all(handlerPromises);
		}
	}

	private tryInvokeInternal(handler: TypedEventHandler<TSender, TArgs>, sender: TSender, args: TArgs): InvocationResult {
		try {
			handler(sender, args);
			return { succeeded: true };
		} catch (error) {
			return { error, succeeded: false };
		}
	}

	private async tryAsyncInvokeInternal(
		handler: TypedEventHandler<TSender, TArgs>,
		sender: TSender,
		args: TArgs
	): Promise<InvocationResult> {

		try {
			await handler(sender, args);
			return { succeeded: true };
		} catch (error) {
			return { error, succeeded: false };
		}
	}
}
