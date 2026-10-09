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
	MailDetailViewControls,
	MailDetailViewProps,
	MailItemSelection,
} from "@semoss/connectors";
import { TooltipProvider } from "@semoss/ui/next";
import {
	createWorkbenchStore,
	Workbench,
	WorkbenchProvider,
	type WorkbenchSnapshot,
} from "@semoss/workbench";
import { EMAIL_DETAIL_PANEL_TYPE } from "@/features/tools/tool-workbench.constants";
import { WORKBENCH_EMAIL_DETAIL_PANEL } from "./workbench-connector-detail-panel";
import {
	useWorkbenchConnectorNavigation,
	type WorkbenchConnectorNavigation,
} from "./workbench-connector-navigation.context";
import { WorkbenchConnectorNavigationProvider } from "./workbench-connector-navigation-provider";

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({ store }),
}));
vi.mock("./workbench-connector.context", () => ({
	useWorkbenchConnectorHost: () => ({}),
}));
vi.mock("@semoss/connectors", async (original) => ({
	...(await original<typeof import("@semoss/connectors")>()),
	MailDetailView: MailDetailFixture,
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { service?: string }) =>
			key === "actions.openIn" ? `Open in ${options?.service}` : key,
	}),
}));

const snapshot: WorkbenchSnapshot = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {},
};
const components = { [EMAIL_DETAIL_PANEL_TYPE]: WORKBENCH_EMAIL_DETAIL_PANEL };
let store = createWorkbenchStore({ components });
let navigation: WorkbenchConnectorNavigation | null = null;
const publications = new Map<
	string,
	NonNullable<MailDetailViewProps["onControls"]>
>();
const publishedControls = new Map<string, MailDetailViewControls>();
const publicationCounts = new Map<string, number>();
const viewerProps = new Map<string, MailDetailViewProps>();

/** Match the shared control identity without relying on any generated panel id. */
function itemKey(
	provider: ConnectorAccount,
	selection: Pick<MailItemSelection, "kind" | "id">,
): string {
	return `${provider}:${selection.kind}:${selection.id}`;
}

/** Create list data with no provider homepage or assumed item URL. */
function selection(
	id = "one",
	kind: MailItemSelection["kind"] = "message",
): MailItemSelection {
	return {
		kind,
		id,
		title: `Subject ${id}`,
		itemKey: `${kind}:${id}`,
		folderName: "Inbox",
		summary: {
			key: `${kind}:${id}`,
			conversationId: kind === "thread" ? id : undefined,
			isUnread: false,
			hasAttachments: false,
			messages: [],
			latest: {
				id,
				to: [],
				cc: [],
				attachments: [],
				isUnread: false,
				hasAttachments: false,
				isBodyTruncated: false,
			},
		},
	};
}

/** Retain a reader and publish its specific URL only when data supplies one. */
function MailDetailFixture(props: MailDetailViewProps) {
	const { provider, selection: item, onControls, showOpenIn = true } = props;
	const key = itemKey(provider, item);
	const [notes, setNotes] = useState("");
	useEffect(() => {
		viewerProps.set(key, props);
	}, [key, props]);
	useEffect(() => {
		if (!onControls) return;
		publications.set(key, onControls);
		publicationCounts.set(key, (publicationCounts.get(key) ?? 0) + 1);
		const controls = publishedControls.get(key) ?? {
			provider,
			kind: item.kind,
			itemId: item.id,
			appName: provider === "microsoft" ? "Outlook" : "Gmail",
		};
		publishedControls.set(key, controls);
		onControls(controls);
	}, [provider, item.kind, item.id, key, onControls]);
	const controls = publishedControls.get(key);
	return (
		<div>
			<h2 tabIndex={-1}>
				{provider} {item.title}
			</h2>
			<div role="toolbar" aria-label={`${key} message actions`}>
				{showOpenIn && controls?.webUrl ? (
					<a
						href={controls.webUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						Open in {controls.appName}
					</a>
				) : null}
			</div>
			<input
				aria-label={`${key} notes`}
				value={notes}
				onChange={(event) => setNotes(event.target.value)}
			/>
		</div>
	);
}

/** Capture real host actions so openings also exercise transient-state preservation. */
function NavigationProbe() {
	navigation = useWorkbenchConnectorNavigation();
	return null;
}

/** Mount the real main-stage chrome and its mobile replacement. */
function Fixture({ layoutMode = "auto" }: { layoutMode?: "auto" | "compact" }) {
	return (
		<TooltipProvider>
			<WorkbenchProvider store={store}>
				<WorkbenchConnectorNavigationProvider>
					<NavigationProbe />
					<Workbench snapshot={snapshot} layoutMode={layoutMode} />
				</WorkbenchConnectorNavigationProvider>
			</WorkbenchProvider>
		</TooltipProvider>
	);
}

/** Open through the production identity matcher, not a test-owned panel record. */
async function openMail(
	provider: ConnectorAccount,
	item: MailItemSelection,
): Promise<string> {
	if (!navigation) throw new Error("Navigation not ready");
	const nav = navigation;
	act(() => nav.openMail(provider, item));
	await screen.findByRole("heading", { name: `${provider} ${item.title}` });
	const id = store.getState().layout.selection.panel;
	if (!id) throw new Error("Missing opened panel");
	return id;
}

/** Simulate a new response from an active or retained hidden item reader. */
function publish(
	provider: ConnectorAccount,
	item: MailItemSelection,
	patch: Partial<MailDetailViewControls>,
): void {
	const key = itemKey(provider, item);
	const previous = publishedControls.get(key);
	const onControls = publications.get(key);
	if (!previous || !onControls) throw new Error(`No controls for ${key}`);
	const next = { ...previous, ...patch };
	publishedControls.set(key, next);
	act(() => onControls(next));
}

beforeEach(() => {
	store = createWorkbenchStore({ components });
	navigation = null;
	publications.clear();
	publishedControls.clear();
	publicationCounts.clear();
	viewerProps.clear();
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

it("shows only the opened message URL in its desktop header and preserves the mail selection", async () => {
	render(<Fixture />);
	const item = selection();
	const id = await openMail("microsoft", item);
	expect(screen.queryByRole("link", { name: "Open in Outlook" })).toBeNull();
	const url = "https://outlook.office.com/mail/deeplink/read/message-one";
	publish("microsoft", item, { webUrl: url });
	const link = screen.getByRole("link", { name: "Open in Outlook" });
	expect(link).toHaveAttribute("href", url);
	expect(link).toHaveAttribute("target", "_blank");
	expect(link).toHaveAttribute("rel", "noopener noreferrer");
	expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
	expect(screen.getByTestId("workbench-tabset-main")).toContainElement(link);
	expect(
		within(
			screen.getByRole("toolbar", {
				name: "microsoft:message:one message actions",
			}),
		).queryByRole("link"),
	).toBeNull();
	expect(screen.getAllByRole("link")).toHaveLength(1);
	expect(screen.queryByRole("button", { name: "common.refresh" })).toBeNull();
	expect(id).not.toBe(EMAIL_DETAIL_PANEL_TYPE);
	expect(store.getState().control.controls[id]).toBeDefined();
	expect(
		store.getState().control.controls[EMAIL_DETAIL_PANEL_TYPE],
	).toBeUndefined();
	expect(store.getState().layout.values[id]).toMatchObject({
		kind: "mail",
		selection: item,
		controls: {
			provider: "microsoft",
			kind: "message",
			itemId: "one",
			webUrl: url,
		},
	});
	expect(
		JSON.stringify(store.getState().layout.actions.getSnapshot()),
	).not.toContain(url);
	expect(viewerProps.get(itemKey("microsoft", item))?.showOpenIn).toBe(false);
});

it("keeps controls isolated by provider and tab when hidden readers publish late", async () => {
	render(<Fixture />);
	const first = selection();
	const second = selection("two");
	const firstId = await openMail("microsoft", first);
	publish("microsoft", first, {
		webUrl: "https://outlook.office.com/mail/deeplink/read/first",
	});
	await openMail("google", first);
	const gmailUrl = "https://mail.google.com/mail/#all/abc123";
	publish("google", first, { webUrl: gmailUrl });
	publish("microsoft", first, {
		webUrl: "https://outlook.office.com/mail/deeplink/read/updated-first",
	});
	expect(screen.getByRole("link", { name: "Open in Gmail" })).toHaveAttribute(
		"href",
		gmailUrl,
	);
	expect(screen.queryByRole("link", { name: "Open in Outlook" })).toBeNull();
	await openMail("microsoft", second);
	publish("microsoft", second, {
		webUrl: "https://outlook.office.com/mail/deeplink/read/second",
	});
	publish("microsoft", first, {
		webUrl: "https://outlook.office.com/mail/deeplink/read/latest-first",
	});
	expect(
		screen.getByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute(
		"href",
		"https://outlook.office.com/mail/deeplink/read/second",
	);
	expect(await openMail("microsoft", first)).toBe(firstId);
	await waitFor(() =>
		expect(
			screen.getByRole("link", { name: "Open in Outlook" }),
		).toHaveAttribute(
			"href",
			"https://outlook.office.com/mail/deeplink/read/latest-first",
		),
	);
	expect(store.getState().layout.tabsets[0]?.panelIds).toHaveLength(3);
});

it.each([
	{ provider: "google" as const },
	{ kind: "thread" as const },
	{ itemId: "another-message" },
])(
	"ignores a publication that does not match the opened item: %j",
	async (wrongIdentity) => {
		render(<Fixture />);
		const item = selection();
		const id = await openMail("microsoft", item);
		publish("microsoft", item, {
			...wrongIdentity,
			webUrl: "https://example.com/wrong-item",
		});
		expect(screen.queryByRole("link")).toBeNull();
		expect(store.getState().layout.values[id]).toMatchObject({
			kind: "mail",
			selection: item,
			controls: { provider: "microsoft", kind: "message", itemId: "one" },
		});
	},
);

it("keeps a matching control when reopening the same mounted tab and clears a missing URL", async () => {
	render(<Fixture />);
	const item = selection();
	const id = await openMail("google", item);
	publish("google", item, {
		webUrl: "https://mail.google.com/mail/#all/thread-one",
	});
	const count = publicationCounts.get(itemKey("google", item));
	await openMail("google", { ...item, title: "Updated subject" });
	expect(publicationCounts.get(itemKey("google", item))).toBe(count);
	expect(screen.getByRole("link", { name: "Open in Gmail" })).toHaveAttribute(
		"href",
		"https://mail.google.com/mail/#all/thread-one",
	);
	expect(store.getState().layout.values[id]).toMatchObject({
		selection: { title: "Updated subject" },
	});
	publish("google", item, { webUrl: undefined });
	expect(screen.queryByRole("link")).toBeNull();
	expect(screen.queryByRole("link", { name: "Open in Gmail" })).toBeNull();
});

it("uses the existing compact message link without duplicates or remounting the reader", async () => {
	const { rerender } = render(<Fixture />);
	const item = selection();
	const id = await openMail("microsoft", item);
	publish("microsoft", item, {
		webUrl: "https://outlook.office.com/mail/deeplink/read/one",
	});
	const input = screen.getByRole("textbox", {
		name: "microsoft:message:one notes",
	});
	fireEvent.change(input, { target: { value: "Keep this reader state" } });
	rerender(<Fixture layoutMode="compact" />);
	await waitFor(() =>
		expect(store.getState().layout.isMobileLayout).toBe(true),
	);
	const toolbar = screen.getByRole("toolbar", {
		name: "microsoft:message:one message actions",
	});
	expect(
		within(toolbar).getByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute(
		"href",
		"https://outlook.office.com/mail/deeplink/read/one",
	);
	expect(
		screen.getAllByRole("link", { name: "Open in Outlook" }),
	).toHaveLength(1);
	expect(store.getState().control.controls[id]).toBeUndefined();
	expect(viewerProps.get(itemKey("microsoft", item))?.showOpenIn).toBe(true);
	expect(
		screen.getByRole("textbox", { name: "microsoft:message:one notes" }),
	).toBe(input);
	expect(input).toHaveValue("Keep this reader state");
	rerender(<Fixture />);
	await waitFor(() =>
		expect(store.getState().layout.isMobileLayout).toBe(false),
	);
	expect(
		screen.getAllByRole("link", { name: "Open in Outlook" }),
	).toHaveLength(1);
	expect(
		within(
			screen.getByRole("toolbar", {
				name: "microsoft:message:one message actions",
			}),
		).queryByRole("link"),
	).toBeNull();
	expect(
		screen.getByRole("textbox", { name: "microsoft:message:one notes" }),
	).toBe(input);
});

it("opens the newest thread message from desktop chrome or the compact action bar", async () => {
	const { rerender } = render(<Fixture />);
	const item = selection("thread-one", "thread");
	await openMail("microsoft", item);
	const newestUrl =
		"https://outlook.office.com/mail/deeplink/read/newest-message";
	publish("microsoft", item, { webUrl: newestUrl });
	expect(
		within(screen.getByTestId("workbench-tabset-main")).getByRole("link", {
			name: "Open in Outlook",
		}),
	).toHaveAttribute("href", newestUrl);
	expect(
		within(
			screen.getByRole("toolbar", {
				name: "microsoft:thread:thread-one message actions",
			}),
		).queryByRole("link"),
	).toBeNull();
	expect(viewerProps.get(itemKey("microsoft", item))?.showOpenIn).toBe(false);
	rerender(<Fixture layoutMode="compact" />);
	await waitFor(() =>
		expect(store.getState().layout.isMobileLayout).toBe(true),
	);
	expect(
		within(
			screen.getByRole("toolbar", {
				name: "microsoft:thread:thread-one message actions",
			}),
		).getByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute("href", newestUrl);
	expect(
		screen.getAllByRole("link", { name: "Open in Outlook" }),
	).toHaveLength(1);
});
