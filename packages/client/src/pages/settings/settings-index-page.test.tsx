import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsIndexPage } from "./settings-index-page";

const settings = vi.hoisted(() => ({ adminMode: false }));

vi.mock("@/hooks/useSettings", () => ({
	useSettings: () => settings,
}));

afterEach(() => {
	cleanup();
	settings.adminMode = false;
});

/** Render settings navigation with the same router boundary as the application. */
function renderSettings() {
	return render(
		<MemoryRouter>
			<SettingsIndexPage />
		</MemoryRouter>,
	);
}

describe("SettingsIndexPage merged navigation", () => {
	it("keeps My Teams visible without exposing admin audit navigation", () => {
		renderSettings();
		expect(screen.getByRole("link", { name: /My Teams/ })).toHaveAttribute(
			"href",
			"/settings/managed-teams",
		);
		expect(screen.queryByRole("link", { name: /Audit Trail/ })).toBeNull();
		expect(
			screen.queryByRole("link", { name: /Team Permissions/ }),
		).toBeNull();
	});

	it("preserves both audit and team administration links in admin mode", () => {
		settings.adminMode = true;
		renderSettings();
		expect(
			screen.getByRole("link", { name: /Audit Trail/ }),
		).toHaveAttribute("href", "/settings/audit-trail");
		expect(
			screen.getByRole("link", { name: /Team Permissions/ }),
		).toHaveAttribute("href", "/settings/team-permissions");
		expect(
			screen.getByRole("link", { name: /My Teams/ }),
		).toBeInTheDocument();
	});

	it("filters and clears the search without losing the merged links", () => {
		settings.adminMode = true;
		renderSettings();
		fireEvent.change(
			screen.getByRole("textbox", { name: "Search settings" }),
			{
				target: { value: "audit" },
			},
		);
		expect(
			screen.getByRole("link", { name: /Audit Trail/ }),
		).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: /My Teams/ })).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
		expect(
			screen.getByRole("link", { name: /My Teams/ }),
		).toBeInTheDocument();
	});
});
