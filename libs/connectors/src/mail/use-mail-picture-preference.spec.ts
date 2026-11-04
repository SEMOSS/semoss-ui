import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type PreferenceModule = typeof import("./use-mail-picture-preference");

// the choice is read once per page, so each test reads the module afresh
let preferences: PreferenceModule;

beforeEach(async () => {
	vi.resetModules();
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	window.localStorage.clear();
	preferences = await import("./use-mail-picture-preference");
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	window.localStorage.clear();
	document.body.replaceChildren();
});

/**
 * Render the hook, as an email reading the choice would.
 *
 * @return What the hook returns at the latest render, and how to unmount it.
 */
const renderPreference = async () => {
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);
	let shown = "";
	const Reader = () => {
		shown = preferences.useMailPicturePreference().preference;
		return null;
	};
	await act(async () => root.render(createElement(Reader)));
	return {
		read: () => shown,
		unmount: () => act(async () => root.unmount()),
	};
};

describe("mail picture preference", () => {
	it("reads only the choices it knows, and asks otherwise", () => {
		const { parseMailPicturePreference } = preferences;
		expect(parseMailPicturePreference("embedded")).toBe("embedded");
		expect(parseMailPicturePreference("all")).toBe("all");
		expect(parseMailPicturePreference("always")).toBe("ask");
		expect(parseMailPicturePreference(null)).toBe("ask");
		expect(parseMailPicturePreference(1)).toBe("ask");
	});

	it("keeps the choice under its versioned key and shows it at once", async () => {
		const reader = await renderPreference();
		expect(reader.read()).toBe("ask");
		await act(async () => preferences.setMailPicturePreference("all"));
		expect(reader.read()).toBe("all");
		expect(
			window.localStorage.getItem(
				preferences.MAIL_PICTURE_PREFERENCE_KEY,
			),
		).toBe("all");
		await reader.unmount();
	});

	it("still takes the choice when the browser keeps nothing", async () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("storage is full");
		});
		const reader = await renderPreference();
		await act(async () => preferences.setMailPicturePreference("embedded"));
		expect(reader.read()).toBe("embedded");
		expect(
			window.localStorage.getItem(
				preferences.MAIL_PICTURE_PREFERENCE_KEY,
			),
		).toBeNull();
		await reader.unmount();
	});

	it("starts from a kept choice, and asks when what was kept is unknown", async () => {
		window.localStorage.setItem(
			preferences.MAIL_PICTURE_PREFERENCE_KEY,
			"embedded",
		);
		const kept = await renderPreference();
		expect(kept.read()).toBe("embedded");
		await kept.unmount();

		vi.resetModules();
		window.localStorage.setItem(
			preferences.MAIL_PICTURE_PREFERENCE_KEY,
			"always",
		);
		preferences = await import("./use-mail-picture-preference");
		const unknown = await renderPreference();
		expect(unknown.read()).toBe("ask");
		await unknown.unmount();
	});

	it("asks when the browser cannot be read", async () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		const reader = await renderPreference();
		expect(reader.read()).toBe("ask");
		await reader.unmount();
	});

	it("follows a choice made in another tab", async () => {
		const reader = await renderPreference();
		await act(async () => {
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: preferences.MAIL_PICTURE_PREFERENCE_KEY,
					newValue: "all",
				}),
			);
		});
		expect(reader.read()).toBe("all");
		await reader.unmount();
	});
});
