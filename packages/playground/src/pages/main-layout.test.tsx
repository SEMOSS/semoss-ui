import { render, screen } from "@testing-library/react";
import type { CSSProperties } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mergeChatTheme as mergePlaygroundTheme } from "@semoss/chat";
import { withPlaygroundDefaults } from "@/features/theme/playground-theme";
import { MainLayout } from "./main-layout";

// Keep the real layout and UI primitives; isolate network-backed children.
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
const theme = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/features/theme/use-playground-theme", () => ({
	usePlaygroundTheme: () => theme.current,
}));
vi.mock("@semoss/chat", async (original) => ({
	...(await original<typeof import("@semoss/chat")>()),
	useCreateChatStore: () => {
		const store = {
			embeddedPageMap: {},
			getSnapshot: () => store,
			subscribe: () => () => {},
		};
		return store;
	},
}));
vi.mock("@/features/navigation/global-nav", () => ({ GlobalNav: () => null }));
vi.mock("@/features/app-shell/global-footer", () => ({
	GlobalFooter: () => null,
}));
vi.mock("@/features/app-shell/global-dialog", () => ({
	GlobalDialog: () => null,
}));
vi.mock("@/features/tour/landing-tour", () => ({
	LandingTour: () => null,
}));

beforeEach(() => {
	localStorage.clear();
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});
afterEach(() => vi.unstubAllGlobals());

test.each([
	{ name: "default", style: {} },
	{ name: "custom", style: { padding: 8 } },
] satisfies { name: string; style: CSSProperties }[])(
	"renders $name theme overrides without freezing the theme",
	({ style }) => {
		const defaults = withPlaygroundDefaults(null);
		const overrides: CSSProperties = { ...style };
		theme.current = mergePlaygroundTheme(defaults, {
			overrides: { "main-layout": overrides },
		});
		render(
			<MemoryRouter>
				<MainLayout />
			</MemoryRouter>,
		);
		const layout = screen.getByTestId("main-layout");
		expect(layout).toBeVisible();
		expect(
			screen.queryByRole("navigation", { name: /breadcrumb/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /toggle sidebar/i }),
		).not.toBeInTheDocument();
		// the navigation starts open, so the page has no button to open it
		expect(
			screen.queryByRole("button", { name: "actions.openNavigation" }),
		).not.toBeInTheDocument();
		// the page keeps the button's room either way, so it never shifts
		expect(layout).toHaveClass("md:pt-10");
		expect(layout.style.padding).toBe(style.padding ? "8px" : "");
		// React freezes style props in development; the theme's own copy stays
		// mutable for whoever else reads it
		expect(Object.isFrozen(overrides)).toBe(false);
	},
);
