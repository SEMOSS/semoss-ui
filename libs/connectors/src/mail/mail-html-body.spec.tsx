import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MailEmbeddedImages } from "./mail.types";
import type { MailHtmlBodyProps } from "./mail-html-body";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

type BodyModule = typeof import("./mail-html-body");
type PreferenceModule = typeof import("./use-mail-picture-preference");

// the picture choice is read once per page, so each test reads the modules
// afresh
let body: BodyModule;
let preferences: PreferenceModule;
let root: Root;
let container: HTMLDivElement;

const render = async (props: Partial<MailHtmlBodyProps>) => {
	const { MailHtmlBody } = body;
	await act(async () =>
		root.render(
			<MailHtmlBody
				html="<p>Hi</p>"
				title="Email from Ada"
				fallback={<p>text body</p>}
				{...props}
			/>,
		),
	);
};
const button = (label: string): HTMLButtonElement | undefined =>
	Array.from(container.querySelectorAll("button")).find(
		(element) => element.textContent === label,
	);
const frameHtml = (): string =>
	container.querySelector("iframe")?.getAttribute("srcdoc") ?? "";
const settle = () => act(async () => await Promise.resolve());
const pictures = (data: string): MailEmbeddedImages => ({
	images: [{ contentId: "logo", contentType: "image/png", data: data }],
	omitted: 0,
});
const deferred = () => {
	let resolve: (value: MailEmbeddedImages) => void = () => undefined;
	let reject: (reason: unknown) => void = () => undefined;
	const promise = new Promise<MailEmbeddedImages>((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
};

beforeEach(async () => {
	vi.resetModules();
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	window.localStorage.clear();
	body = await import("./mail-html-body");
	preferences = await import("./use-mail-picture-preference");
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	window.localStorage.clear();
	vi.unstubAllGlobals();
});

it("shows no picture bar when the email holds nothing back", async () => {
	await render({ html: "<p>Just text</p>" });
	expect(container.querySelector("iframe")).not.toBeNull();
	expect(container.querySelectorAll("button")).toHaveLength(0);
	expect(container.textContent).not.toContain("mail.picturesHidden");
});

it("shows the text instead when the HTML has nothing to show", async () => {
	await render({ html: "<div> </div>" });
	expect(container.querySelector("iframe")).toBeNull();
	expect(container.textContent).toContain("text body");
});

it("keeps what an email shows when the choice for every email changes", async () => {
	await render({ html: '<p>Hi</p><img src="https://example.com/a.png">' });
	expect(button("mail.showWebPictures")).toBeDefined();
	expect(frameHtml()).toContain("img-src 'none'");

	await act(async () => preferences.setMailPicturePreference("all"));
	expect(button("mail.showWebPictures")).toBeUndefined();
	expect(frameHtml()).toContain("img-src https:");

	await act(async () => preferences.setMailPicturePreference("ask"));
	expect(button("mail.showWebPictures")).toBeUndefined();
	expect(frameHtml()).toContain("img-src https:");
});

it("reads embedded pictures again after a failure, on the same button", async () => {
	const first = deferred();
	const read = vi
		.fn<() => Promise<MailEmbeddedImages>>()
		.mockReturnValueOnce(first.promise)
		.mockResolvedValueOnce(pictures("AAAA"));
	await render({
		html: '<p>Hi</p><img src="cid:logo">',
		onLoadEmbeddedImages: read,
	});
	const show = button("mail.showEmbeddedPictures");
	expect(show).toBeDefined();
	show?.focus();

	await act(async () => show?.click());
	expect(show?.textContent).toBe("mail.loadingPictures");
	expect(show?.getAttribute("aria-disabled")).toBe("true");
	expect(document.activeElement).toBe(show);
	// clicking while it reads does not read twice
	await act(async () => show?.click());
	expect(read).toHaveBeenCalledTimes(1);

	await act(async () => first.reject(new Error("network")));
	await settle();
	expect(show?.textContent).toBe("common.retry");
	expect(show?.hasAttribute("aria-disabled")).toBe(false);
	expect(document.activeElement).toBe(show);

	await act(async () => show?.click());
	await settle();
	expect(read).toHaveBeenCalledTimes(2);
	expect(button("common.retry")).toBeUndefined();
	expect(frameHtml()).toContain("data:image/png;base64,AAAA");
	// the button is gone once the pictures show, so focus moves to the email
	expect(document.activeElement).toBe(container.querySelector("iframe"));
});

it("drops a read that finishes after the email changed", async () => {
	preferences.setMailPicturePreference("embedded");
	const old = deferred();
	await render({
		html: '<p>Old</p><img src="cid:logo">',
		onLoadEmbeddedImages: () => old.promise,
	});
	await render({
		html: '<p>New</p><img src="cid:logo">',
		onLoadEmbeddedImages: async () => pictures("NEWW"),
	});
	await settle();
	await act(async () => old.resolve(pictures("OLDD")));
	await settle();
	expect(frameHtml()).toContain("data:image/png;base64,NEWW");
	expect(frameHtml()).not.toContain("OLDD");
});

it("drops a read that finishes after the email is closed", async () => {
	preferences.setMailPicturePreference("embedded");
	const pending = deferred();
	await render({
		html: '<p>Hi</p><img src="cid:logo">',
		onLoadEmbeddedImages: () => pending.promise,
	});
	await act(async () => root.unmount());
	await act(async () => pending.resolve(pictures("AAAA")));
	expect(container.querySelector("iframe")).toBeNull();
	root = createRoot(container);
});
