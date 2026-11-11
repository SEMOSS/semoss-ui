import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, expect, it, vi } from "vitest";
import { LoginPage } from "./login.page";

type Status = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "ERROR";

const mocks = vi.hoisted(() => ({ status: "INITIALIZING" as Status }));

// the page reads only the session's status
vi.mock("@semoss/sdk/react", () => ({
	useSession: <T,>(selector: (state: { status: Status }) => T): T =>
		selector({ status: mocks.status }),
}));

// the form has its own tests in @semoss/shared
vi.mock("@semoss/shared", () => ({ LoginForm: () => <p>Login form</p> }));

/** Render the login page as reached from `/work`. */
function renderLogin() {
	const router = createMemoryRouter(
		[
			{ path: "/login", element: <LoginPage /> },
			{ path: "/work", element: <p>Work page</p> },
		],
		{
			initialEntries: [
				{ pathname: "/login", state: { target: "/work" } },
			],
		},
	);
	render(<RouterProvider router={router} />);
	return router;
}

afterEach(cleanup);

it("waits for the session's config before showing the form", () => {
	mocks.status = "INITIALIZING";
	renderLogin();

	expect(screen.getByRole("status")).toBeInTheDocument();
	expect(screen.queryByText("Login form")).not.toBeInTheDocument();
});

it.each(["UNAUTHENTICATED", "ERROR"] as const)(
	"shows the form when the session is %s",
	(status) => {
		mocks.status = status;
		renderLogin();

		expect(screen.getByText("Login form")).toBeInTheDocument();
	},
);

it("returns a signed in user to where they were going", async () => {
	mocks.status = "AUTHENTICATED";
	const router = renderLogin();

	expect(await screen.findByText("Work page")).toBeInTheDocument();
	expect(router.state.location.pathname).toBe("/work");
});
