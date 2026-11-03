import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UsageShareBar } from "./usage-share-bar";

afterEach(cleanup);

const renderBar = (value: number, total: number): HTMLElement => {
	render(
		<UsageShareBar
			name="Model One"
			measure="Cost"
			totalLabel="All Cost In The Period"
			value={value}
			total={total}
			details={["Cost: $1.00"]}
		/>,
	);
	return screen.getByRole("progressbar", {
		name: "Model One Share Of Cost",
	});
};

describe("a consumer's share bar", () => {
	it("says the consumer's share of the total", () => {
		const bar = renderBar(1, 8);
		expect(bar).toHaveAttribute("aria-valuenow", "12.5");
		expect(bar).toHaveAttribute(
			"aria-valuetext",
			"12.5% Of All Cost In The Period",
		);
	});

	it("never reads more than the whole total", () => {
		expect(renderBar(12, 10)).toHaveAttribute("aria-valuenow", "100");
	});

	it("reads no share of an empty total", () => {
		expect(renderBar(5, 0)).toHaveAttribute("aria-valuenow", "0");
	});
});
