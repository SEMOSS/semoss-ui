import { act, render, screen } from "@testing-library/react";
import { isObservableObject, runInAction } from "mobx";
import type { CSSProperties } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { RootContext } from "@/contexts/root-context";
import { RootStore } from "@/stores/root/root.store";
import { MainLayout } from "./main-layout";

// Keep the real observable theme, layout, and UI primitives; isolate network-backed children.
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/sdk/react", () => {
	const actions = {};
	return { useInsight: () => ({ actions }) };
});
vi.mock("@/stores/chat/chat.store", () => ({
	ChatStore: class {
		initialize = vi.fn();
		embeddedPageMap = {};
	},
}));
vi.mock("@/components/room/panels", () => ({ ROOM_PANEL_COMPONENTS: {} }));
vi.mock("@/components/common/global-nav", () => ({ GlobalNav: () => null }));
vi.mock("@/components/common/global-footer", () => ({
	GlobalFooter: () => null,
}));
vi.mock("@/components/common/global-dialog", () => ({
	GlobalDialog: () => null,
}));
vi.mock("@/components/common/landing-tour", () => ({
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
	"renders $name observable theme overrides and reacts to edits without freezing the store",
	async ({ style }) => {
		const root = new RootStore();
		await root.initialize({ overrides: { "main-layout": style } });
		const overrides = root.theme.overrides["main-layout"];
		expect(isObservableObject(overrides)).toBe(true);
		render(
			<MemoryRouter>
				<RootContext.Provider value={{ root }}>
					<MainLayout />
				</RootContext.Provider>
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
		expect(
			screen.queryByRole("button", { name: "actions.openNavigation" }),
		).not.toBeInTheDocument();
		expect(layout.style.padding).toBe(style.padding ? "8px" : "");
		expect(Object.isFrozen(overrides)).toBe(false);

		act(() =>
			runInAction(() => {
				overrides.padding = 16;
			}),
		);
		expect(layout).toHaveStyle({ padding: "16px" });
		act(() =>
			runInAction(() => {
				delete overrides.padding;
			}),
		);
		expect(layout.style.padding).toBe("");
	},
);
