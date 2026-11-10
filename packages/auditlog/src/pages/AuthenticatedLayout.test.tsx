import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatedLayout } from "./AuthenticatedLayout";

type Status = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "ERROR";

const mocks = vi.hoisted(() => ({
	status: "INITIALIZING" as Status,
	refresh: vi.fn<() => Promise<unknown>>(),
	insight: {
		isInitialized: false,
		isAuthorized: false,
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
	InsightProvider: ({ children }: { children: ReactNode }) => (
		<section data-testid="insight-provider">{children}</section>
	),
	useInsight: () => mocks.insight,
}));

// the real gate and retry, from their defining files: the shared barrel loads
// the monaco editor, which the audit log does not install for its tests
vi.mock("@semoss/shared", async () => ({
	...(await import(
		"../../../../libs/shared/src/components/insight-ready-gate"
	)),
	...(await import("../../../../libs/shared/src/hooks/use-session-retry")),
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

describe("AuthenticatedLayout", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		mocks.refresh.mockReset();
		mocks.refresh.mockResolvedValue(undefined);
		mocks.insight = {
			isInitialized: false,
			isAuthorized: false,
			error: null,
		};
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);
	});

	afterEach(async () => {
		await act(async () => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	});

	/** Render the gate over the audit log page and return the router. */
	async function mount() {
		const router = createMemoryRouter([
			{
				path: "/",
				element: <AuthenticatedLayout />,
				children: [{ index: true, element: <p>Audit logs</p> }],
			},
			{ path: "/login", element: <p>Login</p> },
		]);
		await act(async () => {
			root.render(<RouterProvider router={router} />);
		});
		return router;
	}

	const hasInsight = () =>
		container.querySelector('[data-testid="insight-provider"]') !== null;

	it("waits while the session is read, without making the insight", async () => {
		mocks.status = "INITIALIZING";
		await mount();

		expect(container.querySelector('[role="status"]')).not.toBeNull();
		expect(hasInsight()).toBe(false);
	});

	it("sends a signed out user to the login page", async () => {
		mocks.status = "UNAUTHENTICATED";
		const router = await mount();

		expect(router.state.location.pathname).toBe("/login");
		expect(container.textContent).toBe("Login");
		expect(hasInsight()).toBe(false);
	});

	it("offers Retry when the session could not be read", async () => {
		mocks.status = "ERROR";
		await mount();

		expect(
			container.querySelector('[role="alert"]')?.textContent,
		).toContain("layout.loadFailed");
		const retry = container.querySelector("button");
		expect(retry?.textContent).toBe("common:buttons.retry");
		await act(async () => retry?.click());
		expect(mocks.refresh).toHaveBeenCalledOnce();
		expect(hasInsight()).toBe(false);
	});

	it("makes the insight once signed in and renders the page when it is ready", async () => {
		mocks.status = "AUTHENTICATED";
		await mount();

		expect(hasInsight()).toBe(true);
		expect(container.textContent).not.toContain("Audit logs");

		mocks.insight = {
			isInitialized: true,
			isAuthorized: true,
			error: null,
		};
		await act(async () => root.unmount());
		root = createRoot(container);
		await mount();
		expect(container.textContent).toBe("Audit logs");
	});

	it("shows the error when the insight could not be made", async () => {
		mocks.status = "AUTHENTICATED";
		mocks.insight = {
			isInitialized: false,
			isAuthorized: false,
			error: new Error("Offline"),
		};
		await mount();

		expect(container.querySelector('[role="alert"]')?.textContent).toBe(
			"layout.loadFailed",
		);
	});
});
