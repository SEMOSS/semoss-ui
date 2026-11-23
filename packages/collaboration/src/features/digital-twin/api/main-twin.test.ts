import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { saveMainTwin } from "./main-twin";

/** The picture a file decodes to; its size is all a test needs of it. */
let decoded: { width: number; height: number; close: () => void };
const drawImage = vi.fn();
const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL");

/** What the server answers a save with; an Error is a refusal. */
let answer: unknown;
const run = vi.fn(async (_pixel: string) => {
	if (answer instanceof Error) throw answer;
	return { pixelReturn: [{ output: answer, operationType: ["OPERATION"] }] };
});
const actions = { run } as unknown as InsightActions;
const file = new File(["picture"], "me.png", { type: "image/png" });

beforeEach(() => {
	answer = { name: "Robin's Digital Twin" };
	run.mockClear();
	drawImage.mockClear();
	decoded = { width: 800, height: 400, close: vi.fn() };
	vi.stubGlobal(
		"createImageBitmap",
		vi.fn(async () => decoded),
	);
	// jsdom draws nothing: the picture "drawn" is its own size, so a test reads what was sent
	getContext.mockImplementation(
		() => ({ drawImage }) as unknown as CanvasRenderingContext2D,
	);
	toDataURL.mockImplementation(function (this: HTMLCanvasElement) {
		return `data:image/png;base64,${this.width}x${this.height}`;
	});
});
afterEach(() => {
	vi.unstubAllGlobals();
});

it("sends only what was changed, as one call kept out of the insight's list of calls", async () => {
	await saveMainTwin(actions, { name: "Rob" });
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(name=["Rob"]);',
	);
	// an empty name goes back to the default, and an empty picture to the Microsoft photo
	await saveMainTwin(actions, { name: "" });
	expect(run).toHaveBeenLastCalledWith('META | WorkSaveMainTwin(name=[""]);');
	await saveMainTwin(actions, { image: "" });
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(image=[""]);',
	);
	await saveMainTwin(actions, { name: "Rob", image: "" });
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(name=["Rob"], image=[""]);',
	);
	// a name is data, never pixel
	await saveMainTwin(actions, { name: 'Rob"]); DeleteAll(' });
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(name=["Rob\\"]); DeleteAll("]);',
	);
});

it("draws a picture no larger than the server keeps it, and sends it bare", async () => {
	await saveMainTwin(actions, { image: file });
	expect(createImageBitmap).toHaveBeenCalledExactlyOnceWith(file);
	expect(drawImage).toHaveBeenCalledExactlyOnceWith(decoded, 0, 0, 192, 96);
	// no address prefix: the server takes the base64 alone
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(image=["192x96"]);',
	);
	expect(decoded.close).toHaveBeenCalledOnce();

	// the longer side is the one held to 192, whichever it is
	decoded = { width: 400, height: 800, close: vi.fn() };
	await saveMainTwin(actions, { name: "Rob", image: file });
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(name=["Rob"], image=["96x192"]);',
	);
});

it("never enlarges a small picture, and never draws one with no height", async () => {
	decoded = { width: 100, height: 50, close: vi.fn() };
	await saveMainTwin(actions, { image: file });
	expect(drawImage).toHaveBeenLastCalledWith(decoded, 0, 0, 100, 50);
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(image=["100x50"]);',
	);
	decoded = { width: 2000, height: 2, close: vi.fn() };
	await saveMainTwin(actions, { image: file });
	expect(run).toHaveBeenLastCalledWith(
		'META | WorkSaveMainTwin(image=["192x1"]);',
	);
});

it("says a file that is not a picture could not be read, and sends nothing", async () => {
	vi.stubGlobal(
		"createImageBitmap",
		vi
			.fn()
			.mockRejectedValue(
				new Error("The source image could not be decoded."),
			),
	);
	await expect(saveMainTwin(actions, { image: file })).rejects.toThrow(
		"That picture could not be read. Choose another one.",
	);
	// a browser that gives no canvas cannot draw it either, and the decoded picture is still let go
	vi.stubGlobal(
		"createImageBitmap",
		vi.fn(async () => decoded),
	);
	getContext.mockReturnValue(null);
	await expect(saveMainTwin(actions, { image: file })).rejects.toThrow(
		"That picture could not be read. Choose another one.",
	);
	expect(decoded.close).toHaveBeenCalledOnce();
	expect(run).not.toHaveBeenCalled();
});

it("never sends an empty picture for one that could not be encoded, which would remove the one that is kept", async () => {
	// what a browser answers for a canvas it could not encode
	toDataURL.mockReturnValue("data:,");
	await expect(saveMainTwin(actions, { image: file })).rejects.toThrow(
		"That picture could not be read. Choose another one.",
	);
	expect(run).not.toHaveBeenCalled();
	expect(decoded.close).toHaveBeenCalledOnce();
});

it("answers the twin as the server now holds it, and fails on a refusal or an answer it cannot read", async () => {
	answer = { name: "Rob", image: "AAAA" };
	await expect(saveMainTwin(actions, { name: "Rob" })).resolves.toEqual({
		name: "Rob",
		image: "AAAA",
	});
	answer = { name: "Robin's Digital Twin" };
	await expect(saveMainTwin(actions, { name: "" })).resolves.toEqual({
		name: "Robin's Digital Twin",
	});
	answer = new Error("That picture is too large. Choose a smaller one.");
	await expect(saveMainTwin(actions, { image: file })).rejects.toThrow(
		"That picture is too large. Choose a smaller one.",
	);
	answer = { image: "AAAA" };
	await expect(saveMainTwin(actions, { name: "Rob" })).rejects.toThrow(
		/unexpected shape/,
	);
});
