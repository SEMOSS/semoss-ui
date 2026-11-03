import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ImageIcon, TagsIcon } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import {
	CatalogSettingsPanel,
	type CatalogSettingsPanelSection,
} from "./catalog-settings-panel";

const SECTIONS: CatalogSettingsPanelSection[] = [
	{
		name: "Image",
		path: "image",
		icon: ImageIcon,
		description: "Catalog image",
		element: <div>Image section</div>,
	},
	{
		name: "Tags",
		path: "tags",
		icon: TagsIcon,
		description: "Tags, classification, and domain",
		element: <div>Tags section</div>,
	},
];

afterEach(cleanup);

describe("CatalogSettingsPanel", () => {
	it("opens the first section, then the one chosen in the nav", () => {
		render(
			<CatalogSettingsPanel
				sections={SECTIONS}
				ariaLabel="Settings sections"
				testIdPrefix="test-settings"
			/>,
		);

		expect(screen.getByText("Image section")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Image/ })).toHaveAttribute(
			"aria-current",
			"true",
		);

		fireEvent.click(screen.getByRole("button", { name: /Tags/ }));

		expect(screen.getByText("Tags section")).toBeInTheDocument();
		expect(screen.queryByText("Image section")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Image/ }),
		).not.toHaveAttribute("aria-current");
	});

	it("falls back to the first section when the chosen one goes away", () => {
		const { rerender } = render(
			<CatalogSettingsPanel
				sections={SECTIONS}
				ariaLabel="Settings sections"
				testIdPrefix="test-settings"
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /Tags/ }));

		rerender(
			<CatalogSettingsPanel
				sections={[SECTIONS[0]]}
				ariaLabel="Settings sections"
				testIdPrefix="test-settings"
			/>,
		);

		expect(screen.getByText("Image section")).toBeInTheDocument();
	});
});
