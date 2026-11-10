import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SidebarProvider, ThemeProvider } from "@semoss/ui/next";
import { withPlaygroundDefaults } from "@/stores/root/playground-theme";
import { AuthenticatedLayout } from "./authenticated-layout";
import { ErrorPage } from "./error-page";

const mocks = vi.hoisted(() => ({
	session: {
		status: "ERROR" as string,
		refresh: vi.fn(),
	},
	theme: null as unknown,
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/sdk/react", () => ({
	useSession: <T,>(selector: (state: typeof mocks.session) => T) =>
		selector(mocks.session),
}));
vi.mock("@/hooks/use-playground-theme", () => ({
	usePlaygroundTheme: () => mocks.theme,
}));

beforeEach(() => {
	mocks.theme = withPlaygroundDefaults(null);
	mocks.session.status = "ERROR";
	mocks.session.refresh.mockResolvedValue(undefined);
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

const renderGate = () => {
	const router = createMemoryRouter(
		[
			{ path: "/login", element: <h1>Login</h1> },
			{
				element: <AuthenticatedLayout />,
				children: [{ path: "/", element: <h1>Home</h1> }],
			},
		],
		{ initialEntries: ["/"] },
	);
	render(
		<ThemeProvider defaultTheme="light">
			<RouterProvider router={router} />
		</ThemeProvider>,
	);
};

test("a session that cannot be read shows the error with a Retry that reads it again", async () => {
	renderGate();
	expect(
		screen.getByRole("heading", { name: "studio.errorTitle" }),
	).toBeVisible();
	// home would land on the same error, so only Retry is offered
	expect(
		screen.queryByRole("button", { name: "studio.backHome" }),
	).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "studio.retry" }));
	expect(mocks.session.refresh).toHaveBeenCalledTimes(1);
	expect(
		await screen.findByRole("button", { name: "studio.retry" }),
	).toBeEnabled();
});

test("a signed out session goes to the login page", async () => {
	mocks.session.status = "UNAUTHENTICATED";
	renderGate();
	expect(await screen.findByRole("heading", { name: "Login" })).toBeVisible();
});

test("a signed in session renders its route", () => {
	mocks.session.status = "AUTHENTICATED";
	renderGate();
	expect(screen.getByRole("heading", { name: "Home" })).toBeVisible();
});

test("renders the root route error boundary with home and refresh", async () => {
	const router = createMemoryRouter([
		{ path: "/home", element: <h1>Home</h1> },
		{
			path: "/",
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
	expect(
		screen.getByRole("button", { name: "studio.refresh" }),
	).toBeEnabled();
	expect(
		screen.getByRole("button", { name: "studio.backHome" }),
	).toBeEnabled();
	expect(container.querySelector("img")).toBeNull();
});

test.each(["light", "dark"] as const)(
	"preserves custom %s branding and sidebar navigation for inner errors",
	async (theme) => {
		const defaults = withPlaygroundDefaults(null);
		mocks.theme = {
			...defaults,
			images: {
				...defaults.images,
				error: "/error-light.png",
				errorDark: "/error-dark.png",
			},
		};
		const router = createMemoryRouter([
			{
				path: "/",
				element: (
					<SidebarProvider>
						<ErrorPage isInnerComponent />
					</SidebarProvider>
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
