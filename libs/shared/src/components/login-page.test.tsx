import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./login-page";

const mocks = vi.hoisted(() => ({
	status: "INITIALIZING" as
		| "INITIALIZING"
		| "UNAUTHENTICATED"
		| "AUTHENTICATED"
		| "ERROR",
}));

// the gate reads only the session's status
vi.mock("@semoss/sdk/react", () => ({
	useSession: <T,>(selector: (state: { status: typeof mocks.status }) => T) =>
		selector({ status: mocks.status }),
}));

vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	useTheme: () => ({ theme: "light" }),
}));

// the form has its own tests
vi.mock("./form/login-form", () => ({
	LoginForm: () => <p>Login form</p>,
}));

/** Render the gate around the app under the current session status. */
const renderGate = () =>
	render(
		<LoginPage branding={<span>Brand</span>}>
			<p>The app</p>
		</LoginPage>,
	);

describe("LoginPage", () => {
	afterEach(cleanup);

	it("waits while the session is read", () => {
		mocks.status = "INITIALIZING";
		renderGate();

		expect(screen.getByRole("status")).toBeTruthy();
		expect(screen.queryByText("The app")).toBeNull();
		expect(screen.queryByText("Login form")).toBeNull();
	});

	it("renders the app once the session is signed in", () => {
		mocks.status = "AUTHENTICATED";
		renderGate();

		expect(screen.getByText("The app")).toBeTruthy();
		expect(screen.queryByText("Login form")).toBeNull();
	});

	it.each(["UNAUTHENTICATED", "ERROR"] as const)(
		"shows the form when the session is %s",
		(status) => {
			mocks.status = status;
			renderGate();

			expect(screen.getByText("Login form")).toBeTruthy();
			expect(screen.getByText("Brand")).toBeTruthy();
			expect(screen.queryByText("The app")).toBeNull();
		},
	);
});
