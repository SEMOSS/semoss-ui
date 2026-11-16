import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RoutineAgentAvatar } from "./routine-agent-avatar";

afterEach(cleanup);

describe("RoutineAgentAvatar", () => {
	it("points each avatar's gradients and shadow at its own definitions", () => {
		// the list and the open routine's card show the same agent at once
		const { container } = render(
			<>
				<RoutineAgentAvatar routineId="inbox-daily-brief" />
				<RoutineAgentAvatar routineId="inbox-daily-brief" />
			</>,
		);

		const ids = [...container.querySelectorAll("[id]")].map((el) => el.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const svg of container.querySelectorAll("svg")) {
			expect(svg).toHaveAttribute("aria-hidden", "true");
			const own = [...svg.querySelectorAll("[id]")].map((el) => el.id);
			const references = [...svg.querySelectorAll("*")].flatMap((el) =>
				["fill", "stroke", "filter"].flatMap((name) => {
					const match = el
						.getAttribute(name)
						?.match(/^url\(#(.+)\)$/);
					return match ? [match[1]] : [];
				}),
			);
			expect(references.length).toBeGreaterThan(0);
			for (const reference of references)
				expect(own).toContain(reference);
		}
	});

	it("draws an owner's routine as the plain robot in a color its id keeps", () => {
		const { container } = render(
			<>
				<RoutineAgentAvatar routineId="6f1c2a3e-routine" />
				<RoutineAgentAvatar routineId="6f1c2a3e-routine" />
				<RoutineAgentAvatar routineId="inbox-daily-brief" />
			</>,
		);
		const [first, second, system] = [...container.querySelectorAll("svg")];
		const tile = (svg: Element | undefined) =>
			svg?.querySelector("rect")?.getAttribute("class");
		expect(tile(first)).toMatch(/^fill-chart-[1-5]$/);
		expect(tile(second)).toBe(tile(first));
		expect(tile(system)).toBe("fill-chart-1");
		// the system agent wears its envelope; the owner's robot wears nothing
		const shapes = (svg: Element | undefined) =>
			svg?.querySelectorAll("g[filter] > *").length ?? 0;
		expect(shapes(system)).toBeGreaterThan(shapes(first));
	});
});
