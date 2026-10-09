import { act, useCallback, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
	MailboxView,
	type MailboxViewControls,
	type MailboxViewProps,
} from "./mailbox-view";

const mocks = vi.hoisted(() => ({ run: vi.fn(), publish: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "room" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({ "services.outlook": "Outlook", "services.gmail": "Gmail" })[
				key
			] ?? key,
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));
vi.mock("../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../core/connector-pixel")>()),
	runConnectorPixel: mocks.run,
}));
vi.mock("../core/use-connector-saver", () => ({
	useConnectorSaver: () => ({
		saveLabel: "Save",
		isBusy: () => false,
		save: vi.fn(),
	}),
}));

let root: Root;
let container: HTMLDivElement;
const scrollIntoView = HTMLElement.prototype.scrollIntoView;

/** A host publishes the received controls into state, as workbench chrome does. */
function ControlHost(props: MailboxViewProps) {
	const [controls, setControls] = useState<MailboxViewControls>();
	const receiveControls = useCallback((next: MailboxViewControls) => {
		mocks.publish(next);
		setControls(next);
	}, []);
	return (
		<>
			<MailboxView {...props} onControls={receiveControls} />
			<button type="button" onClick={() => controls?.refresh()}>
				Host refresh
			</button>
			<output aria-label="Host refresh state">
				{controls?.isRefreshing ? "busy" : "ready"}
			</output>
		</>
	);
}

function currentControls(): MailboxViewControls {
	const value = mocks.publish.mock.lastCall?.[0] as
		| MailboxViewControls
		| undefined;
	if (!value) throw new Error("No published mailbox controls");
	return value;
}

async function render(props: Partial<MailboxViewProps> = {}) {
	await act(async () =>
		root.render(<ControlHost provider="microsoft" {...props} />),
	);
}

function button(label: string): HTMLButtonElement {
	const element = Array.from(container.querySelectorAll("button")).find(
		(candidate) =>
			candidate.textContent === label ||
			candidate.getAttribute("aria-label") === label,
	);
	if (!element) throw new Error(`Button missing: ${label}`);
	return element;
}

async function click(label: string) {
	await act(async () => button(label).click());
}

async function key(element: HTMLElement, value: string) {
	await act(async () =>
		element.dispatchEvent(
			new KeyboardEvent("keydown", { key: value, bubbles: true }),
		),
	);
}

function page(offset: number) {
	return {
		count: 25,
		messages: [{ id: `message-${offset}`, subject: `Subject ${offset}` }],
		hasMore: offset === 0,
	};
}

function deferred() {
	let resolve: (result: unknown) => void = () => undefined;
	const promise = new Promise<unknown>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

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
	HTMLElement.prototype.scrollIntoView = vi.fn();
	vi.useFakeTimers();
	mocks.publish.mockReset();
	mocks.run
		.mockReset()
		.mockImplementation(async (pixel: string) =>
			pixel.includes("ListMailFolders")
				? { folders: [{ id: "archive", name: "Archive" }] }
				: page(pixel.includes("offset=[25]") ? 25 : 0),
		);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	HTMLElement.prototype.scrollIntoView = scrollIntoView;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

it.each([
	["microsoft", "Outlook", "https://outlook.office.com/mail/"],
	["google", "Gmail", "https://mail.google.com/mail/"],
] as const)(
	"publishes %s mailbox controls without feeding host rerenders back into itself",
	async (provider, appName, mailboxUrl) => {
		await render({ provider });
		expect(currentControls()).toMatchObject({
			provider,
			appName,
			mailboxUrl,
			isRefreshing: false,
		});
		const controls = currentControls();
		const publications = mocks.publish.mock.calls.length;
		const reads = mocks.run.mock.calls.length;
		await render({ provider, showHeader: false });
		expect(mocks.publish).toHaveBeenCalledTimes(publications);
		expect(mocks.run).toHaveBeenCalledTimes(reads);
		expect(currentControls().refresh).toBe(controls.refresh);
	},
);

it("publishes live loading, manual-refresh, and appended-page state", async () => {
	const initial = deferred();
	mocks.run.mockImplementation((pixel: string) =>
		pixel.includes("ListMailFolders")
			? Promise.resolve({ folders: [] })
			: initial.promise,
	);
	await render();
	expect(currentControls().isRefreshing).toBe(true);
	await act(async () => initial.resolve(page(0)));
	expect(currentControls().isRefreshing).toBe(false);
	const refresh = currentControls().refresh;
	const reload = deferred();
	mocks.run.mockReturnValueOnce(reload.promise);
	await click("Host refresh");
	expect(currentControls().isRefreshing).toBe(true);
	expect(currentControls().refresh).toBe(refresh);
	await act(async () => reload.resolve(page(0)));
	expect(currentControls().isRefreshing).toBe(false);
	const append = deferred();
	mocks.run.mockReturnValueOnce(append.promise);
	await click("common.showMore");
	expect(currentControls().isRefreshing).toBe(true);
	await act(async () => append.resolve(page(25)));
	expect(currentControls().isRefreshing).toBe(false);
	expect(currentControls().refresh).toBe(refresh);
});

it("refreshes the current folder and filters from page zero after loading more", async () => {
	await render();
	await key(button("mail.folder"), "ArrowDown");
	const archive = Array.from(
		document.querySelectorAll<HTMLElement>('[role="option"]'),
	).find((element) => element.textContent === "Archive");
	if (!archive) throw new Error("Archive option missing");
	await key(archive, "Enter");
	await click("mail.unreadOnly");
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
	});
	await act(async () => vi.advanceTimersByTime(350));
	await click("common.showMore");
	expect(container.querySelectorAll("button[data-item-key]")).toHaveLength(2);
	const refresh = currentControls().refresh;
	await click("Host refresh");
	const lastRead = mocks.run.mock.lastCall?.[0];
	expect(lastRead).toContain('folder=["archive"]');
	expect(lastRead).toContain("unreadOnly=[true]");
	expect(lastRead).toContain('subject=["<encode>Budget</encode>"]');
	expect(lastRead).toContain("offset=[0]");
	expect(container.querySelectorAll("button[data-item-key]")).toHaveLength(1);
	expect(input.value).toBe("Budget");
	expect(button("mail.folder").textContent).toBe("Archive");
	expect(button("mail.unreadOnly").getAttribute("aria-pressed")).toBe("true");
	expect(currentControls().refresh).toBe(refresh);
	await click("common.showMore");
	expect(mocks.run.mock.lastCall?.[0]).toContain("offset=[25]");
});

it.each(["full", "compact"] as const)(
	"keeps %s Refresh visible by default and lets the host replace only that action",
	async (presentation) => {
		await render({ presentation });
		expect(button("common.refresh")).toBeTruthy();
		await render({ presentation, showRefresh: false });
		expect(
			container.querySelector('button[aria-label="common.refresh"]'),
		).toBeNull();
		expect(container.querySelector('[role="combobox"]')).toBeTruthy();
		const reads = mocks.run.mock.calls.length;
		await click("Host refresh");
		expect(mocks.run).toHaveBeenCalledTimes(reads + 1);
		await render({ presentation });
		expect(button("common.refresh")).toBeTruthy();
	},
);
