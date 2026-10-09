import { act, useCallback, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { parseMailPage } from "./mail.parsers";
import { groupMailByConversation } from "./mail.threads";
import {
	MailDetailView,
	type MailDetailViewControls,
	type MailDetailViewProps,
} from "./mail-detail-view";
import type { MailItemSelection } from "./mail-item-selection";

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
		addToContext: vi.fn(),
	}),
}));

const outlookUrl = "https://outlook.office.com/mail/id/latest";
const gmailUrl = "https://mail.google.com/mail/u/0/#inbox/thread-one";
const summaryUrl = "https://outlook.office.com/mail/id/stale-summary";
const latest = {
	id: "latest",
	conversationId: "thread-one",
	subject: "Re: Budget",
	fromName: "Sam",
	receivedDate: "2026-10-07T10:00:00Z",
	body: "Latest message body",
	webLink: outlookUrl,
};

let root: Root;
let container: HTMLDivElement;

function selection(kind: "message" | "thread" = "message"): MailItemSelection {
	const summary = groupMailByConversation(
		parseMailPage({
			messages: [{ ...latest, webLink: summaryUrl }],
		}).messages,
	)[0];
	if (!summary) throw new Error("Mail summary missing");
	return {
		kind,
		id: kind === "thread" ? "thread-one" : "latest",
		title: "Budget",
		itemKey:
			kind === "thread" ? "conversation:thread-one" : "message:latest",
		folderName: "Inbox",
		summary,
	};
}

function threadPage(webLink: string | undefined = outlookUrl) {
	return {
		messages: [
			{ ...latest, webLink },
			{
				...latest,
				id: "unrelated",
				conversationId: "another-thread",
				receivedDate: "2026-10-08T10:00:00Z",
				webLink: "https://outlook.office.com/mail/id/unrelated",
			},
			{
				...latest,
				id: "first",
				receivedDate: "2026-10-06T10:00:00Z",
				webLink: "https://outlook.office.com/mail/id/first",
			},
		],
	};
}

/** Exercises the state feedback from publishing controls into a real host. */
function ControlHost(props: MailDetailViewProps) {
	const [controls, setControls] = useState<MailDetailViewControls>();
	const receiveControls = useCallback((next: MailDetailViewControls) => {
		mocks.publish(next);
		setControls(next);
	}, []);
	return (
		<>
			<MailDetailView {...props} onControls={receiveControls} />
			<output aria-label="Host item link">{controls?.webUrl}</output>
		</>
	);
}

function currentControls(): MailDetailViewControls {
	const value = mocks.publish.mock.lastCall?.[0] as
		| MailDetailViewControls
		| undefined;
	if (!value) throw new Error("No published mail detail controls");
	return value;
}

async function render(props: Partial<MailDetailViewProps> = {}) {
	await act(async () =>
		root.render(
			<ControlHost
				provider="microsoft"
				selection={selection()}
				{...props}
			/>,
		),
	);
}

function deferred() {
	let resolve: (result: unknown) => void = () => undefined;
	let reject: (error: Error) => void = () => undefined;
	const promise = new Promise<unknown>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
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
	mocks.publish.mockReset();
	mocks.run
		.mockReset()
		.mockImplementation(async (pixel: string) =>
			pixel.includes("ListMail") ? threadPage() : latest,
		);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it.each([
	["microsoft", "Outlook", outlookUrl, "message"],
	["google", "Gmail", gmailUrl, "message"],
	["microsoft", "Outlook", outlookUrl, "thread"],
	["google", "Gmail", gmailUrl, "thread"],
] as const)(
	"publishes loaded %s %s link metadata for a %s %s without host feedback or extra reads",
	async (provider, appName, webUrl, kind) => {
		mocks.run.mockResolvedValue(
			kind === "thread"
				? threadPage(webUrl)
				: { ...latest, webLink: webUrl },
		);
		const selected = selection(kind);
		await render({ provider, selection: selected });
		expect(currentControls()).toEqual({
			provider,
			kind,
			itemId: selected.id,
			webUrl,
			appName,
		});
		expect(mocks.publish.mock.calls[0]?.[0].webUrl).toBeUndefined();
		expect(mocks.publish).toHaveBeenCalledTimes(2);
		expect(mocks.run).toHaveBeenCalledTimes(1);
		await render({
			provider,
			selection: { ...selected },
			showOpenIn: false,
		});
		expect(mocks.publish).toHaveBeenCalledTimes(2);
		expect(mocks.run).toHaveBeenCalledTimes(1);
	},
);

it.each(["message", "thread"] as const)(
	"clears a %s link when its selection changes and keeps it absent on failure",
	async (kind) => {
		const initial = deferred();
		mocks.run.mockReturnValueOnce(initial.promise);
		await render({ selection: selection(kind) });
		expect(currentControls().webUrl).toBeUndefined();
		await act(async () =>
			initial.resolve(kind === "thread" ? threadPage() : latest),
		);
		expect(currentControls().webUrl).toBe(outlookUrl);
		const next = deferred();
		mocks.run.mockReturnValueOnce(next.promise);
		await render({
			selection: {
				...selection(kind),
				id: "next",
				itemKey: `${kind}:next`,
			},
		});
		expect(currentControls()).toMatchObject({
			kind,
			itemId: "next",
			webUrl: undefined,
		});
		expect(container.querySelector("output")?.textContent).toBe("");
		await act(async () => next.reject(new Error("Read failed")));
		expect(currentControls().webUrl).toBeUndefined();
		expect(container.querySelector("a")).toBeNull();
	},
);

it("clears the previous provider's link before loading the same item ID elsewhere", async () => {
	await render();
	const next = deferred();
	mocks.run.mockReturnValueOnce(next.promise);
	await render({ provider: "google" });
	expect(currentControls()).toEqual({
		provider: "google",
		kind: "message",
		itemId: "latest",
		appName: "Gmail",
		webUrl: undefined,
	});
	await act(async () => next.resolve({ ...latest, webLink: gmailUrl }));
	expect(currentControls().webUrl).toBe(gmailUrl);
	expect(mocks.run).toHaveBeenCalledTimes(2);
});

it.each(["message", "thread"] as const)(
	"does not substitute a summary, older message, or homepage when the loaded %s has no link",
	async (kind) => {
		const response = threadPage();
		response.messages[0].webLink = undefined;
		mocks.run.mockResolvedValue(
			kind === "thread" ? response : { ...latest, webLink: undefined },
		);
		await render({ selection: selection(kind), showOpenIn: true });
		expect(currentControls().webUrl).toBeUndefined();
		expect(container.querySelector("a")).toBeNull();
		expect(mocks.run).toHaveBeenCalledTimes(1);
	},
);

it("publishes no destination for an empty thread", async () => {
	mocks.run.mockResolvedValue({ messages: [] });
	await render({ selection: selection("thread"), showOpenIn: true });
	expect(currentControls().webUrl).toBeUndefined();
	expect(container.textContent).toContain("mail.threadEmpty");
	expect(container.querySelector("a")).toBeNull();
});

it("does not publish a destination from a response for a different message ID", async () => {
	mocks.run.mockResolvedValue({ ...latest, id: "different-message" });
	await render();
	expect(currentControls()).toMatchObject({
		kind: "message",
		itemId: "latest",
		webUrl: undefined,
	});
});

it("keeps the standalone message Open action by default and hides only that action on request", async () => {
	await act(async () =>
		root.render(
			<MailDetailView provider="microsoft" selection={selection()} />,
		),
	);
	expect(container.querySelector("a")?.getAttribute("href")).toBe(outlookUrl);
	await render({ showOpenIn: false });
	expect(container.querySelector("a")).toBeNull();
	expect(container.textContent).toContain("Latest message body");
	expect(container.textContent).toContain("Save");
	expect(container.textContent).toContain("actions.addToContext");
	expect(currentControls().webUrl).toBe(outlookUrl);
	await render({ showOpenIn: true });
	expect(container.querySelector("a")?.getAttribute("href")).toBe(outlookUrl);
});

it("keeps thread defaults and enables its newest message link only for an explicit inline fallback", async () => {
	await render({ selection: selection("thread") });
	expect(container.querySelector("a")).toBeNull();
	await render({ selection: selection("thread"), showOpenIn: true });
	expect(container.querySelector("a")?.getAttribute("href")).toBe(outlookUrl);
	await render({ selection: selection("thread"), showOpenIn: false });
	expect(container.querySelector("a")).toBeNull();
	expect(container.textContent).toContain("Latest message body");
	expect(container.textContent).toContain("Save");
	expect(container.textContent).toContain("actions.addToContext");
	expect(currentControls().webUrl).toBe(outlookUrl);
	expect(mocks.run).toHaveBeenCalledTimes(1);
});
