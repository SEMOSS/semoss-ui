import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { parseMailPage } from "./mail.parsers";
import { MailboxView, type MailboxViewProps } from "./mailbox-view";

const mocks = vi.hoisted(() => ({
	messages: [] as unknown[],
	pageError: null as { kind: string; message: string } | null,
	loadMore: vi.fn(),
	reload: vi.fn(),
	hasMore: false,
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "origin" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: () => ({
		data: [],
		status: "ready",
		error: null,
		isRefreshing: false,
		reload: mocks.reload,
	}),
}));
vi.mock("./use-mail-pages", () => ({
	useMailPages: () => ({
		data: mocks.messages,
		status: "ready",
		error: null,
		isRefreshing: false,
		reload: mocks.reload,
		loadMore: mocks.loadMore,
		pageError: mocks.pageError,
		hasMore: mocks.hasMore,
	}),
}));
let root: Root;
let container: HTMLDivElement;
const render = async (props: Partial<MailboxViewProps> = {}) => {
	await act(async () =>
		root.render(
			<MailboxView
				provider="microsoft"
				showHeader={false}
				presentation="compact"
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
	vi.clearAllMocks();
	mocks.messages = parseMailPage({
		messages: [{ id: "m1", subject: "A long subject", fromName: "Sender" }],
	}).messages;
	mocks.pageError = null;
	mocks.hasMore = false;
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("keeps the browser mounted while handing a provider-bound selection to the host", async () => {
	const onOpenItem = vi.fn();
	const onAddToContext = vi.fn();
	const onControlsChange = vi.fn();
	await render({ onOpenItem, onAddToContext, onControlsChange });
	const row = container.querySelector<HTMLButtonElement>(
		'[data-item-key="message:m1"]',
	);
	await act(async () => row?.click());
	expect(onOpenItem).toHaveBeenCalledWith(
		expect.objectContaining({
			provider: "microsoft",
			kind: "message",
			itemKey: "message:m1",
			message: expect.objectContaining({ id: "m1" }),
		}),
	);
	expect(container.querySelector('[data-item-key="message:m1"]')).toBe(row);
	expect(container.textContent).toContain("mail.filters");
	expect(
		container.querySelector('button[aria-label="common.refresh"]'),
	).toBeNull();
	expect(onControlsChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			refresh: expect.objectContaining({
				onRefresh: expect.any(Function),
			}),
		}),
	);
	expect(row?.textContent?.indexOf("Sender")).toBeLessThan(
		row?.textContent?.indexOf("A long subject") ?? 0,
	);
});

it("restores the origin row on return, waits while hidden, and does not refocus unchanged requests", async () => {
	await render({
		isVisible: false,
		focusItem: { itemKey: "message:m1", requestId: 1 },
	});
	const row = container.querySelector<HTMLButtonElement>(
		'[data-item-key="message:m1"]',
	);
	expect(document.activeElement).not.toBe(row);
	await render({
		isVisible: true,
		focusItem: { itemKey: "message:m1", requestId: 1 },
	});
	expect(document.activeElement).toBe(row);
	const search = container.querySelector<HTMLInputElement>("input");
	await act(async () => search?.focus());
	await render({ focusItem: { itemKey: "message:m1", requestId: 1 } });
	expect(document.activeElement).toBe(search);
	await render({ focusItem: { itemKey: "message:m1", requestId: 2 } });
	expect(document.activeElement).toBe(row);
});

it("focuses the browser list when the requested row is gone and other rows remain", async () => {
	await render({
		focusItem: { itemKey: "message:removed", requestId: 1 },
	});
	const list = container.querySelector("ul");
	expect(list?.querySelector('[data-item-key="message:m1"]')).not.toBeNull();
	expect(document.activeElement).toBe(list);
	expect(list?.getAttribute("tabindex")).toBe("-1");
	expect(list?.className).toContain("focus-visible:outline-ring");
});

it("focuses the browser container when no list is available", async () => {
	mocks.messages = [];
	await render({
		focusItem: { itemKey: "message:removed", requestId: 1 },
	});
	expect(container.querySelector("ul")).toBeNull();
	expect(document.activeElement).toBe(container.firstElementChild);
});

it("keeps loaded rows after a failed next page and retries without restarting", async () => {
	mocks.hasMore = true;
	mocks.pageError = { kind: "other", message: "network" };
	await render();
	expect(
		container.querySelector('[data-item-key="message:m1"]'),
	).not.toBeNull();
	const retry = Array.from(container.querySelectorAll("button")).find(
		(button) => button.textContent === "common.retry",
	);
	await act(async () => retry?.click());
	expect(mocks.loadMore).toHaveBeenCalledOnce();
	expect(mocks.reload).not.toHaveBeenCalled();
});

it("allows another page when all previously returned raw rows were malformed", async () => {
	mocks.messages = [];
	mocks.hasMore = true;
	await render();
	const more = Array.from(container.querySelectorAll("button")).find(
		(button) => button.textContent === "common.showMore",
	);
	await act(async () => more?.click());
	expect(mocks.loadMore).toHaveBeenCalledOnce();
});

it("uses the existing sign-in flow when an additional page loses authentication", async () => {
	mocks.hasMore = true;
	mocks.pageError = { kind: "signIn", message: "sign in" };
	const onSignIn = vi.fn(async () => true);
	await render({ onSignIn });
	const signIn = Array.from(container.querySelectorAll("button")).find(
		(button) => button.textContent === "status.signIn",
	);
	await act(async () => signIn?.click());
	expect(onSignIn).toHaveBeenCalledOnce();
	expect(mocks.loadMore).toHaveBeenCalledOnce();
	expect(
		container.querySelector('[data-item-key="message:m1"]'),
	).not.toBeNull();
});

it("keeps Playground's inline refresh and toggle toolbar when optional controls are omitted", async () => {
	await render({ presentation: "default" });
	expect(
		container.querySelector('button[aria-label="common.refresh"]'),
	).not.toBeNull();
	expect(container.textContent).toContain("mail.unreadOnly");
	expect(container.textContent).toContain("mail.conversations");
	expect(container.textContent).not.toContain("mail.filters");
});
