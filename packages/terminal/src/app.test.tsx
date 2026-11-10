import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./app";

type Status = "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "ERROR";

const mocks = vi.hoisted(() => ({ status: "INITIALIZING" as Status }));

// the provider stands in for the terminal's insight
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	InsightProvider: ({ children }: { children: ReactNode }) => (
		<section data-testid="insight-provider">{children}</section>
	),
}));

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	ThemeProvider: ({ children }: { children: ReactNode }) => children,
	Toaster: () => null,
}));

vi.mock("./components/embed-terminal/embed-terminal", () => ({
	EmbedTerminal: () => <p>Terminal</p>,
}));

// the shared gate's contract, tested in @semoss/shared: the app only once
// the session is signed in
vi.mock("@semoss/shared", () => ({
	LoginPage: ({ children }: { children: ReactNode }) =>
		mocks.status === "AUTHENTICATED" ? children : <p>Login form</p>,
}));

describe("App", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);
	});

	afterEach(async () => {
		await act(async () => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	});

	async function mount(status: Status): Promise<void> {
		mocks.status = status;
		await act(async () => {
			root.render(<App />);
		});
	}

	const hasInsight = () =>
		container.querySelector('[data-testid="insight-provider"]') !== null;

	it.each(["INITIALIZING", "UNAUTHENTICATED", "ERROR"] as const)(
		"makes no insight while the session is %s",
		async (status) => {
			await mount(status);

			expect(hasInsight()).toBe(false);
			expect(container.textContent).not.toContain("Terminal");
		},
	);

	it("shows the login form when signed out", async () => {
		await mount("UNAUTHENTICATED");

		expect(container.textContent).toContain("Login form");
	});

	it("makes the terminal's insight once signed in", async () => {
		await mount("AUTHENTICATED");

		expect(hasInsight()).toBe(true);
		expect(
			container.querySelector('[data-testid="insight-provider"]')
				?.textContent,
		).toBe("Terminal");
	});
});
