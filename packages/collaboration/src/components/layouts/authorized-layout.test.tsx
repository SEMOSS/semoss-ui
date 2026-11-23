import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthorizedLayout } from "./authorized-layout";

type Status = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "ERROR";

const mocks = vi.hoisted(() => ({
	status: "INITIALIZING" as Status,
	refresh: vi.fn<() => Promise<unknown>>(),
	insight: {
		isInitialized: false,
		isReady: false,
		error: null as Error | null,
	},
}));

// the gate reads the session; the provider stands in for the app's insight
vi.mock("@semoss/sdk/react", () => ({
	useSession: <T,>(
		selector: (state: {
			status: Status;
			refresh: typeof mocks.refresh;
		}) => T,
	): T => selector({ status: mocks.status, refresh: mocks.refresh }),
	useSessionRetry: () => ({ isRetrying: false, retry: mocks.refresh }),
	InsightProvider: ({ children }: { children: ReactNode }) => (
		<section aria-label="App insight">{children}</section>
	),
	useInsight: () => mocks.insight,
}));

/** Shows where the gate sent a signed out user. */
function LoginProbe() {
	const { state } = useLocation();
	return <p>Login for {String((state as { target?: string })?.target)}</p>;
}

/** Render the gate over one signed in page, starting at `/work`. */
function renderGate() {
	const router = createMemoryRouter(
		[
			{
				Component: AuthorizedLayout,
				children: [{ path: "/work", element: <p>Work page</p> }],
			},
			{ path: "/login", element: <LoginProbe /> },
		],
		{ initialEntries: ["/work"] },
	);
	render(<RouterProvider router={router} />);
	return router;
}

beforeEach(() => {
	mocks.refresh.mockReset();
	mocks.refresh.mockResolvedValue(undefined);
	mocks.insight = { isInitialized: false, isReady: false, error: null };
});
afterEach(cleanup);

it("waits while the session is read, without making the insight", () => {
	mocks.status = "INITIALIZING";
	renderGate();

	expect(
		screen.getByRole("status", { name: "Loading Collaboration" }),
	).toBeInTheDocument();
	expect(screen.queryByLabelText("App insight")).not.toBeInTheDocument();
});

it("sends a signed out user to the login page with their route", async () => {
	mocks.status = "UNAUTHENTICATED";
	const router = renderGate();

	expect(await screen.findByText("Login for /work")).toBeInTheDocument();
	expect(router.state.location.pathname).toBe("/login");
	expect(screen.queryByLabelText("App insight")).not.toBeInTheDocument();
});

it("offers Retry when the session could not be read", async () => {
	mocks.status = "ERROR";
	renderGate();

	expect(screen.getByRole("alert")).toHaveTextContent(
		"Collaboration could not start",
	);
	await userEvent.click(screen.getByRole("button", { name: "Retry" }));
	await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
	expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
});

it("makes the insight once signed in and renders the page when it is ready", () => {
	mocks.status = "AUTHENTICATED";
	renderGate();

	expect(screen.getByLabelText("App insight")).toBeInTheDocument();
	expect(screen.queryByText("Work page")).not.toBeInTheDocument();
	cleanup();

	mocks.insight = { isInitialized: true, isReady: true, error: null };
	renderGate();
	expect(screen.getByText("Work page")).toBeInTheDocument();
});

it("shows the error when the insight could not be made", () => {
	mocks.status = "AUTHENTICATED";
	mocks.insight = {
		isInitialized: false,
		isReady: false,
		error: new Error("Offline"),
	};
	renderGate();

	expect(screen.getByRole("alert")).toHaveTextContent(
		"Collaboration could not start",
	);
	expect(screen.queryByText("Work page")).not.toBeInTheDocument();
});
