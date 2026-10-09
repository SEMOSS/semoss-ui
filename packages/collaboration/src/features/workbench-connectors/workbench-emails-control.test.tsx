import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { useEffect, useState } from "react";
import type {
	ConnectorAccount,
	MailboxViewControls,
	MailboxViewProps,
} from "@semoss/connectors";
import { TooltipProvider } from "@semoss/ui/next";
import {
	createWorkbenchStore,
	Workbench,
	WorkbenchProvider,
	type WorkbenchSnapshot,
} from "@semoss/workbench";
import { EMAILS_PANEL_TYPE } from "@/features/tools/tool-workbench.constants";
import { WorkbenchConnectorNavigationProvider } from "./workbench-connector-navigation-provider";
import type { WorkbenchEmailsPanelValue } from "./workbench-emails-control";
import { WORKBENCH_EMAILS_PANEL } from "./workbench-emails-panel";

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({ store }),
}));
vi.mock("./workbench-connector.context", () => ({
	useWorkbenchConnectorHost: () => ({}),
}));
vi.mock("@semoss/connectors", async (original) => ({
	...(await original<typeof import("@semoss/connectors")>()),
	MailboxView: MailboxFixture,
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { service?: string }) => {
			const labels: Record<string, string> = {
				"workbench.provider": "Provider",
				"accounts.microsoft": "Microsoft 365",
				"accounts.google": "Google Workspace",
				"common.refresh": "Refresh",
				"common.loading": "Loading",
			};
			return key === "actions.openIn"
				? `Open in ${options?.service}`
				: (labels[key] ?? key);
		},
	}),
}));

const PANEL_ID = "mail-instance-with-opaque-id";
const snapshot: WorkbenchSnapshot = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {
		[PANEL_ID]: {
			id: PANEL_ID,
			type: EMAILS_PANEL_TYPE,
			name: "Emails",
			canClose: false,
		},
	},
	borders: { left: { panelIds: [PANEL_ID], activeId: PANEL_ID, size: 300 } },
	selectedPanelId: PANEL_ID,
};
const components = { [EMAILS_PANEL_TYPE]: WORKBENCH_EMAILS_PANEL };
let store = createWorkbenchStore({ components });
let controls: Record<ConnectorAccount, MailboxViewControls>;
const publishers = new Map<
	ConnectorAccount,
	NonNullable<MailboxViewProps["onControls"]>
>();
const lastViewerProps = new Map<ConnectorAccount, MailboxViewProps>();

/** Publish the real viewer contract while retaining local browsing state. */
function MailboxFixture(props: MailboxViewProps) {
	const { provider, providerControl, onControls, showRefresh = true } = props;
	const [search, setSearch] = useState("");
	lastViewerProps.set(provider, props);
	useEffect(() => {
		if (!onControls) return;
		publishers.set(provider, onControls);
		onControls(controls[provider]);
	}, [onControls, provider]);
	return (
		<section aria-label={`${provider} mailbox`}>
			<div role="toolbar" aria-label={`${provider} mailbox toolbar`}>
				{providerControl}
				{showRefresh ? (
					<button type="button">Viewer refresh</button>
				) : null}
			</div>
			<input
				aria-label={`${provider} search`}
				value={search}
				onChange={(event) => setSearch(event.target.value)}
			/>
		</section>
	);
}

/** Mount the real shell and registration boundary, including desktop border chrome. */
function Fixture({ layoutMode = "auto" }: { layoutMode?: "auto" | "compact" }) {
	return (
		<TooltipProvider>
			<WorkbenchProvider store={store}>
				<WorkbenchConnectorNavigationProvider>
					<Workbench snapshot={snapshot} layoutMode={layoutMode} />
				</WorkbenchConnectorNavigationProvider>
			</WorkbenchProvider>
		</TooltipProvider>
	);
}

/** Deliver a fresh publication even if that provider's Activity is now hidden. */
function publish(
	provider: ConnectorAccount,
	patch: Partial<MailboxViewControls>,
): void {
	controls[provider] = { ...controls[provider], ...patch };
	const onControls = publishers.get(provider);
	if (!onControls) throw new Error(`No ${provider} publication callback`);
	act(() => onControls(controls[provider]));
}

/** Choose an account through the actual accessible selector. */
async function chooseProvider(name: string): Promise<void> {
	fireEvent.keyDown(screen.getByRole("combobox", { name: "Provider" }), {
		key: "ArrowDown",
	});
	fireEvent.click(await screen.findByRole("option", { name }));
}

beforeEach(() => {
	store = createWorkbenchStore({ components });
	publishers.clear();
	lastViewerProps.clear();
	controls = {
		microsoft: {
			provider: "microsoft",
			refresh: vi.fn(),
			isRefreshing: false,
			mailboxUrl: "https://outlook.office.com/mail/",
			appName: "Outlook",
		},
		google: {
			provider: "google",
			refresh: vi.fn(),
			isRefreshing: false,
			mailboxUrl: "https://mail.google.com/mail/",
			appName: "Gmail",
		},
	};
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn((query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	});
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
		new DOMRect(0, 0, 1200, 800),
	);
});

afterEach(() => vi.restoreAllMocks());

it("registers desktop refresh on the actual panel instance without a mailbox homepage link", async () => {
	render(<Fixture />);
	const refresh = await screen.findByRole("button", { name: "Refresh" });
	const border = screen.getByTestId("workbench-border-left");
	expect(border.querySelector("[data-border-header=left]")).toContainElement(
		refresh,
	);
	expect(screen.queryByRole("link", { name: /Open in/ })).toBeNull();
	expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1);
	expect(
		within(
			screen.getByRole("toolbar", { name: "microsoft mailbox toolbar" }),
		).queryByRole("button", { name: "Refresh" }),
	).toBeNull();
	expect(screen.queryByRole("button", { name: "Viewer refresh" })).toBeNull();
	expect(lastViewerProps.get("microsoft")).toMatchObject({
		presentation: "compact",
		showRefresh: false,
	});
	expect(store.getState().control.controls[PANEL_ID]).toBeDefined();
	expect(
		store.getState().control.controls[EMAILS_PANEL_TYPE],
	).toBeUndefined();
	expect(
		(store.getState().layout.values[PANEL_ID] as WorkbenchEmailsPanelValue)
			.controls.microsoft,
	).toBe(controls.microsoft);
	expect(store.getState().layout.values[EMAILS_PANEL_TYPE]).toBeUndefined();
	expect(
		JSON.stringify(store.getState().layout.actions.getSnapshot()),
	).not.toContain("mailboxUrl");
	fireEvent.click(refresh);
	expect(controls.microsoft.refresh).toHaveBeenCalledOnce();
});

it("moves actions into the compact toolbar without duplicates or remounting the mailbox", async () => {
	const { rerender } = render(<Fixture />);
	const input = await screen.findByRole("textbox", {
		name: "microsoft search",
	});
	fireEvent.change(input, { target: { value: "Retain this search" } });
	await screen.findByRole("button", { name: "Refresh" });
	rerender(<Fixture layoutMode="compact" />);
	await waitFor(() =>
		expect(store.getState().layout.isMobileLayout).toBe(true),
	);
	const toolbar = screen.getByRole("toolbar", {
		name: "microsoft mailbox toolbar",
	});
	expect(
		within(toolbar).getByRole("button", { name: "Refresh" }),
	).toBeVisible();
	expect(within(toolbar).queryByRole("link", { name: /Open in/ })).toBeNull();
	expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1);
	expect(screen.queryByRole("link", { name: /Open in/ })).toBeNull();
	expect(screen.queryByTestId("workbench-border-left")).toBeNull();
	expect(screen.getByRole("textbox", { name: "microsoft search" })).toBe(
		input,
	);
	expect(input).toHaveValue("Retain this search");
	rerender(<Fixture />);
	await waitFor(() =>
		expect(store.getState().layout.isMobileLayout).toBe(false),
	);
	expect(
		screen
			.getByTestId("workbench-border-left")
			.querySelector("[data-border-header=left]"),
	).toContainElement(screen.getByRole("button", { name: "Refresh" }));
	expect(
		within(
			screen.getByRole("toolbar", { name: "microsoft mailbox toolbar" }),
		).queryByRole("button", { name: "Refresh" }),
	).toBeNull();
	expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1);
	expect(screen.getByRole("textbox", { name: "microsoft search" })).toBe(
		input,
	);
	expect(input).toHaveValue("Retain this search");
});

it("keeps Gmail controls active after a hidden Microsoft viewer publishes late", async () => {
	render(<Fixture />);
	await screen.findByRole("button", { name: "Refresh" });
	await chooseProvider("Google Workspace");
	await screen.findByRole("textbox", { name: "google search" });
	publish("microsoft", { isRefreshing: true });
	expect(screen.queryByRole("link", { name: /Open in/ })).toBeNull();
	const refresh = screen.getByRole("button", { name: "Refresh" });
	expect(refresh).toHaveAttribute("aria-busy", "false");
	expect(refresh).not.toHaveAttribute("aria-disabled", "true");
	fireEvent.click(refresh);
	expect(controls.google.refresh).toHaveBeenCalledOnce();
	expect(controls.microsoft.refresh).not.toHaveBeenCalled();
	await chooseProvider("Microsoft 365");
	expect(screen.queryByRole("link", { name: /Open in/ })).toBeNull();
	expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute(
		"aria-busy",
		"true",
	);
});

it("updates busy state live, preserves control focus, and guards repeat refreshes", async () => {
	render(<Fixture />);
	const refresh = await screen.findByRole("button", { name: "Refresh" });
	act(() => refresh.focus());
	publish("microsoft", { isRefreshing: true });
	expect(screen.getByRole("button", { name: "Refresh" })).toBe(refresh);
	expect(refresh).toHaveFocus();
	expect(refresh).toHaveAttribute("aria-busy", "true");
	expect(refresh).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(refresh);
	fireEvent.click(refresh);
	expect(controls.microsoft.refresh).not.toHaveBeenCalled();
	const newRefresh = vi.fn();
	publish("microsoft", { isRefreshing: false, refresh: newRefresh });
	expect(refresh).toHaveAttribute("aria-busy", "false");
	expect(refresh).not.toHaveAttribute("aria-disabled", "true");
	fireEvent.click(refresh);
	expect(newRefresh).toHaveBeenCalledOnce();
});
