import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import background from "@/assets/img/render-error-background.png";
import backgroundDark from "@/assets/img/render-error-background-darkmode.jpg";
import { RootContext } from "@/contexts/root-context";
import { RootStore } from "@/stores/root/root.store";
import { ErrorPage } from "./error-page";

const appearance = vi.hoisted(() => ({
	resolvedTheme: "light" as "light" | "dark",
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useTheme: () => ({
		theme: appearance.resolvedTheme,
		resolvedTheme: appearance.resolvedTheme,
		setTheme: vi.fn(),
	}),
}));
afterEach(() => {
	cleanup();
	appearance.resolvedTheme = "light";
});

describe("Playground error recovery", () => {
	it.each(["light", "dark"] as const)(
		"renders without a root provider in %s mode",
		(theme) => {
			appearance.resolvedTheme = theme;
			const { container } = render(
				<MemoryRouter>
					<ErrorPage />
				</MemoryRouter>,
			);
			expect(
				screen.getByRole("heading", { name: "Something went wrong." }),
			).toBeVisible();
			expect(
				screen.getByRole("button", { name: "Refresh" }),
			).toBeEnabled();
			expect(container.querySelector("img")).toHaveAttribute(
				"src",
				theme === "dark" ? backgroundDark : background,
			);
		},
	);
	it("keeps the configured error image when a root provider is available", async () => {
		const root = new RootStore();
		await root.initialize({
			images: { ...root.theme.images, error: "/custom-error.png" },
		});
		const { container } = render(
			<MemoryRouter>
				<RootContext.Provider value={{ root }}>
					<ErrorPage />
				</RootContext.Provider>
			</MemoryRouter>,
		);
		expect(container.querySelector("img")).toHaveAttribute(
			"src",
			"/custom-error.png",
		);
	});
	it("recovers through the router when startup fails before the provider mounts", async () => {
		const router = createMemoryRouter(
			[
				{
					path: "/broken",
					loader: () => {
						throw new Error("Startup failed");
					},
					element: <div>Unreachable app</div>,
					errorElement: <ErrorPage />,
				},
				{ path: "/", element: <h1>Home</h1> },
			],
			{ initialEntries: ["/broken"] },
		);
		render(<RouterProvider router={router} />);
		expect(
			await screen.findByRole("heading", {
				name: "Something went wrong.",
			}),
		).toBeVisible();
		await userEvent
			.setup()
			.click(screen.getByRole("button", { name: "Back to Home" }));
		expect(
			await screen.findByRole("heading", { name: "Home" }),
		).toBeVisible();
		router.dispose();
	});
});
