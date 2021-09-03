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
			if (!succeeded && options.swallowExceptions === false) {
					throw error;
			}
		}
	}

	public async invokeAsync(sender: TSender, args: TArgs, options: EventInvocationOpts = DEFAULT_INVOCATION_OPTS): Promise<void> {
		for (const handler of this._handlers) {
			if (options?.parallelize === false) {
				// If 'parallelize' is explicitly false, invoke the handlers one by one
				// eslint-disable-next-line no-await-in-loop
				const { succeeded, error } = this.tryInvokeInternal(handler, sender, args);
				if (!succeeded && options.swallowExceptions === false) {
					throw error;
			}
			} else {
				// Otherwise, invoke them asynchronously and stop on failure (if required)
				this.tryAsyncInvokeInternal(handler, sender, args).catch((err) => {
					if (options.swallowExceptions === false) {
						throw err;
					}
				});
			}
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
