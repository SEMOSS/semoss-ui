import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRoot } from "@/hooks/use-root";
import { InitializedLayout } from "./initialized-layout";
import { RootLayout } from "./root-layout";

// the session's status and the config's theme, already parsed from THEME_MAP
const sdk = vi.hoisted(() => ({
	status: "AUTHENTICATED",
	theme: null as Record<string, unknown> | null,
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useSession: <T,>(selector: (state: { status: string }) => T) =>
		selector({ status: sdk.status }),
	useConfig: <T,>(
		selector: (state: { theme: Record<string, unknown> | null }) => T,
	) => selector({ theme: sdk.theme }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
afterEach(() => {
	cleanup();
	sdk.status = "AUTHENTICATED";
	sdk.theme = null;
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
	it("uses defaults when the theme has no Playground part", () => {
		sdk.theme = { playground: "not a theme", client: { name: "Client" } };
		render(
			<RootLayout>
				<RootConsumer />
			</RootLayout>,
		);
		expect(screen.getByRole("heading")).toBeVisible();
	});
	it("continues to apply the configured Playground theme", () => {
		sdk.theme = { playground: { name: "Team Playground" } };
		render(
			<RootLayout>
				<RootConsumer />
			</RootLayout>,
		);
		expect(
			screen.getByRole("heading", { name: "Team Playground" }),
		).toBeVisible();
	});
	it("waits while the session is read", () => {
		sdk.status = "INITIALIZING";
		render(
			<MemoryRouter>
				<InitializedLayout />
			</MemoryRouter>,
		);
		expect(screen.getByRole("status")).toBeVisible();
		expect(screen.queryByRole("heading")).toBeNull();
	});
	it("shows an initialization error without requiring the root provider", () => {
		sdk.status = "ERROR";
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
