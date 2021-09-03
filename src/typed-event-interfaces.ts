export interface ITypedEvent<TSender, TArgs> {
	attach(handler: TypedEventHandler<TSender, TArgs>): void;
	detach(handler: TypedEventHandler<TSender, TArgs>): void;
}

export type TypedEventHandler<TSender, TArgs> = (sender: TSender, args: TArgs) => void | Promise<void>;