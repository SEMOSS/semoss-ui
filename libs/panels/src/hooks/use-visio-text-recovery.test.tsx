import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useVisioTextRecovery } from "./use-visio-text-recovery";

afterEach(() => {
	cleanup();
	document.body.replaceChildren();
});

describe("Visio text recovery", () => {
	it("preserves a native blur refusal, ignores stale outcomes, and clears a corrected draft", () => {
		const element = Object.assign(document.createElement("div"), {
			controller: { sourceGeneration: 1 },
		});
		document.body.append(element);
		// Only the connected element and source generation participate in this hook's contract.
		const { result } = renderHook(() =>
			useVisioTextRecovery(element, "file:1"),
		);
		const publish = (status: string, sourceGeneration = 1) =>
			act(() => {
				element.dispatchEvent(
					new CustomEvent("visio-text-edit", {
						detail: {
							status,
							sourceGeneration,
							documentGeneration: 2,
							pageId: "p1",
							shapeId: "s1",
							text: "recover me",
							message: "Refused",
						},
					}),
				);
			});
		publish("refused");
		expect(result.current.failures).toEqual([
			{
				pageId: "p1",
				shapeId: "s1",
				text: "recover me",
				message: "Refused",
			},
		]);
		publish("committed", 0);
		expect(result.current.failures).toHaveLength(1);
		publish("committed");
		expect(result.current.failures).toEqual([]);
	});
});
