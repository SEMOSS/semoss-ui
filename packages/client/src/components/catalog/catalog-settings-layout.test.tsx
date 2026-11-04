import { cleanup, render, screen } from "@testing-library/react";
import { ImageIcon, TagsIcon } from "lucide-react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import {
	CatalogSettingsLayout,
	type CatalogSettingsSection,
} from "./catalog-settings-layout";

const SECTIONS: CatalogSettingsSection[] = [
	{
		name: "Image",
		path: "image",
		icon: ImageIcon,
		description: "Catalog image",
	},
	{
		name: "Tags",
		path: "tags",
		icon: TagsIcon,
		description: "Tags, classification, and domain",
	},
];

/** Render the layout at a path, with a route for every section and one more. */
function renderAt(path: string, sections = SECTIONS) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>
				<Route
					path="/engine/settings"
					element={
						<CatalogSettingsLayout
							sections={sections}
							ariaLabel="Settings sections"
							testIdPrefix="test-settings"
						/>
					}
				>
					<Route path="image" element={<div>Image section</div>} />
					<Route path="tags" element={<div>Tags section</div>} />
					<Route path="portal" element={<div>Portal section</div>} />
					<Route path="*" element={null} />
				</Route>
			</Routes>
		</MemoryRouter>,
	);
}

afterEach(cleanup);

describe("CatalogSettingsLayout", () => {
	it("lists every section in the nav and shows the one opened", () => {
		renderAt("/engine/settings/tags");

		const nav = screen.getByRole("navigation", {
			name: "Settings sections",
		});
		expect(nav).toHaveTextContent("Image");
		expect(nav).toHaveTextContent("Tags");
		expect(screen.getByText("Tags section")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Tags/ })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	it("opens the first section from the tab itself", () => {
		renderAt("/engine/settings");

		expect(screen.getByText("Image section")).toBeInTheDocument();
	});

	it("sends a section the viewer does not have to the first section", () => {
		renderAt("/engine/settings/portal");

		expect(screen.getByText("Image section")).toBeInTheDocument();
		expect(screen.queryByText("Portal section")).not.toBeInTheDocument();
	});

	it("sends an unknown path to the first section", () => {
		renderAt("/engine/settings/unknown", [SECTIONS[1]]);

		expect(screen.getByText("Tags section")).toBeInTheDocument();
	});

	it("sends a path below a section to the section", () => {
		renderAt("/engine/settings/tags/unknown");

		expect(screen.getByText("Tags section")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Tags/ })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});
});
