import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatedLayout } from "./AuthenticatedLayout";

type Status = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "ERROR";

const mocks = vi.hoisted(() => ({
	status: "INITIALIZING" as Status,
	refresh: vi.fn<() => Promise<unknown>>(),
}));

// the gate reads only the session
vi.mock("@semoss/sdk/react", () => ({
	useSession: <T,>(
		selector: (state: {
			status: Status;
			refresh: typeof mocks.refresh;
		}) => T,
	): T => selector({ status: mocks.status, refresh: mocks.refresh }),
	useSessionRetry: () => ({ isRetrying: false, retry: mocks.refresh }),
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

	it("waits while the session is read", async () => {
		mocks.status = "INITIALIZING";
		await mount();

		expect(container.querySelector('[role="status"]')).not.toBeNull();
	});

	it("sends a signed out user to the login page", async () => {
		mocks.status = "UNAUTHENTICATED";
		const router = await mount();

		expect(router.state.location.pathname).toBe("/login");
		expect(container.textContent).toBe("Login");
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
	});

	it("renders the pages once signed in, with no insight of its own", async () => {
		mocks.status = "AUTHENTICATED";
		await mount();

		expect(container.textContent).toBe("Audit logs");
	});
});
