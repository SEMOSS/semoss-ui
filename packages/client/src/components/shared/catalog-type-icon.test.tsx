import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CatalogTypeIcon } from "./catalog-type-icon";

afterEach(cleanup);

describe("CatalogTypeIcon", () => {
	it("draws the sidebar's icon for an engine type, an app type's own icon, and several boxes for every type", () => {
		const { container, rerender } = render(
			<CatalogTypeIcon type="MODEL" />,
		);
		expect(container.querySelector("svg.lucide-cpu")).not.toBeNull();

		rerender(<CatalogTypeIcon type="CODE" />);
		expect(container.querySelector("svg.lucide-code-xml")).not.toBeNull();

		rerender(<CatalogTypeIcon type="ALL" />);
		expect(container.querySelector("svg.lucide-boxes")).not.toBeNull();
	});

	it("draws a box for a type with no icon of its own, hidden from assistive technology", () => {
		const { container } = render(<CatalogTypeIcon type="VENV" />);

		const icon = container.querySelector("svg");
		expect(icon?.classList.contains("lucide-box")).toBe(true);
		expect(icon?.getAttribute("aria-hidden")).toBe("true");
	});
});
