import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useInsight } from "@semoss/sdk/react";
import { SidebarProvider, ThemeProvider } from "@semoss/ui/next";
import { RootContext } from "@/contexts/root-context";
import { RootStore } from "@/stores/root/root.store";
import { ErrorPage } from "./error-page";
import { InitializedLayout } from "./initialized-layout";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/sdk/react", () => ({ useInsight: vi.fn() }));
vi.mock("./root-layout", () => ({
	RootLayout: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetAllMocks();
});

test("shows initialization failures before RootContext is mounted and allows returning home", async () => {
	vi.mocked(useInsight).mockReturnValue({
		isInitialized: false,
		error: new Error("Initialization failed"),
	} as ReturnType<typeof useInsight>);
	const router = createMemoryRouter(
		[
			{ path: "/", element: <h1>Home</h1> },
			{ path: "/initializing", element: <InitializedLayout /> },
		],
		{ initialEntries: ["/initializing"] },
	);
	render(
		<ThemeProvider defaultTheme="light">
			<RouterProvider router={router} />
		</ThemeProvider>,
	);
	expect(
		screen.getByRole("heading", { name: "studio.errorTitle" }),
	).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "studio.backHome" }));
	expect(await screen.findByRole("heading", { name: "Home" })).toBeVisible();
});

test("renders the root route error boundary outside the failed layout's provider", async () => {
	const root = new RootStore();
	const router = createMemoryRouter([
		{
			path: "/",
			element: (
				<RootContext.Provider value={{ root }}>
					<Outlet />
				</RootContext.Provider>
			),
			loader: () => {
				throw new Error("Route failed");
			},
			hydrateFallbackElement: <p>Loading</p>,
			errorElement: <ErrorPage />,
		},
	]);
	const { container } = render(
		<ThemeProvider defaultTheme="light">
			<RouterProvider router={router} />
		</ThemeProvider>,
	);
	expect(
		await screen.findByRole("heading", { name: "studio.errorTitle" }),
	).toBeVisible();
	expect(container.querySelector("img")).toBeNull();
});

test.each(["light", "dark"] as const)(
	"preserves custom %s branding and sidebar navigation for inner errors",
	async (theme) => {
		const root = new RootStore();
		await root.initialize({
			images: {
				...root.theme.images,
				error: "/error-light.png",
				errorDark: "/error-dark.png",
			},
		});
		const router = createMemoryRouter([
			{
				path: "/",
				element: (
					<RootContext.Provider value={{ root }}>
						<SidebarProvider>
							<ErrorPage isInnerComponent />
						</SidebarProvider>
					</RootContext.Provider>
				),
			},
		]);
		render(
			<ThemeProvider defaultTheme={theme}>
				<RouterProvider router={router} />
			</ThemeProvider>,
		);
		expect(screen.getByAltText("")).toHaveAttribute(
			"src",
			`/error-${theme}.png`,
		);
		expect(
			screen.getByRole("button", { name: "Toggle Sidebar" }),
		).toBeVisible();
	},
);
