import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import strings from "../../../i18n/src/resources/locales/en/connectors/connectors.json";
import type { ConnectorAccount } from "../core/connector.types";
import { MailboxView } from "./mailbox-view";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "room" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			key
				.split(".")
				.reduce<unknown>(
					(value, field) =>
						value && typeof value === "object" && field in value
							? (value as Record<string, unknown>)[field]
							: key,
					strings,
				),
		i18n: { language: "en", dir: () => "ltr" },
	}),
}));
vi.mock("../core/use-connector-query", () => ({
	useConnectorQuery: () => ({ data: [], status: "ready", reload: vi.fn() }),
}));
vi.mock("../core/use-connector-saver", () => ({
	useConnectorSaver: () => ({
		saveLabel: "Save",
		isBusy: () => false,
		save: vi.fn(),
	}),
}));
vi.mock("./use-mailbox-query", () => ({
	useMailboxQuery: () => ({
		data: { count: 0, messages: [], hasMore: false },
		status: "ready",
		error: null,
		loadMoreError: null,
		isRefreshing: false,
		reload: vi.fn(),
		loadMore: vi.fn(),
	}),
}));

let root: Root;
let container: HTMLDivElement;

async function render(provider: ConnectorAccount) {
	await act(async () => root.render(<MailboxView provider={provider} />));
}

function input(): HTMLInputElement {
	const element = container.querySelector<HTMLInputElement>(
		'input[type="search"]',
	);
	if (!element) throw new Error("Search field missing");
	return element;
}

async function search(value: string) {
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set?.call(input(), value);
		input().dispatchEvent(new Event("input", { bubbles: true }));
	});
	await act(async () => vi.advanceTimersByTime(350));
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
	vi.useFakeTimers();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

it("describes Outlook's search ceiling only while a search is active", async () => {
	await render("microsoft");
	expect(container.textContent).not.toContain(
		strings.mail.outlookSearchLimit,
	);
	await search("Budget");
	expect(container.textContent).toContain(strings.mail.outlookSearchLimit);
	const hintId = input().getAttribute("aria-describedby");
	expect(hintId).toBeTruthy();
	expect(hintId && document.getElementById(hintId)?.textContent).toBe(
		strings.mail.outlookSearchLimit,
	);
	await search("");
	expect(container.textContent).not.toContain(
		strings.mail.outlookSearchLimit,
	);
	expect(input().getAttribute("aria-describedby")).toBeNull();
});

it("does not show Outlook's limit for Gmail search", async () => {
	await render("google");
	await search("Budget");
	expect(container.textContent).not.toContain(
		strings.mail.outlookSearchLimit,
	);
	expect(input().getAttribute("aria-describedby")).toBeNull();
});
