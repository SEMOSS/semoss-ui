import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConnectorViewerProps } from "./connector.types";
import { saveToInsight } from "./connector-files";
import {
	type ConnectorSaveRequest,
	type ConnectorSaver,
	useConnectorSaver,
} from "./use-connector-saver";

const mocks = vi.hoisted(() => ({
	insightId: "origin",
	error: vi.fn(),
	success: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: mocks.insightId }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/ui/next", () => ({
	toast: { error: mocks.error, success: mocks.success },
}));
vi.mock("./connector-files", () => ({ saveToInsight: vi.fn() }));
const save = vi.mocked(saveToInsight);
const file = {
	path: "mail.md",
	name: "mail.md",
	service: "outlook-mail" as const,
};
const request: ConnectorSaveRequest = {
	key: "mail",
	name: "Mail",
	source: { kind: "text", fileName: "mail.md", getContent: () => "text" },
};
let saver: ConnectorSaver | undefined;
let root: Root;
let container: HTMLDivElement;
let isUnmounted: boolean;
const Harness = ({ host }: { host: ConnectorViewerProps }) => {
	saver = useConnectorSaver("outlook-mail", host);
	return null;
};
const current = (): ConnectorSaver => {
	if (!saver) throw new Error("Hook has not rendered");
	return saver;
};
const render = async (host: ConnectorViewerProps) => {
	await act(async () => root.render(<Harness host={host} />));
};
const deferred = <T,>() => {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((onResolve) => {
		resolve = onResolve;
	});
	return { promise, resolve };
};
beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.clearAllMocks();
	save.mockReset().mockResolvedValue(file);
	mocks.insightId = "origin";
	container = document.createElement("div");
	root = createRoot(container);
	isUnmounted = false;
});
afterEach(async () => {
	if (!isUnmounted) await act(async () => root.unmount());
	vi.unstubAllGlobals();
});

it("prepares once before saving and releases after the originating callback", async () => {
	const preparing = deferred<() => void>();
	const order: string[] = [];
	const release = vi.fn(() => {
		order.push("release");
	});
	const prepareSave = vi.fn(() => preparing.promise);
	const onSaved = vi.fn(() => {
		order.push("saved");
	});
	await render({ prepareSave, onSaved });
	await act(async () => {
		current().save(request);
		current().save(request);
	});
	expect(prepareSave).toHaveBeenCalledOnce();
	expect(save).not.toHaveBeenCalled();
	expect(current().isBusy("mail")).toBe(true);
	await act(async () => preparing.resolve(release));
	expect(save).toHaveBeenCalledWith("origin", "outlook-mail", request.source);
	expect(onSaved).toHaveBeenCalledWith(file);
	expect(order).toEqual(["saved", "release"]);
	expect(current().isBusy("mail")).toBe(false);
});

it.each(["save", "callback"])(
	"releases when %s fails and allows retry",
	async (failure) => {
		const release = vi.fn();
		const onSaved = vi.fn(() => {
			if (failure === "callback") throw new Error("callback failed");
		});
		if (failure === "save")
			save.mockRejectedValueOnce(new Error("save failed"));
		await render({ prepareSave: async () => release, onSaved });
		await act(async () => current().save(request));
		expect(release).toHaveBeenCalledOnce();
		expect(mocks.error).toHaveBeenCalledOnce();
		expect(current().isBusy("mail")).toBe(false);
		await act(async () => current().save(request));
		expect(release).toHaveBeenCalledTimes(2);
	},
);

it("does not save after preparation fails", async () => {
	await render({
		prepareSave: async () => {
			throw new Error("cannot prepare");
		},
	});
	await act(async () => current().save(request));
	expect(save).not.toHaveBeenCalled();
	expect(mocks.error).toHaveBeenCalledOnce();
	expect(current().isBusy("mail")).toBe(false);
});

it("finishes against the origin after navigation and unmount", async () => {
	const preparing = deferred<() => void>();
	const release = vi.fn();
	const onAddToContext = vi.fn();
	const nextCallback = vi.fn();
	await render({ prepareSave: () => preparing.promise, onAddToContext });
	await act(async () => current().addToContext?.(request));
	mocks.insightId = "next";
	await render({ onAddToContext: nextCallback });
	await act(async () => root.unmount());
	isUnmounted = true;
	await act(async () => preparing.resolve(release));
	expect(save).toHaveBeenCalledWith("origin", "outlook-mail", request.source);
	expect(onAddToContext).toHaveBeenCalledWith(file);
	expect(nextCallback).not.toHaveBeenCalled();
	expect(release).toHaveBeenCalledOnce();
});

it("preserves saves when preparation is omitted or returns void", async () => {
	await render({ prepareSave: async () => undefined });
	await act(async () => current().save(request));
	await render({});
	await act(async () => current().save(request));
	expect(save).toHaveBeenCalledTimes(2);
});
