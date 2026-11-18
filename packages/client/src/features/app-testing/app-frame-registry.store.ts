import { StoreState } from "@semoss/utility/store";

export interface AppFrameSnapshot {
	readonly revisions: Readonly<Record<string, number>>;
}

/** One preview registry for the client workbench; DOM resources stay outside the snapshot. */
export class AppFrameRegistryStore {
	private readonly state = new StoreState<AppFrameSnapshot>({
		revisions: {},
	});
	private readonly frames = new Map<string, HTMLIFrameElement>();

	getSnapshot = (): AppFrameSnapshot => this.state.getSnapshot();
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);
	getFrame = (appId: string): HTMLIFrameElement | null =>
		this.frames.get(appId) ?? null;

	/** Publish a mounted preview and return cleanup specific to that frame. */
	register = (appId: string, frame: HTMLIFrameElement): (() => void) => {
		this.frames.set(appId, frame);
		this.notify(appId);
		return () => {
			if (this.frames.get(appId) !== frame) return;
			this.frames.delete(appId);
			this.state.update((current) => ({
				revisions: Object.fromEntries(
					Object.entries(current.revisions).filter(
						([id]) => id !== appId,
					),
				),
			}));
		};
	};

	private notify = (appId: string): void => {
		this.state.update((current) => ({
			revisions: {
				...current.revisions,
				[appId]: (current.revisions[appId] ?? 0) + 1,
			},
		}));
	};
}
