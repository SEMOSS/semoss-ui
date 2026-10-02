import { expect, it } from "vitest";
import * as utility from "@semoss/utility";
import { getFileExtension } from "@semoss/utility/file";
import { getFileExtension as legacyExtension } from "@semoss/utility/file-extension";
import { copy as legacyCopy } from "@semoss/utility/json";
import {
	formatBytes as legacyBytes,
	countLines as legacyLines,
} from "@semoss/utility/markdown";
import { copy } from "@semoss/utility/object";
import {
	buildInitials as legacyInitials,
	validateIdentifier as legacyValidation,
} from "@semoss/utility/string";
import { buildInitials, countLines, formatBytes } from "@semoss/utility/text";
import { validateIdentifier } from "./identifier";

it("keeps legacy exports identical to the defining implementations", () => {
	expect(legacyCopy).toBe(copy);
	expect(legacyExtension).toBe(getFileExtension);
	expect(legacyLines).toBe(countLines);
	expect(legacyBytes).toBe(formatBytes);
	expect(legacyInitials).toBe(buildInitials);
	expect(legacyValidation).toBe(validateIdentifier);
	expect(utility.copy).toBe(copy);
	expect(utility.buildInitials).toBe(buildInitials);
});

it("imports the public root and browser helpers without a DOM", () => {
	expect(typeof document).toBe("undefined");
	expect(utility.downloadBlob).toBeTypeOf("function");
	expect(utility.setFavicon).toBeTypeOf("function");
	expect(utility.copyTextToClipboard).toBeTypeOf("function");
});
