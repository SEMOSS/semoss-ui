import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRoot } from "@/hooks/use-root";
import { InitializedLayout } from "./initialized-layout";
import { RootLayout } from "./root-layout";

const sdk = vi.hoisted(() => ({
	status: "AUTHENTICATED" as string,
	theme: null as Record<string, unknown> | null,
}));
vi.mock("@semoss/sdk/react", () => ({
	useConfig: <T,>(selector: (state: { theme: unknown }) => T) =>
		selector({ theme: sdk.theme }),
	useSession: <T,>(selector: (state: { status: string }) => T) =>
		selector({ status: sdk.status }),
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
	it("uses defaults when the server theme has no playground entry", () => {
		sdk.theme = { client: { name: "Client" } };
		render(
			<RootLayout>
				<RootConsumer />
			</RootLayout>,
		);
		expect(
			screen.queryByRole("heading", { name: "Client" }),
		).not.toBeInTheDocument();
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
	it("waits for the session before rendering any route", () => {
		sdk.status = "INITIALIZING";
		const router = createMemoryRouter([
			{
				element: <InitializedLayout />,
				children: [{ path: "/", element: <h1>Route</h1> }],
			},
		]);
		render(<RouterProvider router={router} />);
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
	});
	it.each(["UNAUTHENTICATED", "AUTHENTICATED", "ERROR"])(
		"renders the routes once the session is %s",
		(status) => {
			sdk.status = status;
			const router = createMemoryRouter([
				{
					element: <InitializedLayout />,
					children: [{ path: "/", element: <h1>Route</h1> }],
				},
			]);
			render(<RouterProvider router={router} />);
			expect(
				screen.getByRole("heading", { name: "Route" }),
			).toBeVisible();
		},
	);
});
