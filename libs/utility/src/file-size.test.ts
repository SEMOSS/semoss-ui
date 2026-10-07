import { describe, expect, it } from "vitest";
import { formatByteSize } from "./file-size";

describe("formatByteSize", () => {
	it("formats byte-size boundaries", () => {
		expect(formatByteSize(512)).toBe("512 B");
		expect(formatByteSize(1024)).toBe("1.0 KB");
		expect(formatByteSize(1024 ** 2)).toBe("1.0 MB");
		expect(formatByteSize(1024 ** 3)).toBe("1.0 GB");
	});

	it("handles invalid and negative values", () => {
		expect(formatByteSize(Number.NaN)).toBe("0 B");
		expect(formatByteSize(Number.POSITIVE_INFINITY)).toBe("0 B");
		expect(formatByteSize(-1)).toBe("0 B");
	});
});
