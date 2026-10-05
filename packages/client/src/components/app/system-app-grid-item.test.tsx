import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@semoss/ui/next";
import biDark from "@/assets/system-apps/bi-dark.svg?url";
import biLight from "@/assets/system-apps/bi-light.svg?url";
import browserDark from "@/assets/system-apps/browser-automation-dark.svg?url";
import browserLight from "@/assets/system-apps/browser-automation-light.svg?url";
import playgroundDark from "@/assets/system-apps/playground-dark.svg?url";
import playgroundLight from "@/assets/system-apps/playground-light.svg?url";
import terminalDark from "@/assets/system-apps/terminal-dark.svg?url";
import terminalLight from "@/assets/system-apps/terminal-light.svg?url";
import {
	SystemAppGridItem,
	type SystemAppGridItemProps,
} from "./system-app-grid-item";

const storageKey = "system-app-image-test";
const apps = [
	{
		id: "bi-system-app",
		name: "BI",
		href: "../../legacy/dist/",
		light: biLight,
		dark: biDark,
	},
	{
		id: "browser-automation-system-app",
		name: "Browser Automation",
		href: "../../browser-automation/dist/",
		light: browserLight,
		dark: browserDark,
	},
	{
		id: "playground-system-app",
		name: "Playground",
		href: "../../playground/dist/",
		light: playgroundLight,
		dark: playgroundDark,
	},
	{
		id: "terminal-system-app",
		name: "Terminal",
		href: "../../terminal/dist/",
		light: terminalLight,
		dark: terminalDark,
	},
];

/** Change the real UI theme while the catalog item remains mounted. */
function ThemeControls() {
	const { setTheme } = useTheme();
	return (
		<>
			<button type="button" onClick={() => setTheme("light")}>
				Use light
			</button>
			<button type="button" onClick={() => setTheme("dark")}>
				Use dark
			</button>
			<button type="button" onClick={() => setTheme("system")}>
				Use system
			</button>
		</>
	);
}

/** Render the same component used in the System Apps catalog tab. */
function renderItem(
	app: Pick<SystemAppGridItemProps, "id" | "name" | "href">,
	gridStyle: SystemAppGridItemProps["gridStyle"] = "LIST",
	theme: "light" | "dark" | "system" = "light",
) {
	return render(
		<ThemeProvider defaultTheme={theme} storageKey={storageKey}>
			<ThemeControls />
			<SystemAppGridItem
				{...app}
				gridStyle={gridStyle}
				description={`Open ${app.name}`}
			/>
		</ThemeProvider>,
	);
}

describe("System App catalog images", () => {
	let requests: HTMLImageElement[];
	let media: MediaQueryList;

	beforeEach(() => {
		localStorage.removeItem(storageKey);
		requests = [];
		media = Object.assign(new EventTarget(), {
			matches: false,
			media: "(prefers-color-scheme: dark)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
		});
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => media),
		);
		// Control image loading without replacing the real Avatar component.
		vi.stubGlobal(
			"Image",
			new Proxy(window.Image, {
				construct() {
					const image = document.createElement("img");
					requests.push(image);
					return image;
				},
			}),
		);
	});

	afterEach(() => {
		cleanup();
		localStorage.removeItem(storageKey);
		vi.unstubAllGlobals();
	});

	describe.each(["LIST", "CARD"] as const)("%s layout", (layout) => {
		it.each(apps)(
			"uses the bundled images for $name in both themes",
			async (app) => {
				const { container } = renderItem(app, layout);
				const link = screen.getByRole("link", {
					name: new RegExp(app.name),
				});
				expect(link).toHaveAttribute("href", app.href);
				expect(link).toHaveAttribute("target", "_blank");
				expect(link).toHaveAttribute("rel", "noopener noreferrer");
				await waitFor(() => expect(requests).toHaveLength(1));
				expect(requests[0].getAttribute("src")).toBe(app.light);
				expect(requests[0].src).not.toContain("/api/");
				fireEvent.load(requests[0]);
				await waitFor(() =>
					expect(container.querySelector("img")).toHaveAttribute(
						"src",
						app.light,
					),
				);
				expect(container.querySelector("img")).toHaveAttribute(
					"alt",
					"",
				);
				expect(screen.queryByRole("img")).not.toBeInTheDocument();
				link.focus();
				expect(link).toHaveFocus();
				fireEvent.click(
					screen.getByRole("button", { name: "Use dark" }),
				);
				await waitFor(() =>
					expect(requests.at(-1)).toHaveAttribute("src", app.dark),
				);
				expect(app.dark).not.toBe(app.light);
				fireEvent.load(requests[requests.length - 1]);
				await waitFor(() =>
					expect(container.querySelector("img")).toHaveAttribute(
						"src",
						app.dark,
					),
				);
				expect(
					screen.getByRole("link", { name: new RegExp(app.name) }),
				).toBe(link);
			},
		);
	});

	it("uses the operating system theme and follows changes", async () => {
		Object.assign(media, { matches: true });
		const { container } = renderItem(apps[0], "LIST", "system");
		await waitFor(() => expect(requests).toHaveLength(1));
		expect(requests[0].getAttribute("src")).toBe(biDark);
		fireEvent.load(requests[0]);
		await waitFor(() =>
			expect(container.querySelector("img")).toHaveAttribute(
				"src",
				biDark,
			),
		);
		act(() => {
			Object.assign(media, { matches: false });
			media.dispatchEvent(new Event("change"));
		});
		await waitFor(() =>
			expect(requests.at(-1)).toHaveAttribute("src", biLight),
		);
		fireEvent.load(requests[requests.length - 1]);
		await waitFor(() =>
			expect(container.querySelector("img")).toHaveAttribute(
				"src",
				biLight,
			),
		);
	});

	it("keeps initials on failure and retries with the other theme", async () => {
		const { container } = renderItem(apps[0]);
		expect(screen.getByText("B")).toBeInTheDocument();
		await waitFor(() => expect(requests).toHaveLength(1));
		fireEvent.error(requests[0]);
		expect(screen.getByText("B")).toBeInTheDocument();
		expect(container.querySelector("img")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Use dark" }));
		await waitFor(() =>
			expect(requests.at(-1)).toHaveAttribute("src", biDark),
		);
		fireEvent.load(requests[requests.length - 1]);
		await waitFor(() =>
			expect(container.querySelector("img")).toHaveAttribute(
				"src",
				biDark,
			),
		);
		expect(screen.queryByText("B")).not.toBeInTheDocument();
	});

	it("keeps a usable link and initials for an unmapped future launcher", () => {
		const { container } = renderItem({
			id: "future-system-app",
			name: "Future",
			href: "../../future/dist/",
		});
		expect(screen.getByText("F")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Future/ })).toHaveAttribute(
			"href",
			"../../future/dist/",
		);
		expect(container.querySelector("img")).not.toBeInTheDocument();
	});
});
