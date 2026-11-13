import { describe, expect, it, vi } from "vitest";
import { StoreState } from "./store";

describe("StoreState", () => {
	it("keeps the same snapshot until it changes", () => {
		const state = new StoreState({ count: 0 });
		const first = state.getSnapshot();

		expect(state.getSnapshot()).toBe(first);

		state.update({ count: 1 });
		expect(state.getSnapshot()).not.toBe(first);
		expect(state.getSnapshot()).toEqual({ count: 1 });
		expect(first).toEqual({ count: 0 });
	});

	it("keeps the fields an update leaves out", () => {
		const state = new StoreState({ count: 0, label: "a" });

		state.update({ count: 2 });

		expect(state.getSnapshot()).toEqual({ count: 2, label: "a" });
	});

	it("keeps the reference of a branch an update leaves out", () => {
		const items = ["a"];
		const state = new StoreState({ count: 0, items: items });

		state.update({ count: 1 });

		expect(state.getSnapshot().items).toBe(items);
	});

	it("tells listeners until they stop listening", () => {
		const state = new StoreState({ count: 0 });
		const listener = vi.fn();
		const stop = state.subscribe(listener);

		state.set({ count: 1 });
		stop();
		stop();
		state.set({ count: 2 });

		expect(listener).toHaveBeenCalledTimes(1);
	});

	describe("writes that change nothing", () => {
		it("does not tell listeners when set is given the current state", () => {
			const state = new StoreState({ count: 0 });
			const listener = vi.fn();
			state.subscribe(listener);

			state.set(state.getSnapshot());
			state.set((current) => current);

			expect(listener).not.toHaveBeenCalled();
		});

		it("keeps the snapshot when an update holds the same values", () => {
			const state = new StoreState({ count: 0, label: "a" });
			const first = state.getSnapshot();
			const listener = vi.fn();
			state.subscribe(listener);

			state.update({ count: 0 });
			state.update({});
			state.update(() => ({ label: "a" }));

			expect(state.getSnapshot()).toBe(first);
			expect(listener).not.toHaveBeenCalled();
		});

		it("treats NaN as unchanged and a new equal object as changed", () => {
			const state = new StoreState({ ratio: Number.NaN, tags: ["a"] });
			const listener = vi.fn();
			state.subscribe(listener);

			state.update({ ratio: Number.NaN });
			expect(listener).not.toHaveBeenCalled();

			state.update({ tags: ["a"] });
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it("adds a field the state does not hold yet, even as undefined", () => {
			const state = new StoreState<{ count: number; note?: string }>({
				count: 0,
			});
			const listener = vi.fn();
			state.subscribe(listener);

			state.update({ note: undefined });

			expect(Object.hasOwn(state.getSnapshot(), "note")).toBe(true);
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe("updaters", () => {
		it("makes the next state from the current one", () => {
			const state = new StoreState({ count: 1, label: "a" });

			state.set((current) => ({ ...current, count: current.count + 1 }));
			state.update((current) => ({ count: current.count * 10 }));

			expect(state.getSnapshot()).toEqual({ count: 20, label: "a" });
		});

		it("keeps a write made while an action waited", async () => {
			const state = new StoreState({ a: 0, b: 0 });
			let release = () => {};
			const waiting = new Promise<void>((resolve) => {
				release = resolve;
			});

			const slow = async () => {
				await waiting;
				state.set((current) => ({ ...current, a: 1 }));
			};
			const pending = slow();

			state.update({ b: 1 });
			release();
			await pending;

			expect(state.getSnapshot()).toEqual({ a: 1, b: 1 });
		});
	});

	describe("state that is not a plain object", () => {
		it("replaces an array, a map and a primitive with set", () => {
			const list = new StoreState<readonly string[]>(["a"]);
			list.set((current) => [...current, "b"]);
			expect(list.getSnapshot()).toEqual(["a", "b"]);

			const map = new StoreState<ReadonlyMap<string, number>>(new Map());
			map.set((current) => new Map(current).set("k", 1));
			expect(map.getSnapshot().get("k")).toBe(1);

			const count = new StoreState(1);
			count.set((current) => current + 1);
			expect(count.getSnapshot()).toBe(2);
		});

		it("refuses to update an array, leaving it as it was", () => {
			const list = new StoreState<string[]>(["a", "b"]);
			const listener = vi.fn();
			list.subscribe(listener);

			expect(() => {
				// @ts-expect-error update cannot merge into an array
				list.update(["z"]);
			}).toThrow(TypeError);

			expect(list.getSnapshot()).toEqual(["a", "b"]);
			expect(listener).not.toHaveBeenCalled();
		});

		it("refuses to update a primitive and a map", () => {
			const count = new StoreState(5);
			expect(() => {
				// @ts-expect-error update cannot merge into a number
				count.update({});
			}).toThrow(TypeError);

			const map = new StoreState(new Map([["k", 1]]));
			expect(() => {
				// @ts-expect-error update cannot merge into a map
				map.update({});
			}).toThrow(TypeError);
			expect(map.getSnapshot()).toBeInstanceOf(Map);
		});

		it("refuses to update a class instance, which the types cannot see", () => {
			class Model {
				id = 1;
			}
			const model = new StoreState(new Model());

			expect(() => model.update({ id: 2 })).toThrow(TypeError);
			expect(model.getSnapshot()).toBeInstanceOf(Model);
		});

		it("updates a record with no prototype", () => {
			const record: { count: number } = Object.assign(
				Object.create(null),
				{
					count: 0,
				},
			);
			const state = new StoreState(record);

			state.update({ count: 1 });

			expect(state.getSnapshot().count).toBe(1);
		});

		it("refuses a function as state", () => {
			expect(() => new StoreState(() => 1)).toThrow(TypeError);
		});
	});

	describe("telling listeners", () => {
		it("tells the other listeners when one throws, then throws", () => {
			const state = new StoreState({ count: 0 });
			const failure = new Error("boom");
			const after = vi.fn();
			state.subscribe(() => {
				throw failure;
			});
			state.subscribe(after);

			expect(() => state.set({ count: 1 })).toThrow(failure);

			expect(after).toHaveBeenCalledTimes(1);
			expect(state.getSnapshot()).toEqual({ count: 1 });
		});

		it("throws every failure together when several listeners throw", () => {
			const state = new StoreState({ count: 0 });
			const first = new Error("first");
			const second = new Error("second");
			state.subscribe(() => {
				throw first;
			});
			state.subscribe(() => {
				throw second;
			});

			let thrown: unknown;
			try {
				state.set({ count: 1 });
			} catch (error) {
				thrown = error;
			}

			expect(thrown).toBeInstanceOf(AggregateError);
			expect(thrown).toHaveProperty("errors", [first, second]);
		});

		it("skips a listener that another one stopped", () => {
			const state = new StoreState({ count: 0 });
			const stopped = vi.fn();
			let stop = () => {};
			state.subscribe(() => stop());
			stop = state.subscribe(stopped);

			state.set({ count: 1 });

			expect(stopped).not.toHaveBeenCalled();
		});

		it("tells a listener added meanwhile about the next change only", () => {
			const state = new StoreState({ count: 0 });
			const late = vi.fn();
			let isAdded = false;
			state.subscribe(() => {
				if (!isAdded) {
					isAdded = true;
					state.subscribe(late);
				}
			});

			state.set({ count: 1 });
			expect(late).not.toHaveBeenCalled();

			state.set({ count: 2 });
			expect(late).toHaveBeenCalledTimes(1);
		});

		it("ends when a listener stops and starts itself on every change", () => {
			const state = new StoreState({ count: 0 });
			let calls = 0;
			let stop = () => {};
			const listener = () => {
				calls += 1;
				stop();
				stop = state.subscribe(listener);
			};
			stop = state.subscribe(listener);

			state.set({ count: 1 });

			expect(calls).toBe(1);
		});

		it("tells each listener the newest state once when a listener writes", () => {
			const state = new StoreState({ count: 0 });
			const seen: string[] = [];
			state.subscribe(() => {
				seen.push(`a:${state.getSnapshot().count}`);
				if (state.getSnapshot().count === 1) {
					state.set({ count: 2 });
				}
			});
			state.subscribe(() => {
				seen.push(`b:${state.getSnapshot().count}`);
			});

			state.set({ count: 1 });

			expect(seen).toEqual(["a:1", "a:2", "b:2"]);
		});

		it("keeps one subscription when the same listener stops the other", () => {
			const state = new StoreState({ count: 0 });
			const listener = vi.fn();
			const stopFirst = state.subscribe(listener);
			state.subscribe(listener);

			stopFirst();
			state.set({ count: 1 });

			expect(listener).toHaveBeenCalledTimes(1);
		});

		it("tells once per change", () => {
			const state = new StoreState({ count: 0 });
			const listener = vi.fn();
			state.subscribe(listener);

			state.update({ count: 1 });
			state.update({ count: 2 });

			expect(listener).toHaveBeenCalledTimes(2);
		});
	});
});
