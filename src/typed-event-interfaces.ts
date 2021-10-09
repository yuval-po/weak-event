export type EventInvocationOpts = {
	swallowExceptions?: boolean;
	parallelize?: boolean;
};

export interface ITypedEvent<TSender, TArgs> {
	attach(handler: TypedEventHandler<TSender, TArgs>): void;
	detach(handler: TypedEventHandler<TSender, TArgs>): void;
}

export interface IEventSource<TSender, TArgs> extends ITypedEvent<TSender, TArgs> {
	invoke(sender: TSender, args: TArgs, options?: EventInvocationOpts): void
	invokeAsync(sender: TSender, args: TArgs, options?: EventInvocationOpts): Promise<void>;
}

export type TypedEventHandler<TSender, TArgs> = (sender: TSender, args: TArgs) => unknown | Promise<unknown>;
