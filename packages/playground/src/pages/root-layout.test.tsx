import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRoot } from "@/hooks/use-root";
import { InitializedLayout } from "./initialized-layout";
import { RootLayout } from "./root-layout";

// the SDK's config store parses THEME_MAP; a broken one reads as no theme
const config = vi.hoisted(() => ({
	status: "READY" as "READY" | "ERROR",
	theme: null as Record<string, unknown> | null,
}));
vi.mock("@semoss/sdk/react", () => ({
	useConfig: <T,>(selector: (state: typeof config) => T) => selector(config),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
afterEach(() => {
	cleanup();
	config.status = "READY";
	config.theme = null;
});

function RootConsumer() {
	const { root } = useRoot();
	return <h1>{root.theme.name || "Default Playground"}</h1>;
}

describe("Playground initialization", () => {
	it("mounts its provider using defaults when no custom theme exists", () => {
		render(
			<RootLayout>
				<RootConsumer />
			</RootLayout>,
		);
		expect(screen.getByRole("heading")).toBeVisible();
	});
	it("uses defaults when custom theme JSON is invalid", () => {
		config.theme = null;
		render(
			<RootLayout>
				<RootConsumer />
			</RootLayout>,
		);
		expect(screen.getByRole("heading")).toBeVisible();
	});
	it("continues to apply the configured Playground theme", () => {
		config.theme = { playground: { name: "Team Playground" } };
		render(
			<RootLayout>
				<RootConsumer />
			</RootLayout>,
		);
		expect(
			screen.getByRole("heading", { name: "Team Playground" }),
		).toBeVisible();
	});
	it("shows an initialization error without requiring the root provider", () => {
		config.status = "ERROR";
		render(
			<MemoryRouter>
				<InitializedLayout />
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("heading", { name: "studio.errorTitle" }),
		).toBeVisible();
	});
});
