import { expect, test, vi } from "vitest";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels";
import { RoomStore } from "./room.store";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

const createRoom = (allowedFileTypes?: string[]) =>
	new RoomStore({
		theme: { allowedFileTypes } as ThemeMap["playground"],
		roomId: "attachment-policy-test",
		insightId: "insight-test",
		panelComponents: ROOM_PANEL_COMPONENTS,
	});

test("without a theme policy, only the default allowed extensions are accepted", () => {
	const room = createRoom();

	expect(room.acceptsAttachment("report.pdf")).toBe(true);
	expect(room.acceptsAttachment("photo.PNG")).toBe(true);
	expect(room.acceptsAttachment("notes.docx")).toBe(true);
	expect(room.acceptsAttachment("installer.exe")).toBe(false);
	expect(room.acceptsAttachment("script.sh")).toBe(false);
	expect(room.acceptsAttachment("archive.zip")).toBe(false);
	expect(room.acceptsAttachment("no-extension")).toBe(false);
});

test("an empty theme policy also falls back to the default allowed extensions", () => {
	const room = createRoom([]);

	expect(room.acceptsAttachment("report.pdf")).toBe(true);
	expect(room.acceptsAttachment("installer.exe")).toBe(false);
});

test("a configured theme policy fully replaces the default list, not extends it", () => {
	const room = createRoom(["pdf"]);

	expect(room.acceptsAttachment("report.pdf")).toBe(true);
	// png is in the default list, but the theme policy only allows pdf
	expect(room.acceptsAttachment("photo.png")).toBe(false);
	expect(room.acceptsAttachment("deck.pptx")).toBe(false);
});

test("extension matching ignores case and a leading dot in the theme policy", () => {
	const room = createRoom([".PDF", "pptx", "csv"]);

	expect(room.acceptsAttachment("deck.PPTX")).toBe(true);
	expect(room.acceptsAttachment("report.pdf")).toBe(true);
	expect(room.acceptsAttachment("data.CSV")).toBe(true);
	expect(room.acceptsAttachment("notes.docx")).toBe(false);
});
