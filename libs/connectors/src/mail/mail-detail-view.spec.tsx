import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConnectorAccount } from "../core/connector.types";
import type { ConnectorSaveSource } from "../core/connector-files";
import { parseMailPage } from "./mail.parsers";
import { groupMailByConversation } from "./mail.threads";
import { MailDetailView, type MailDetailViewProps } from "./mail-detail-view";
import type { MailItemSelection } from "./mail-item-selection";

const mocks = vi.hoisted(() => ({
	query: vi.fn(),
	run: vi.fn(),
	saveFile: vi.fn(),
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
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: mocks.query,
}));
vi.mock("../core/connector-pixel", async (importOriginal) => ({
	...(await importOriginal<typeof import("../core/connector-pixel")>()),
	runConnectorPixel: mocks.run,
}));
vi.mock("../core/connector-files", async (importOriginal) => ({
	...(await importOriginal<typeof import("../core/connector-files")>()),
	saveToInsight: mocks.saveFile,
}));

const messages = [
	{
		id: "first",
		conversationId: "thread-one",
		subject: "Budget",
		fromName: "Alex",
		receivedDate: "2026-10-06T10:00:00Z",
		body: "First message body",
	},
	{
		id: "latest",
		conversationId: "thread-one",
		subject: "Re: Budget",
		fromName: "Sam",
		receivedDate: "2026-10-07T10:00:00Z",
		body: "Latest message body",
		hasAttachments: true,
		attachments: [{ id: "attachment", name: "budget.pdf", kind: "file" }],
	},
];
let root: Root;
let container: HTMLDivElement;
let savedContent: string;

function selection(kind: "thread" | "message" = "thread"): MailItemSelection {
	const summary = groupMailByConversation(
		parseMailPage({ messages }).messages,
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

async function render(props: Partial<MailDetailViewProps> = {}) {
	await act(async () =>
		root.render(
			<MailDetailView
				provider="microsoft"
				selection={selection()}
				{...props}
			/>,
		),
	);
}

function button(label: string): HTMLButtonElement {
	const found = Array.from(container.querySelectorAll("button")).find(
		(element) =>
			element.textContent === label ||
			element.getAttribute("aria-label") === label,
	);
	if (!found) throw new Error(`Missing button: ${label}`);
	return found;
}

async function click(label: string) {
	await act(async () => button(label).click());
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
	mocks.query
		.mockReset()
		.mockImplementation(
			(pixel: string | null, parse: (raw: unknown) => unknown) => ({
				data: pixel
					? parse(
							pixel.includes("ListMail")
								? { messages }
								: messages[1],
						)
					: null,
				status: "ready",
				reload: vi.fn(),
			}),
		);
	mocks.run.mockReset().mockResolvedValue({ messages });
	savedContent = "";
	mocks.saveFile
		.mockReset()
		.mockImplementation(
			async (
				_insight: string,
				service: string,
				source: ConnectorSaveSource,
			) => {
				if (source.kind === "text")
					savedContent = await source.getContent();
				return {
					path: source.fileName,
					name: source.fileName,
					service,
				};
			},
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
	["microsoft", "MicrosoftOutlook", "outlook-mail"],
	["google", "GoogleGmail", "gmail"],
] as const)(
	"opens and saves the selected %s thread through the host lifecycle",
	async (provider: ConnectorAccount, prefix: string, service: string) => {
		const lifecycle: string[] = [];
		const onSaved = vi.fn(async () => {
			lifecycle.push("saved");
		});
		const onAddToContext = vi.fn(async () => {
			lifecycle.push("context");
		});
		const prepareSave = vi.fn(async () => {
			lifecycle.push("prepare");
			return () => {
				lifecycle.push("release");
			};
		});
		await render({
			provider,
			saveTargetName: "Chat files",
			prepareSave,
			onSaved,
			onAddToContext,
		});
		expect(mocks.query).toHaveBeenCalledWith(
			expect.stringContaining(`${prefix}ListMail(conversationId=`),
			expect.any(Function),
		);
		await click("actions.saveTo Chat files");
		expect(savedContent).toContain("First message body");
		expect(savedContent).toContain("Latest message body");
		expect(savedContent.indexOf("First message body")).toBeLessThan(
			savedContent.indexOf("Latest message body"),
		);
		expect(mocks.saveFile).toHaveBeenLastCalledWith(
			"room",
			service,
			expect.objectContaining({ kind: "text" }),
		);
		expect(lifecycle).toEqual(["prepare", "saved", "release"]);
		await click("actions.addToContext");
		expect(lifecycle).toEqual([
			"prepare",
			"saved",
			"release",
			"prepare",
			"context",
			"release",
		]);
		expect(onSaved).toHaveBeenCalledTimes(1);
		expect(onAddToContext).toHaveBeenCalledTimes(1);
	},
);

it("reads an ungrouped row as a message but still saves its whole conversation", async () => {
	await render({ selection: selection("message"), onSaved: vi.fn() });
	expect(mocks.query).toHaveBeenCalledWith(
		expect.stringContaining('MicrosoftOutlookGetMail(id=["latest"]'),
		expect.any(Function),
	);
	expect(container.textContent).toContain("Latest message body");
	expect(container.textContent).not.toContain("First message body");
	await click("actions.save");
	expect(mocks.run).toHaveBeenCalledWith(
		expect.stringContaining(
			'MicrosoftOutlookListMail(conversationId=["thread-one"]',
		),
		"room",
	);
	expect(savedContent).toContain("First message body");
	expect(savedContent).toContain("Latest message body");
});

it("saves an attachment through the same host and routes Back to its browser", async () => {
	const onBack = vi.fn();
	const onAddToContext = vi.fn();
	await render({ selection: selection("message"), onBack, onAddToContext });
	expect(document.activeElement).toBe(container.querySelector("h4"));
	await click("actions.addNamedToContext budget.pdf");
	const source = mocks.saveFile.mock.calls[0]?.[2] as
		| ConnectorSaveSource
		| undefined;
	expect(source?.kind).toBe("download");
	if (source?.kind !== "download") throw new Error("Attachment save missing");
	expect(source.buildPixel("budget.pdf")).toContain('id=["latest"]');
	expect(source.buildPixel("budget.pdf")).toContain(
		'attachmentId=["attachment"]',
	);
	expect(onAddToContext).toHaveBeenCalledWith({
		path: "budget.pdf",
		name: "budget.pdf",
		service: "outlook-mail",
	});
	await click("mail.backTo Inbox");
	expect(onBack).toHaveBeenCalledTimes(1);
});
