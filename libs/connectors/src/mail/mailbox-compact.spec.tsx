import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MailboxView, type MailboxViewProps } from "./mailbox-view";

const mocks = vi.hoisted(() => ({
	run: vi.fn(),
	save: vi.fn(),
	addToContext: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "room" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, values?: Record<string, unknown>) =>
			values ? `${key} ${Object.values(values).join(" ")}` : key,
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));
vi.mock("../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../core/connector-pixel")>()),
	runConnectorPixel: mocks.run,
}));
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: (
		pixel: string | null,
		parse: (raw: unknown) => unknown,
	) => ({
		data: pixel?.includes("ListMailFolders")
			? [{ id: "archive", name: "Archive" }]
			: pixel
				? parse({
						messages: [message("first", "First body")],
						hasMore: false,
					})
				: null,
		status: "ready",
		reload: vi.fn(),
	}),
}));
vi.mock("../core/use-connector-saver", () => ({
	useConnectorSaver: () => ({
		saveLabel: "Save",
		isBusy: () => false,
		save: mocks.save,
		addToContext: mocks.addToContext,
	}),
}));

let root: Root;
let container: HTMLDivElement;
const scrollIntoView = HTMLElement.prototype.scrollIntoView;

function message(id: string, body?: string) {
	return {
		id,
		conversationId: id === "first" ? "thread-one" : undefined,
		subject: `${id} subject`,
		fromName: `${id} sender`,
		receivedDate: "2026-10-07T12:00:00Z",
		unread: true,
		body,
		webLink: `https://example.com/mail/${id}`,
	};
}

async function render(
	props: Partial<MailboxViewProps> = {},
	mode: "visible" | "hidden" = "visible",
) {
	await act(async () =>
		root.render(
			<Activity mode={mode}>
				<MailboxView
					provider="microsoft"
					presentation="compact"
					providerControl={<button type="button">Microsoft</button>}
					{...props}
				/>
			</Activity>,
		),
	);
}

function button(
	label: string,
	scope: ParentNode = container,
): HTMLButtonElement {
	const found = Array.from(scope.querySelectorAll("button")).find(
		(element) =>
			element.textContent === label ||
			element.getAttribute("aria-label") === label,
	);
	if (!found) throw new Error(`Missing button: ${label}`);
	return found;
}

function row(key: string): HTMLButtonElement {
	const found = container.querySelector<HTMLButtonElement>(
		`button[data-item-key="${key}"]`,
	);
	if (!found) throw new Error(`Missing row: ${key}`);
	return found;
}

function checkbox(label: string): HTMLElement {
	const found = Array.from(
		document.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]'),
	).find((element) => element.textContent === label);
	if (!found) throw new Error(`Missing filter: ${label}`);
	return found;
}

async function key(element: HTMLElement, value: string) {
	await act(async () => {
		element.dispatchEvent(
			new KeyboardEvent("keydown", { key: value, bubbles: true }),
		);
	});
}

async function click(element: HTMLElement) {
	await act(async () => element.click());
}

beforeEach(() => {
	HTMLElement.prototype.scrollIntoView = vi.fn();
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	vi.useFakeTimers();
	mocks.save.mockReset();
	mocks.addToContext.mockReset();
	mocks.run.mockReset().mockImplementation(async (pixel: string) => {
		const isNextPage = pixel.includes("offset=[25]");
		return {
			count: 25,
			messages: isNextPage
				? [message("third")]
				: [message("first"), message("second")],
			hasMore: !isNextPage,
		};
	});
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	HTMLElement.prototype.scrollIntoView = scrollIntoView;
	container.remove();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

it("places provider and Refresh above compact controls and sender above subject", async () => {
	await render();
	expect(button("Microsoft").parentElement?.parentElement).toBe(
		button("common.refresh").parentElement,
	);
	expect(container.querySelector('[role="combobox"]')).toBeTruthy();
	expect(button("mail.filters")).toBeTruthy();
	expect(container.querySelector("button[aria-pressed]")).toBeNull();
	const first = row("conversation:thread-one");
	expect(first.querySelector("svg")).toBeNull();
	expect(first.textContent?.indexOf("first sender")).toBeLessThan(
		first.textContent?.indexOf("first subject") ?? 0,
	);
	expect(first.querySelector('[title="first subject"]')?.classList).toContain(
		"line-clamp-2",
	);
	// Opening and adding to context are the only visible row actions.
	expect(first.closest("li")?.querySelectorAll("button")).toHaveLength(2);
});

it("hands grouped mail to the host while retaining the same visible browser rows", async () => {
	const onOpenItem = vi.fn();
	await render({ onOpenItem });
	await click(button("common.showMore"));
	const first = row("conversation:thread-one");
	await click(first);
	expect(onOpenItem).toHaveBeenCalledWith(
		expect.objectContaining({
			kind: "thread",
			id: "thread-one",
			title: "first subject",
			itemKey: "conversation:thread-one",
			folderName: "mail.inbox",
			summary: expect.objectContaining({ conversationId: "thread-one" }),
		}),
	);
	expect(row("conversation:thread-one")).toBe(first);
	expect(first.closest(".hidden")).toBeNull();
	expect(container.querySelectorAll("button[data-item-key]")).toHaveLength(3);
	await click(row("message:second"));
	expect(onOpenItem).toHaveBeenLastCalledWith(
		expect.objectContaining({ kind: "message", id: "second" }),
	);
});

it("retains compact folder, search, filters, and loaded pages through opening and hiding", async () => {
	const onOpenItem = vi.fn();
	await render({ onOpenItem });
	await key(button("mail.filters"), "Enter");
	expect(checkbox("mail.unreadOnly").getAttribute("aria-checked")).toBe(
		"false",
	);
	expect(checkbox("mail.conversations").getAttribute("aria-checked")).toBe(
		"true",
	);
	await click(checkbox("mail.unreadOnly"));
	await click(checkbox("mail.conversations"));
	await key(checkbox("mail.conversations"), "Escape");

	await key(button("mail.folder"), "ArrowDown");
	const archive = Array.from(
		document.querySelectorAll<HTMLElement>('[role="option"]'),
	).find((element) => element.textContent === "Archive");
	if (!archive) throw new Error("Archive option missing");
	await key(archive, "Enter");
	const input = container.querySelector<HTMLInputElement>(
		'input[type="search"]',
	);
	if (!input) throw new Error("Search field missing");
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set?.call(input, "Budget");
		input.dispatchEvent(new Event("input", { bubbles: true }));
		vi.advanceTimersByTime(350);
	});
	await act(async () => vi.advanceTimersByTime(350));
	await click(button("common.showMore"));
	await click(row("message:first"));
	expect(onOpenItem).toHaveBeenLastCalledWith(
		expect.objectContaining({
			kind: "message",
			id: "first",
			itemKey: "message:first",
			folderName: "Archive",
		}),
	);
	const lastRead = mocks.run.mock.lastCall?.[0];
	expect(lastRead).toContain('folder=["archive"]');
	expect(lastRead).toContain("unreadOnly=[true]");
	expect(lastRead).toContain('subject=["<encode>Budget</encode>"]');
	expect(lastRead).toContain("offset=[25]");
	const reads = mocks.run.mock.calls.length;
	await render({ onOpenItem }, "hidden");
	await render({ onOpenItem });
	expect(mocks.run).toHaveBeenCalledTimes(reads);
	expect(input.value).toBe("Budget");
	expect(button("mail.folder").textContent).toBe("Archive");
	expect(container.querySelectorAll("button[data-item-key]")).toHaveLength(3);
	await key(button("mail.filters"), "Enter");
	expect(checkbox("mail.unreadOnly").getAttribute("aria-checked")).toBe(
		"true",
	);
	expect(checkbox("mail.conversations").getAttribute("aria-checked")).toBe(
		"false",
	);
});

it("keeps the full viewer's header, inline toggles, and inline thread/back behavior", async () => {
	await render({ presentation: "full" });
	expect(container.textContent).toContain("services.outlookMail");
	expect(container.textContent).not.toContain("mail.filters");
	expect(button("mail.conversations").getAttribute("aria-pressed")).toBe(
		"true",
	);
	const first = row("conversation:thread-one");
	expect(first.querySelector("svg")).toBeTruthy();
	await click(first);
	expect(first.closest(".hidden")).toBeTruthy();
	expect(container.textContent).toContain("First body");
	await click(button("mail.backTo mail.inbox"));
	expect(row("conversation:thread-one")).toBe(first);
	expect(first.closest(".hidden")).toBeNull();
	expect(document.activeElement).toBe(first);
});

it("adds context without opening the item and keeps Save in the row menu", async () => {
	const onOpenItem = vi.fn();
	await render({ onOpenItem });
	await click(button("actions.addNamedToContext first subject"));
	expect(mocks.addToContext).toHaveBeenCalledWith(
		expect.objectContaining({ key: "conversation:thread-one" }),
	);
	expect(onOpenItem).not.toHaveBeenCalled();
	await act(async () => {
		row("conversation:thread-one").dispatchEvent(
			new MouseEvent("contextmenu", { bubbles: true }),
		);
	});
	const save = Array.from(
		document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
	).find((element) => element.textContent === "Save");
	if (!save) throw new Error("Save menu action missing");
	await click(save);
	expect(mocks.save).toHaveBeenCalledWith(
		expect.objectContaining({ key: "conversation:thread-one" }),
	);
	expect(onOpenItem).not.toHaveBeenCalled();
});
