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
});
