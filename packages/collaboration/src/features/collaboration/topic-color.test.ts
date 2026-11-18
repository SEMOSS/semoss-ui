import { describe, expect, it } from "vitest";
import {
	getAutomaticColor,
	parseColor,
	topicColor,
	toRgb,
} from "./topic-color";

describe("parseColor", () => {
	describe("valid inputs", () => {
		it("parses 6-digit hex", () => {
			expect(parseColor("#FF0000")).toBe("#ff0000");
			expect(parseColor("#00ff00")).toBe("#00ff00");
			expect(parseColor("#0000ff")).toBe("#0000ff");
			expect(parseColor("#123abc")).toBe("#123abc");
		});

		it("parses 3-digit hex and expands to 6-digit", () => {
			expect(parseColor("#F00")).toBe("#ff0000");
			expect(parseColor("#0F0")).toBe("#00ff00");
			expect(parseColor("#00F")).toBe("#0000ff");
			expect(parseColor("#abc")).toBe("#aabbcc");
		});

		it("parses rgb(r,g,b) format", () => {
			expect(parseColor("rgb(255, 0, 0)")).toBe("#ff0000");
			expect(parseColor("rgb(0,255,0)")).toBe("#00ff00");
			expect(parseColor("rgb(0, 0, 255)")).toBe("#0000ff");
		});

		it("parses r,g,b comma-separated format", () => {
			expect(parseColor("255, 0, 0")).toBe("#ff0000");
			expect(parseColor("0,255,0")).toBe("#00ff00");
			expect(parseColor("128, 64, 192")).toBe("#8040c0");
		});

		it("handles whitespace in various formats", () => {
			expect(parseColor("  #FF0000  ")).toBe("#ff0000");
			expect(parseColor("rgb( 255 , 0 , 0 )")).toBe("#ff0000");
			expect(parseColor("  255 , 0 , 0  ")).toBe("#ff0000");
		});

		it("handles boundary values (0 and 255)", () => {
			expect(parseColor("0,0,0")).toBe("#000000");
			expect(parseColor("255,255,255")).toBe("#ffffff");
		});

		it("normalizes to lowercase", () => {
			expect(parseColor("#ABCDEF")).toBe("#abcdef");
			expect(parseColor("RGB(255, 0, 0)")).toBe("#ff0000");
		});
	});

	describe("invalid inputs", () => {
		it("returns null for empty or null input", () => {
			expect(parseColor("")).toBeNull();
			expect(parseColor(null)).toBeNull();
			expect(parseColor(undefined)).toBeNull();
			expect(parseColor("   ")).toBeNull();
		});

		it("returns null for invalid hex", () => {
			expect(parseColor("#GGGGGG")).toBeNull();
			expect(parseColor("#FF00")).toBeNull(); // 4 digits
			expect(parseColor("#FF00000")).toBeNull(); // 7 digits
			expect(parseColor("FF0000")).toBeNull(); // missing #
		});

		it("returns null for out-of-range RGB values", () => {
			expect(parseColor("256,0,0")).toBeNull();
			expect(parseColor("0,256,0")).toBeNull();
			expect(parseColor("0,0,256")).toBeNull();
			expect(parseColor("-1,0,0")).toBeNull();
			expect(parseColor("0,-1,0")).toBeNull();
		});

		it("returns null for invalid RGB format", () => {
			expect(parseColor("rgb(255, 0)")).toBeNull();
			expect(parseColor("rgb(255, 0, 0, 0)")).toBeNull();
			expect(parseColor("rgb(255 0 0)")).toBeNull();
			expect(parseColor("255,0")).toBeNull();
		});

		it("returns null for non-numeric RGB values", () => {
			expect(parseColor("rgb(a, b, c)")).toBeNull();
			expect(parseColor("255,0,abc")).toBeNull();
		});

		it("returns null for floats in RGB format", () => {
			expect(parseColor("255.5,0,0")).toBeNull();
			expect(parseColor("255,0.5,0")).toBeNull();
		});
	});
});

describe("toRgb", () => {
	it("converts hex to RGB", () => {
		expect(toRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
		expect(toRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
		expect(toRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
		expect(toRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
		expect(toRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("handles mid-range values", () => {
		expect(toRgb("#123456")).toEqual({ r: 0x12, g: 0x34, b: 0x56 });
		expect(toRgb("#abcdef")).toEqual({ r: 0xab, g: 0xcd, b: 0xef });
	});

	it("returns null for invalid input", () => {
		expect(toRgb("")).toBeNull();
		expect(toRgb("#FF00")).toBeNull();
		expect(toRgb("#FF00000")).toBeNull();
		expect(toRgb("FF0000")).toBeNull();
		expect(toRgb(null as unknown as string)).toBeNull();
	});
});

describe("topicColor", () => {
	it("returns custom color when set", () => {
		const topic = { id: "topic1", color: "#ff0000" };
		expect(topicColor(topic)).toEqual({
			backgroundColor: "#ff0000",
		});
	});

	it("returns hashed color when custom color is empty", () => {
		const topic = { id: "topic1", color: "" };
		const result = topicColor(topic);
		expect(result).toHaveProperty("backgroundColor");
		expect(result.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("returns consistent hashed color for same topic ID", () => {
		const topic1 = { id: "my-topic-id", color: "" };
		const topic2 = { id: "my-topic-id", color: "" };
		const result1 = topicColor(topic1);
		const result2 = topicColor(topic2);
		expect(result1.backgroundColor).toBe(result2.backgroundColor);
	});

	it("returns different colors for different topic IDs", () => {
		const colors = new Set<string>();
		for (let i = 0; i < 10; i++) {
			const topic = { id: `topic-${i}`, color: "" };
			colors.add(topicColor(topic).backgroundColor);
		}
		// Should have at least some variety (5 tone classes)
		expect(colors.size).toBeGreaterThan(1);
	});

	it("prefers custom color over hashed", () => {
		const topicWithColor = { id: "topic1", color: "#0000ff" };
		const topicWithoutColor = { id: "topic1", color: "" };

		const withColor = topicColor(topicWithColor);
		const withoutColor = topicColor(topicWithoutColor);

		expect(withColor.backgroundColor).toBe("#0000ff");
		expect(withoutColor.backgroundColor).not.toBe("#0000ff");
	});
});

describe("getAutomaticColor", () => {
	it("returns a hex color for a topic ID", () => {
		const color = getAutomaticColor("topic1");
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("returns consistent color for same topic ID", () => {
		const color1 = getAutomaticColor("my-topic");
		const color2 = getAutomaticColor("my-topic");
		expect(color1).toBe(color2);
	});

	it("returns different colors for different topic IDs (usually)", () => {
		const colors = new Set<string>();
		for (let i = 0; i < 10; i++) {
			colors.add(getAutomaticColor(`topic-${i}`));
		}
		expect(colors.size).toBeGreaterThan(1);
	});

	it("returns a valid hex color", () => {
		const color = getAutomaticColor("test-topic-123");
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});
});
