import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Progress } from "./progress";

afterEach(cleanup);

const bar = (): HTMLElement => screen.getByRole("progressbar");

describe("Progress", () => {
	it("reports its value to assistive technology", () => {
		render(<Progress value={40} aria-label="Upload" />);
		expect(bar().getAttribute("aria-valuenow")).toBe("40");
		expect(bar().getAttribute("aria-valuetext")).toBe("40%");
	});

	it("keeps a value outside the range at its nearest end", () => {
		render(<Progress value={140} aria-label="Over" />);
		expect(bar().getAttribute("aria-valuenow")).toBe("100");
		cleanup();
		render(<Progress value={-5} aria-label="Under" />);
		expect(bar().getAttribute("aria-valuenow")).toBe("0");
	});

	it("reads a value out of its own max", () => {
		render(<Progress value={3} max={4} aria-label="Steps" />);
		expect(bar().getAttribute("aria-valuemax")).toBe("4");
		expect(bar().getAttribute("aria-valuetext")).toBe("75%");
	});

	it("is indeterminate without a value", () => {
		render(<Progress aria-label="Loading" />);
		expect(bar().getAttribute("aria-valuenow")).toBeNull();
		expect(bar().getAttribute("data-state")).toBe("indeterminate");
	});

	it("lets a caller say its value in words", () => {
		render(
			<Progress
				value={25}
				aria-label="Cost Share"
				aria-valuetext="25% Of All Cost"
			/>,
		);
		expect(bar().getAttribute("aria-valuetext")).toBe("25% Of All Cost");
	});
});
