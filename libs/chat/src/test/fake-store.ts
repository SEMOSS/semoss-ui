/** What the chat's store hooks read from a store. */
interface FakeStoreMethods {
	getSnapshot: () => unknown;
	subscribe: (listener: () => void) => () => void;
	/** Tell the hooks a field changed, after a test sets it. */
	notify: () => void;
}

/**
 * Give a test's fake store (a plain object cast as a `RoomStore`,
 * `ToolStore`, ...) what `useRoomSelector`, `useMessage`, and `useTool` read.
 * A test that changes a field afterwards calls `notify` so the component
 * renders again, as the real store's write would.
 *
 * @param fields - The fake's fields and methods.
 * @returns The same object, readable by the hooks.
 */
export const fakeStore = <T extends object>(
	fields: T,
): T & FakeStoreMethods => {
	const listeners = new Set<() => void>();
	let version = { value: 0 };
	return Object.assign(fields, {
		getSnapshot: () => version,
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		notify: () => {
			version = { value: version.value + 1 };
			for (const listener of [...listeners]) {
				listener();
			}
		},
	});
};
