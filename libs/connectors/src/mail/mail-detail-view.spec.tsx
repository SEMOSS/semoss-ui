import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConnectorViewerControls } from "../core/connector.types";
import { saveToInsight } from "../core/connector-files";
import { parseMailMessageDetail, parseMailPage } from "./mail.parsers";
import { groupMailByConversation } from "./mail.threads";
import {
	MailDetailView,
	type MailDetailViewProps,
	type MailSelection,
} from "./mail-detail-view";

const mocks = vi.hoisted(() => ({
	data: undefined as unknown,
	pixels: [] as string[],
	translate: (key: string, values?: { service?: string }) =>
		values?.service ? `Open in ${values.service}` : key,
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "origin" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: mocks.translate,
		i18n: { language: "en" },
	}),
}));
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: (pixel: string) => {
		mocks.pixels.push(pixel);
		return {
			data: mocks.data,
			status: mocks.data ? "ready" : "loading",
			error: null,
			isRefreshing: false,
			reload: () => undefined,
		};
	},
}));
vi.mock("../components/connector-text-body", () => ({
	ConnectorTextBody: () => null,
}));
vi.mock("./mail-attachment-list", () => ({ MailAttachmentList: () => null }));
vi.mock("./mail-thread-message", () => ({ MailThreadMessage: () => null }));
vi.mock("../core/connector-files", () => ({ saveToInsight: vi.fn() }));
const save = vi.mocked(saveToInsight);
const savedFile = {
	path: "mail.md",
	name: "mail.md",
	service: "outlook-mail" as const,
};
const message = parseMailMessageDetail({
	id: "m1",
	subject: "Subject",
	webLink: "https://outlook.office.com/mail/read/m1",
});
const selection: MailSelection = {
	kind: "message",
	provider: "microsoft",
	itemKey: "message:m1",
	folderName: "Inbox",
	message,
};
let root: Root;
let container: HTMLDivElement;
const render = async (props: Partial<MailDetailViewProps> = {}) => {
	await act(async () =>
		root.render(
			<MailDetailView
				selection={selection}
				onBack={() => undefined}
				{...props}
			/>,
		),
	);
};
beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	mocks.data = message;
	mocks.pixels = [];
	save.mockReset().mockResolvedValue(savedFile);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("publishes the loaded matching message link and suppresses its inline equivalent", async () => {
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	await render({ onControlsChange: controls });
	expect(controls).toHaveBeenLastCalledWith({
		refresh: undefined,
		onOpenCalendar: undefined,
		addToContext: undefined,
		openIn: { href: message.webLink, label: "Open in services.outlook" },
	});
	expect(container.querySelector('a[target="_blank"]')).toBeNull();
	await render();
	expect(container.querySelector("a")?.getAttribute("href")).toBe(
		message.webLink,
	);
	expect(container.querySelector("a")?.getAttribute("rel")).toBe(
		"noopener noreferrer",
	);
});

it.each([undefined, "javascript:alert(1)", "http://example.com/item"])(
	"hides unsafe or absent loaded links: %s",
	async (webLink) => {
		mocks.data = { ...message, webLink };
		const controls = vi.fn();
		await render({ onControlsChange: controls });
		expect(controls).toHaveBeenLastCalledWith({
			refresh: undefined,
			onOpenCalendar: undefined,
			addToContext: undefined,
			openIn: undefined,
		});
	},
);

it("does not publish a summary link while loading or a mismatched loaded message", async () => {
	const controls = vi.fn();
	const onAddToContext = vi.fn();
	mocks.data = undefined;
	await render({ onControlsChange: controls, onAddToContext });
	expect(controls).toHaveBeenLastCalledWith({
		refresh: undefined,
		onOpenCalendar: undefined,
		addToContext: undefined,
		openIn: undefined,
	});
	mocks.data = { ...message, id: "foreign" };
	await render({ onControlsChange: controls, onAddToContext });
	expect(
		controls.mock.calls.every(
			([value]) =>
				value.openIn === undefined && value.addToContext === undefined,
		),
	).toBe(true);
});

it("uses the newest loaded matching thread message and never a different conversation", async () => {
	const page = parseMailPage({
		messages: [
			{
				id: "old",
				conversationId: "thread",
				receivedDate: "2026-01-01",
				webLink: "https://example.com/old",
			},
			{
				id: "new",
				conversationId: "thread",
				receivedDate: "2026-01-02",
				webLink: "https://example.com/new",
			},
			{
				id: "other",
				conversationId: "foreign",
				receivedDate: "2026-01-03",
				webLink: "https://example.com/foreign",
			},
		],
	});
	const conversation = groupMailByConversation(page.messages).find(
		(item) => item.conversationId === "thread",
	);
	if (!conversation) throw new Error("Missing fixture conversation");
	mocks.data = page;
	const controls = vi.fn();
	await render({
		selection: {
			...selection,
			kind: "thread",
			conversation: { ...conversation, conversationId: "thread" },
		},
		onControlsChange: controls,
	});
	expect(controls).toHaveBeenLastCalledWith({
		refresh: undefined,
		onOpenCalendar: undefined,
		addToContext: undefined,
		openIn: {
			href: "https://example.com/new",
			label: "Open in services.outlook",
		},
	});
});

it("publishes a stable message context action with busy state while keeping Save inline", async () => {
	let finishSave: (file: typeof savedFile) => void = () => undefined;
	save.mockReturnValueOnce(
		new Promise((resolve) => {
			finishSave = resolve;
		}),
	);
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	const onAddToContext = vi.fn();
	const props = { onControlsChange: controls, onAddToContext };
	await render(props);
	const published = controls.mock.lastCall?.[0].addToContext;
	expect(published).toEqual({
		onAddToContext: expect.any(Function),
		isBusy: false,
	});
	expect(container.textContent).not.toContain("actions.addToContext");
	expect(container.textContent).toContain("actions.save");
	await render(props);
	expect(controls).toHaveBeenCalledOnce();
	await act(async () => published?.onAddToContext());
	expect(controls.mock.lastCall?.[0].addToContext).toEqual({
		onAddToContext: published?.onAddToContext,
		isBusy: true,
	});
	expect(save).toHaveBeenCalledWith(
		"origin",
		"outlook-mail",
		expect.any(Object),
	);
	const source = save.mock.calls[0]?.[2];
	if (source?.kind !== "text") throw new Error("Expected a text save");
	expect(await source.getContent()).toContain("Subject");
	await act(async () => finishSave(savedFile));
	expect(onAddToContext).toHaveBeenCalledWith(savedFile);
	expect(controls.mock.lastCall?.[0].addToContext?.isBusy).toBe(false);
	await render({ onAddToContext });
	expect(container.textContent).toContain("actions.addToContext");
	expect(container.textContent).toContain("actions.save");
});

it("publishes stable context controls only for a loaded matching thread and preserves inline defaults", async () => {
	const page = parseMailPage({
		messages: [
			{
				id: "thread-mail",
				conversationId: "thread",
				subject: "Matching subject",
			},
			{
				id: "foreign-mail",
				conversationId: "foreign",
				subject: "Foreign subject",
			},
		],
	});
	const conversation = groupMailByConversation(page.messages).find(
		(item) => item.conversationId === "thread",
	);
	if (!conversation) throw new Error("Missing fixture conversation");
	const threadSelection: MailSelection = {
		...selection,
		kind: "thread",
		conversation: { ...conversation, conversationId: "thread" },
	};
	const controls = vi.fn<(value: ConnectorViewerControls) => void>();
	const onAddToContext = vi.fn();
	const props = {
		selection: threadSelection,
		onControlsChange: controls,
		onAddToContext,
	};
	mocks.data = page;
	await render(props);
	const published = controls.mock.lastCall?.[0].addToContext;
	expect(published).toEqual({
		onAddToContext: expect.any(Function),
		isBusy: false,
	});
	expect(container.textContent).not.toContain("actions.addToContext");
	expect(container.textContent).toContain("actions.save");
	await render(props);
	expect(controls).toHaveBeenCalledOnce();
	await act(async () => published?.onAddToContext());
	const source = save.mock.calls[0]?.[2];
	if (source?.kind !== "text") throw new Error("Expected a thread text save");
	const content = await source.getContent();
	expect(content).toContain("Matching subject");
	expect(content).not.toContain("Foreign subject");
	expect(onAddToContext).toHaveBeenCalledWith(savedFile);
	await render({ selection: threadSelection, onAddToContext });
	expect(container.textContent).toContain("actions.addToContext");
	expect(container.textContent).toContain("actions.save");
	mocks.data = undefined;
	await render(props);
	expect(controls.mock.lastCall?.[0].addToContext).toBeUndefined();
	mocks.data = parseMailPage({ messages: [page.messages[1]] });
	await render(props);
	expect(controls.mock.lastCall?.[0].addToContext).toBeUndefined();
});

it("does not let hidden providers publish or focus and focuses each explicit reopen", async () => {
	const controls = vi.fn();
	await render({
		isVisible: false,
		focusRequestId: 1,
		onControlsChange: controls,
	});
	expect(controls).not.toHaveBeenCalled();
	expect(document.activeElement).not.toBe(container.querySelector("h4"));
	await render({
		isVisible: true,
		focusRequestId: 1,
		onControlsChange: controls,
	});
	expect(document.activeElement).toBe(container.querySelector("h4"));
	await act(async () => container.querySelector("button")?.focus());
	await render({
		isVisible: true,
		focusRequestId: 2,
		onControlsChange: controls,
	});
	expect(document.activeElement).toBe(container.querySelector("h4"));
	expect(
		mocks.pixels.every((pixel) => pixel.startsWith("MicrosoftOutlook")),
	).toBe(true);
});
