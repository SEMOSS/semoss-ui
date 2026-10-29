import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UsageLimitGuide } from "./usage-limit-guide";
import {
	USAGE_LIMIT_CAN_SET_LABEL,
	USAGE_LIMIT_ORDER,
	USAGE_LIMIT_SETUPS,
	USAGE_LIMIT_TEAM_RULES,
	USAGE_LIMIT_VIEWER_NOTES,
} from "./usage-limit-guide-content";

afterEach(cleanup);

describe("UsageLimitGuide", () => {
	it("lists the limits in the order they are tried", () => {
		render(<UsageLimitGuide />);
		const order = screen
			.getAllByRole("list")
			.find((list) => list.tagName === "OL");
		expect(order).toBeDefined();
		const items = within(order as HTMLElement).getAllByRole("listitem");
		const expected = [
			"Direct Limit",
			"Team Limit",
			"Public Use Limit",
			"User's Total Model Limit",
			"General Platform Limit",
		];
		expect(USAGE_LIMIT_ORDER.map((source) => source.label)).toEqual(
			expected,
		);
		expect(items).toHaveLength(expected.length);
		expected.forEach((label, index) => {
			expect(within(items[index]).getByText(label)).toBeTruthy();
		});
	});

	it("opens How a Limit Is Picked and the host's section, and no other", () => {
		render(<UsageLimitGuide section="teams" />);
		expect(screen.getByText("Model Total")).toBeTruthy();
		expect(screen.getByText(USAGE_LIMIT_TEAM_RULES[0])).toBeTruthy();
		expect(screen.queryByText(USAGE_LIMIT_SETUPS[0].text)).toBeNull();
		expect(
			screen
				.getByRole("button", { name: /^Common Setups/ })
				.getAttribute("aria-expanded"),
		).toBe("false");
	});

	it("marks nothing when it does not know what the viewer can set", () => {
		render(<UsageLimitGuide />);
		expect(screen.queryByText(USAGE_LIMIT_CAN_SET_LABEL)).toBeNull();
	});

	it("marks the model's own limits for one of its owners", () => {
		render(
			<UsageLimitGuide
				section="who"
				viewer={{ canSetModelLimits: true }}
			/>,
		);
		// the Model Total, Direct Limit, Team Limit and Public Use Limit
		expect(screen.getAllByText(USAGE_LIMIT_CAN_SET_LABEL)).toHaveLength(4);
		expect(screen.getByText(USAGE_LIMIT_VIEWER_NOTES.owner)).toBeTruthy();
	});

	it("marks every limit for an admin in admin mode", () => {
		render(<UsageLimitGuide viewer={{ isAdminMode: true }} />);
		expect(screen.getAllByText(USAGE_LIMIT_CAN_SET_LABEL)).toHaveLength(7);
	});

	it("tells an editor that only owners set limits, and marks none", () => {
		render(
			<UsageLimitGuide
				section="who"
				viewer={{ canSetModelLimits: false }}
			/>,
		);
		expect(screen.queryByText(USAGE_LIMIT_CAN_SET_LABEL)).toBeNull();
		expect(screen.getByText(USAGE_LIMIT_VIEWER_NOTES.editor)).toBeTruthy();
	});

	it("leaves out the common setups for someone reading their own limits", () => {
		render(<UsageLimitGuide isOwnView={true} section="setups" />);
		expect(
			screen.queryByRole("button", { name: /^Common Setups/ }),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: /^See It for One Person/ }),
		).toBeTruthy();
	});
});
