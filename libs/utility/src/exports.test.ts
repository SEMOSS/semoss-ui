import { expect, it } from "vitest";
import * as utility from "@semoss/utility";
import * as date from "@semoss/utility/date";
import * as encoding from "@semoss/utility/encoding";
import * as file from "@semoss/utility/file";
import { getFileExtension as legacyExtension } from "@semoss/utility/file-extension";
import * as json from "@semoss/utility/json";
import * as markdown from "@semoss/utility/markdown";
import * as object from "@semoss/utility/object";
import * as string from "@semoss/utility/string";
import * as text from "@semoss/utility/text";
import { validateIdentifier } from "./identifier";

it("exports the canonical helper names through their categories and root", () => {
	expect(utility).toMatchObject({
		deepCopy: object.deepCopy,
		formatTextByteSize: text.formatTextByteSize,
		readNonBlankString: text.readNonBlankString,
		stripAnsiStyleCodes: text.stripAnsiStyleCodes,
		formatUnderscoreLabel: text.formatUnderscoreLabel,
		metadataKeyToLabel: text.metadataKeyToLabel,
		sanitizeFileNameStem: file.sanitizeFileNameStem,
		formatRoundedDurationMs: date.formatRoundedDurationMs,
		formatDateTimeWithRelativeDay: date.formatDateTimeWithRelativeDay,
		formatLocalDateTime: date.formatLocalDateTime,
		parseTimestampWithUtcDefault: date.parseTimestampWithUtcDefault,
		formatLocalDateKey: date.formatLocalDateKey,
		formatLocalWallClock: date.formatLocalWallClock,
		parseLocalWallClock: date.parseLocalWallClock,
		encodeBytesToBase64: encoding.encodeBytesToBase64,
		encodeTextToBase64: encoding.encodeTextToBase64,
		decodeBase64ToBytes: encoding.decodeBase64ToBytes,
	});
	const removedNames = [
		"copy",
		"formatBytes",
		"readNonEmptyString",
		"stripAnsi",
		"removeUnderscores",
		"metakeyToLabel",
		"slugifyFileName",
		"parseDuration",
		"formatDate",
		"formatDateToLocal",
		"formatDateTime",
		"normalizeTimestamp",
		"calendarDayKey",
		"toWallClockString",
		"parseWallClock",
		"encodeBase64",
		"encodeBase64Asset",
		"encodeBase64Text",
		"decodeBase64",
	];
	for (const exports of [
		utility,
		date,
		encoding,
		file,
		json,
		markdown,
		object,
		string,
		text,
	]) {
		for (const name of removedNames) {
			expect(Object.hasOwn(exports, name), name).toBe(false);
		}
	}
});

it("retains unaffected exports, including the helpers Renderer imports", () => {
	expect(legacyExtension).toBe(file.getFileExtension);
	expect(markdown.countLines).toBe(text.countLines);
	expect(string.buildInitials).toBe(text.buildInitials);
	expect(string.validateIdentifier).toBe(validateIdentifier);
	expect(utility.buildInitials).toBe(text.buildInitials);
	expect(utility.isOutputJSON).toBe(json.isOutputJSON);
	expect(utility.splitAtPeriod).toBe(text.splitAtPeriod);
	expect(utility.capitalizeFirstLetter).toBe(text.capitalizeFirstLetter);
});

it("imports the public root and browser helpers without a DOM", () => {
	expect(typeof document).toBe("undefined");
	expect(utility.downloadBlob).toBeTypeOf("function");
	expect(utility.setFavicon).toBeTypeOf("function");
	expect(utility.copyTextToClipboard).toBeTypeOf("function");
});
