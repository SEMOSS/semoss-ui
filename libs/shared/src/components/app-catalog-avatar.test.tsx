import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "@semoss/sdk";
import { ThemeProvider, useTheme } from "@semoss/ui/next";
import { refreshCatalogImage } from "../hooks/use-catalog-image";
import { AppCatalogAvatar } from "./app-catalog-avatar";

const storageKey = "app-catalog-avatar-test";

/** Allow theme changes without replacing the mounted avatar. */
function ThemeToggle() {
	const { setTheme } = useTheme();
	return (
		<button type="button" onClick={() => setTheme("dark")}>
			Dark
		</button>
	);
}

describe("AppCatalogAvatar", () => {
	const originalModule = Env.MODULE;
	let requestedImages: HTMLImageElement[];

	beforeEach(() => {
		Env.update({ MODULE: "/Monolith" });
		localStorage.removeItem(storageKey);
		requestedImages = [];
		vi.stubGlobal(
			"Image",
			new Proxy(window.Image, {
				construct() {
					const image = document.createElement("img");
					requestedImages.push(image);
					return image;
				},
			}),
		);
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() =>
				Object.assign(new EventTarget(), {
					matches: false,
					media: "(prefers-color-scheme: dark)",
				}),
			),
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		Env.update({ MODULE: originalModule });
		localStorage.removeItem(storageKey);
	});

	it("defaults to a project image and displays initials until it loads", async () => {
		const { container } = render(
			<AppCatalogAvatar
				name="My Test App"
				projectId="project #1"
				className="size-8 rounded-md"
			/>,
		);
		expect(screen.getByText("MT")).not.toBeNull();
		await waitFor(() => expect(requestedImages).toHaveLength(1));
		expect(requestedImages[0].getAttribute("src")).toBe(
			"/Monolith/api/project-project%20%231/projectImage/download?theme=light",
		);
		fireEvent.load(requestedImages[0]);
		await waitFor(() =>
			expect(container.querySelector("img")).not.toBeNull(),
		);
		expect(screen.queryByText("MT")).toBeNull();
		expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
		expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe(
			"true",
		);
	});

	it("initials mode keeps the original two-letter colors without requesting an image", () => {
		render(
			<AppCatalogAvatar
				mode="initials"
				name="My Test App"
				projectId="existing-project"
				imageUrl="/custom.png"
			/>,
		);
		const initials = screen.getByText("MT");
		expect(initials.style.backgroundColor).not.toBe("");
		expect(initials.style.color).not.toBe("");
		expect(requestedImages).toHaveLength(0);
	});

	it("falls back without a request when neither a saved ID nor image URL is available", () => {
		render(<AppCatalogAvatar name="Unsaved App" />);
		expect(screen.getByText("UA")).not.toBeNull();
		expect(requestedImages).toHaveLength(0);
	});

	it("keeps initials when image loading fails", async () => {
		const { container } = render(
			<AppCatalogAvatar name="Missing Photo" projectId="missing-photo" />,
		);
		const initialColor = screen.getByText("MP").style.backgroundColor;
		await waitFor(() => expect(requestedImages).toHaveLength(1));
		fireEvent.error(requestedImages[0]);
		expect(screen.getByText("MP").style.backgroundColor).toBe(initialColor);
		expect(container.querySelector("img")).toBeNull();
	});

	it("uses an explicit image URL before the project endpoint", async () => {
		render(
			<AppCatalogAvatar
				name="System App"
				projectId="unused"
				imageUrl="/system-app.svg"
			/>,
		);
		await waitFor(() => expect(requestedImages).toHaveLength(1));
		expect(requestedImages[0].getAttribute("src")).toBe("/system-app.svg");
	});

	it("returns to initials when the mode changes after an image loaded", async () => {
		const { container, rerender } = render(
			<AppCatalogAvatar name="Switch Mode" projectId="mode-project" />,
		);
		await waitFor(() => expect(requestedImages).toHaveLength(1));
		fireEvent.load(requestedImages[0]);
		await waitFor(() =>
			expect(container.querySelector("img")).not.toBeNull(),
		);
		rerender(
			<AppCatalogAvatar
				name="Switch Mode"
				projectId="mode-project"
				mode="initials"
			/>,
		);
		expect(screen.getByText("SM")).not.toBeNull();
		expect(container.querySelector("img")).toBeNull();
		expect(requestedImages).toHaveLength(1);
	});

	it("loads a different project after the previous project's image fails", async () => {
		const { container, rerender } = render(
			<AppCatalogAvatar name="First App" projectId="first" />,
		);
		await waitFor(() => expect(requestedImages).toHaveLength(1));
		fireEvent.error(requestedImages[0]);
		rerender(<AppCatalogAvatar name="Second App" projectId="second" />);
		await waitFor(() => expect(requestedImages).toHaveLength(2));
		expect(requestedImages[1].getAttribute("src")).toContain(
			"project-second/",
		);
		fireEvent.load(requestedImages[1]);
		await waitFor(() =>
			expect(
				container.querySelector("img")?.getAttribute("src"),
			).toContain("project-second/"),
		);
		expect(screen.queryByText("SA")).toBeNull();
	});

	it("changes the image when the resolved UI theme changes", async () => {
		render(
			<ThemeProvider defaultTheme="light" storageKey={storageKey}>
				<AppCatalogAvatar name="Theme App" projectId="theme-project" />
				<ThemeToggle />
			</ThemeProvider>,
		);
		await waitFor(() => expect(requestedImages).toHaveLength(1));
		expect(requestedImages[0].getAttribute("src")).toContain("theme=light");
		fireEvent.click(screen.getByRole("button", { name: "Dark" }));
		await waitFor(() => expect(requestedImages).toHaveLength(2));
		expect(requestedImages[1].getAttribute("src")).toContain("theme=dark");
	});

	it("refreshes matching mounted avatars after an upload without changing other resources", async () => {
		render(
			<>
				<AppCatalogAvatar name="Same App" projectId="refresh-project" />
				<AppCatalogAvatar name="Same App" projectId="refresh-project" />
				<AppCatalogAvatar
					name="Other App"
					projectId="unrelated-project"
				/>
			</>,
		);
		await waitFor(() => expect(requestedImages).toHaveLength(3));
		act(() => refreshCatalogImage("PROJECT", "refresh-project"));
		await waitFor(() => expect(requestedImages).toHaveLength(5));
		const updated = requestedImages
			.slice(3)
			.map((image) => image.getAttribute("src"));
		expect(updated[0]).toBe(updated[1]);
		expect(updated[0]).toContain("project-refresh-project/");
		expect(updated[0]).toContain("&v=");
		act(() => refreshCatalogImage("ENGINE", "refresh-project"));
		expect(requestedImages).toHaveLength(5);
	});
});
