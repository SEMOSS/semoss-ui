// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { useLatestRef } from "./use-latest-ref";

describe("useLatestRef", () => {
	it("holds the first value at once", () => {
		const { result } = renderHook(() => useLatestRef("a"));

		expect(result.current.current).toBe("a");
	});

	it("holds the latest value after each render, with the same ref", () => {
		const { result, rerender } = renderHook(
			({ value }) => useLatestRef(value),
			{ initialProps: { value: 1 } },
		);
		const ref = result.current;

		rerender({ value: 2 });

		expect(result.current).toBe(ref);
		expect(ref.current).toBe(2);
	});

	it("is up to date before the component's effects run", () => {
		const seen: number[] = [];
		const { rerender } = renderHook(
			({ value }) => {
				const ref = useLatestRef(value);
				// runs after every commit
				useEffect(() => {
					seen.push(ref.current);
				});
			},
			{ initialProps: { value: 1 } },
		);

		rerender({ value: 2 });

		expect(seen).toEqual([1, 2]);
	});

	it("is not written while rendering", () => {
		const during: number[] = [];
		const { rerender } = renderHook(
			({ value }) => {
				const ref = useLatestRef(value);
				during.push(ref.current);
			},
			{ initialProps: { value: 1 } },
		);

		rerender({ value: 2 });

		expect(during).toEqual([1, 1]);
	});
});
