import { describe, expect, test, vi } from "vitest";
import type { IpcChannel } from "../../../contract/ipc-contract";
import { type LanguageSource, syncLanguage } from "./sync-language";

/**
 * An i18next stand-in whose language switches when asked.
 *
 * @param language - The detected language.
 * @returns The stand-in, and a way to switch it as the language picker does.
 */
const createI18n = (language: string) => {
	const listeners: ((language: string) => void)[] = [];
	const i18n: LanguageSource & { resolvedLanguage: string } = {
		resolvedLanguage: language,
		changeLanguage: vi.fn(async (next: string) => {
			i18n.resolvedLanguage = next;
			for (const listener of listeners) listener(next);
		}),
		on: (_event, listener) => {
			listeners.push(listener);
		},
	};
	return i18n;
};

/**
 * A desktop bridge stand-in over a saved language.
 *
 * @param saved - What `language:get` answers, or an error to reject with.
 * @returns The bridge's `invoke`, which records every call.
 */
const createBridge = (saved: string | null | Error) => {
	const invoke = vi.fn(async (channel: IpcChannel, ..._args: unknown[]) => {
		if (channel !== "language:get") return undefined;
		if (saved instanceof Error) throw saved;
		return saved;
	});
	return { invoke } as unknown as Parameters<typeof syncLanguage>[1] & {
		invoke: typeof invoke;
	};
};

describe("syncLanguage", () => {
	test("applies the saved language", async () => {
		const i18n = createI18n("en");
		const bridge = createBridge("fr");
		await syncLanguage(i18n, bridge);
		expect(i18n.changeLanguage).toHaveBeenCalledWith("fr");
		expect(i18n.resolvedLanguage).toBe("fr");
	});

	test("leaves the language alone when it is the saved one", async () => {
		const i18n = createI18n("ja");
		await syncLanguage(i18n, createBridge("ja"));
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
	});

	test("saves the detected language when none is saved", async () => {
		const i18n = createI18n("es");
		const bridge = createBridge(null);
		await syncLanguage(i18n, bridge);
		expect(bridge.invoke).toHaveBeenCalledWith("language:set", "es");
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
	});

	test("ignores a saved language the app has no translations for", async () => {
		const i18n = createI18n("en");
		const bridge = createBridge("xx");
		await syncLanguage(i18n, bridge);
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
		expect(bridge.invoke).toHaveBeenCalledWith("language:set", "en");
	});

	test("saves every switch after that", async () => {
		const i18n = createI18n("en");
		const bridge = createBridge("en");
		await syncLanguage(i18n, bridge);
		await i18n.changeLanguage("ar");
		expect(bridge.invoke).toHaveBeenCalledWith("language:set", "ar");
	});

	test("keeps the detected language when the config cannot be read", async () => {
		const i18n = createI18n("nl");
		await expect(
			syncLanguage(i18n, createBridge(new Error("no main"))),
		).resolves.toBeUndefined();
		expect(i18n.resolvedLanguage).toBe("nl");
	});
});
