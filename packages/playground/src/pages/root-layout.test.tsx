import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRoot } from "@/hooks/use-root";
import { InitializedLayout } from "./initialized-layout";
import { RootLayout } from "./root-layout";

const sdk = vi.hoisted(() => ({
	isInitialized: true,
	error: null as Error | null,
	system: {
		config: { theme: undefined as { THEME_MAP?: string } | undefined },
	},
}));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => sdk }));
afterEach(() => {
	cleanup();
	sdk.error = null;
	sdk.system.config.theme = undefined;
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
		sdk.system.config.theme = { THEME_MAP: "not JSON" };
		render(
			<RootLayout>
				<RootConsumer />
			</RootLayout>,
		);
		expect(screen.getByRole("heading")).toBeVisible();
	});
	it("continues to apply the configured Playground theme", () => {
		sdk.system.config.theme = {
			THEME_MAP: JSON.stringify({
				playground: { name: "Team Playground" },
			}),
		};
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
		sdk.error = new Error("Backend unavailable");
		render(
			<MemoryRouter>
				<InitializedLayout />
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("heading", { name: "Something went wrong." }),
		).toBeVisible();
	});
});
