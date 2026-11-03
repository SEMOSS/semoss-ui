import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SETTINGS_ROUTES } from "./settings.constants";
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
		expect(screen.queryByRole("link", { name: /Agent Runs/ })).toBeNull();
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
			screen.getByRole("link", { name: /Agent Runs/ }),
		).toHaveAttribute("href", "/settings/agent-runs");
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

	it("lists the tiles under their headings, in order", () => {
		settings.adminMode = true;
		renderSettings();
		expect(
			screen
				.getAllByRole("heading", { level: 2 })
				.map((heading) => heading.textContent),
		).toEqual([
			"Your Account",
			"Resources & Access",
			"Monitoring",
			"Platform",
		]);
		const access = screen.getByRole("region", {
			name: "Resources & Access",
		});
		expect(
			within(access)
				.getAllByRole("link")
				.map((link) => link.getAttribute("href")),
		).toEqual([
			"/settings/resources",
			"/settings/members",
			"/settings/team-permissions",
			"/settings/service-accounts",
		]);
	});

	it("shows only the account heading outside admin mode", () => {
		renderSettings();
		expect(
			screen
				.getAllByRole("heading", { level: 2 })
				.map((heading) => heading.textContent),
		).toEqual(["Your Account"]);
	});

	it("gives every tile a heading, so none is left off the page", () => {
		const tiles = SETTINGS_ROUTES.filter(
			(route) =>
				!!route.path &&
				(route.history?.length ?? 0) < 2 &&
				!route.hidden,
		);
		expect(
			tiles.filter((route) => !route.group).map((route) => route.title),
		).toEqual([]);
	});
});
