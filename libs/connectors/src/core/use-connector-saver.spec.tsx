import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectorViewerProps } from "./connector.types";
import {
	type ConnectorSaveRequest,
	type ConnectorSaver,
	useConnectorSaver,
} from "./use-connector-saver";

const mocks = vi.hoisted(() => ({
	save: vi.fn(),
	success: vi.fn(),
	error: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "room-insight" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/ui/next", () => ({
	toast: { success: mocks.success, error: mocks.error },
}));
vi.mock("./connector-files", () => ({ saveToInsight: mocks.save }));

const request: ConnectorSaveRequest = {
	key: "email-one",
	name: "An email",
	source: {
		kind: "text",
		fileName: "email.md",
		getContent: async () => "Email",
	},
};
const file = { path: "email.md", name: "email.md", service: "gmail" };
let root: Root | null;
let container: HTMLDivElement;
let saver: ConnectorSaver | undefined;

function Harness(props: ConnectorViewerProps) {
	saver = useConnectorSaver("gmail", props);
	return null;
}

function current(): ConnectorSaver {
	if (!saver) throw new Error("The saver has not rendered");
	return saver;
}

async function render(
	props: ConnectorViewerProps = {},
	mode: "visible" | "hidden" = "visible",
) {
	await act(async () =>
		root?.render(
			<Activity mode={mode}>
				<Harness {...props} />
			</Activity>,
		),
	);
}

function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.clearAllMocks();
	mocks.save.mockReset().mockResolvedValue(file);
	saver = undefined;
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root?.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

describe("connector save preparation", () => {
	it.each(["save", "context"])(
		"holds preparation through the %s completion callback",
		async (intent) => {
			const preparation = deferred<() => void>();
			const completion = deferred<void>();
			const release = vi.fn();
			const prepareSave = vi.fn(() => preparation.promise);
			const onComplete = vi.fn(() => completion.promise);
			await render({
				prepareSave,
				...(intent === "context"
					? { onAddToContext: onComplete }
					: { onSaved: onComplete }),
			});
			await act(async () => {
				if (intent === "context") current().addToContext?.(request);
				else current().save(request);
				current().save(request);
			});
			expect(prepareSave).toHaveBeenCalledOnce();
			expect(current().isBusy(request.key)).toBe(true);
			expect(mocks.save).not.toHaveBeenCalled();
			await act(async () => preparation.resolve(release));
			expect(mocks.save).toHaveBeenCalledWith(
				"room-insight",
				"gmail",
				request.source,
			);
			expect(onComplete).toHaveBeenCalledWith(file);
			expect(release).not.toHaveBeenCalled();
			await act(async () => completion.resolve());
			expect(release).toHaveBeenCalledOnce();
			expect(current().isBusy(request.key)).toBe(false);
		},
	);

	it("does not write or report success after preparation fails, and allows retry", async () => {
		const prepareSave = vi
			.fn()
			.mockRejectedValueOnce(new Error("Room unavailable"))
			.mockResolvedValueOnce(undefined);
		await render({ prepareSave });
		await act(async () => current().save(request));
		expect(mocks.save).not.toHaveBeenCalled();
		expect(mocks.success).not.toHaveBeenCalled();
		expect(mocks.error).toHaveBeenCalledOnce();
		expect(current().isBusy(request.key)).toBe(false);
		await act(async () => current().save(request));
		expect(mocks.save).toHaveBeenCalledOnce();
		expect(mocks.success).toHaveBeenCalledOnce();
	});

	it.each(["save", "callback"])(
		"releases after the %s fails",
		async (failure) => {
			const release = vi.fn();
			const onSaved = vi.fn();
			if (failure === "save")
				mocks.save.mockRejectedValueOnce(new Error("Write failed"));
			else onSaved.mockRejectedValueOnce(new Error("Host failed"));
			await render({ prepareSave: async () => release, onSaved });
			await act(async () => current().save(request));
			expect(release).toHaveBeenCalledOnce();
			expect(mocks.error).toHaveBeenCalledOnce();
			expect(current().isBusy(request.key)).toBe(false);
		},
	);

	it("finishes the saved-file callback and release after unmount", async () => {
		const saved = deferred<typeof file>();
		const release = vi.fn();
		const onSaved = vi.fn();
		mocks.save.mockReturnValueOnce(saved.promise);
		await render({ prepareSave: async () => release, onSaved });
		await act(async () => current().save(request));
		await act(async () => root?.unmount());
		root = null;
		await act(async () => saved.resolve(file));
		expect(onSaved).toHaveBeenCalledWith(file);
		expect(release).toHaveBeenCalledOnce();
	});

	it("keeps existing hosts working without a preparation hook", async () => {
		await render();
		await act(async () => current().save(request));
		expect(mocks.save).toHaveBeenCalledOnce();
		expect(mocks.success).toHaveBeenCalledOnce();
		expect(current().addToContext).toBeUndefined();
	});

	it("clears a save completed while Activity was hidden and allows saving again", async () => {
		const saved = deferred<typeof file>();
		const release = vi.fn();
		const onSaved = vi.fn();
		const host = { prepareSave: async () => release, onSaved };
		mocks.save.mockReturnValueOnce(saved.promise);
		await render(host);
		await act(async () => current().save(request));
		expect(current().isBusy(request.key)).toBe(true);
		await render(host, "hidden");
		await act(async () => saved.resolve(file));
		expect(onSaved).toHaveBeenCalledOnce();
		expect(release).toHaveBeenCalledOnce();
		await render(host);
		expect(current().isBusy(request.key)).toBe(false);
		await act(async () => current().save(request));
		expect(mocks.save).toHaveBeenCalledTimes(2);
		expect(onSaved).toHaveBeenCalledTimes(2);
		expect(release).toHaveBeenCalledTimes(2);
		expect(current().isBusy(request.key)).toBe(false);
	});
});
