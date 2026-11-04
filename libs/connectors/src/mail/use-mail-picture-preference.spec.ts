import { afterEach, describe, expect, it, vi } from "vitest";
import {
	MAIL_PICTURE_PREFERENCE_KEY,
	parseMailPicturePreference,
	setMailPicturePreference,
} from "./use-mail-picture-preference";

afterEach(() => {
	vi.restoreAllMocks();
	window.localStorage.clear();
});

describe("mail picture preference", () => {
	it("reads only the choices it knows, and asks otherwise", () => {
		expect(parseMailPicturePreference("embedded")).toBe("embedded");
		expect(parseMailPicturePreference("all")).toBe("all");
		expect(parseMailPicturePreference("always")).toBe("ask");
		expect(parseMailPicturePreference(null)).toBe("ask");
		expect(parseMailPicturePreference(1)).toBe("ask");
	});

	it("keeps the choice under its versioned key", () => {
		setMailPicturePreference("all");
		expect(window.localStorage.getItem(MAIL_PICTURE_PREFERENCE_KEY)).toBe(
			"all",
		);
	});

	it("still takes the choice when the browser keeps nothing", () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("storage is full");
		});
		expect(() => setMailPicturePreference("embedded")).not.toThrow();
	});
});
