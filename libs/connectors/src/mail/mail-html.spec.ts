import { describe, expect, it } from "vitest";
import {
	buildMailHtmlDocument,
	getMailLink,
	hasMailHtmlPictures,
	type MailHtmlOptions,
} from "./mail-html";

const options: MailHtmlOptions = {
	isRemoteImagesShown: false,
	isQuotedHistoryShown: false,
	labels: {
		remoteImage: "Picture from the web",
		embeddedImage: "Embedded picture",
		image: "Picture",
	},
};

const body = (html: string): Document =>
	new DOMParser().parseFromString(html, "text/html");

describe("mail html", () => {
	it("removes active content and keeps safe links opening in a new tab", () => {
		const built = buildMailHtmlDocument(
			'<p onclick="steal()">Hi <a href="javascript:alert(1)">bad</a> <a href="https://example.com/x">good</a></p><script>steal()</script><form><input></form>',
			options,
		);
		const doc = body(built.html);
		expect(doc.querySelector("script, form, input, [onclick]")).toBeNull();
		const [bad, good] = Array.from(doc.querySelectorAll("a"));
		expect(bad.hasAttribute("href")).toBe(false);
		expect(good.getAttribute("href")).toBe("https://example.com/x");
		expect(good.getAttribute("target")).toBe("_blank");
		expect(good.getAttribute("rel")).toBe("noopener noreferrer");
		expect(built.hasContent).toBe(true);
	});

	it("blocks every load in its policy and holds pictures back until asked", () => {
		const html =
			'<p>Logo</p><img src="https://example.com/logo.png"><img src="cid:sig" alt="Signature">';
		const hidden = buildMailHtmlDocument(html, options);
		expect(hidden.hasRemoteImages).toBe(true);
		expect(hidden.html).toContain("img-src 'none'");
		expect(hidden.html).toContain("default-src 'none'");
		const hiddenDoc = body(hidden.html);
		expect(hiddenDoc.querySelector("img")).toBeNull();
		expect(hiddenDoc.body.textContent).toContain("[Picture from the web]");
		expect(hiddenDoc.body.textContent).toContain("[Signature]");

		const shown = buildMailHtmlDocument(html, {
			...options,
			isRemoteImagesShown: true,
		});
		expect(shown.html).toContain("img-src https:");
		const image = body(shown.html).querySelector("img");
		expect(image?.getAttribute("src")).toBe("https://example.com/logo.png");
		expect(image?.getAttribute("referrerpolicy")).toBe("no-referrer");
		expect(image?.getAttribute("alt")).toBe("Picture");
	});

	it("shows embedded pictures only once they are read, matching their content ids", () => {
		const html =
			'<img src="cid:Logo@Example" alt="Logo"><img src="cid:%3Csig%40example%3E"><img src="cid:missing@example"><img src="data:image/png;base64,iVBORw==">';
		const hidden = buildMailHtmlDocument(html, options);
		expect(hidden.hasEmbeddedImages).toBe(true);
		expect(hidden.hasRemoteImages).toBe(false);
		expect(hidden.html).toContain("img-src 'none'");
		expect(body(hidden.html).querySelector("img")).toBeNull();
		expect(body(hidden.html).body.textContent).toContain("[Logo]");

		const shown = buildMailHtmlDocument(html, {
			...options,
			embeddedImages: [
				{
					contentId: "logo@example",
					contentType: "image/png",
					data: "iVBORw==",
				},
				{
					contentId: "sig@example",
					contentType: "image/gif",
					data: "R0lG",
				},
			],
		});
		expect(shown.html).toContain("img-src data:;");
		expect(shown.html).not.toContain("https:");
		const doc = body(shown.html);
		expect(
			Array.from(doc.querySelectorAll("img")).map((image) =>
				image.getAttribute("src"),
			),
		).toEqual([
			"data:image/png;base64,iVBORw==",
			"data:image/gif;base64,R0lG",
			"data:image/png;base64,iVBORw==",
		]);
		expect(doc.body.textContent).toContain("[Embedded picture]");
	});

	it("allows both kinds of pictures in its policy when both are shown", () => {
		const built = buildMailHtmlDocument(
			'<img src="cid:logo"><img src="https://example.com/x.png">',
			{
				...options,
				isRemoteImagesShown: true,
				embeddedImages: [],
			},
		);
		expect(built.html).toContain("img-src data: https:;");
		expect(built.hasEmbeddedImages).toBe(true);
		expect(built.hasRemoteImages).toBe(true);
	});

	it("leaves out the history an Outlook reply quotes until it is shown", () => {
		const html =
			'<div>Sounds good.</div><div id="x_appendonsend"></div><hr><div id="x_divRplyFwdMsg">From: Ada</div><div>Earlier email</div>';
		const own = buildMailHtmlDocument(html, options);
		expect(own.hasQuotedHistory).toBe(true);
		expect(body(own.html).body.textContent).toContain("Sounds good.");
		expect(body(own.html).body.textContent).not.toContain("Earlier email");

		const whole = buildMailHtmlDocument(html, {
			...options,
			isQuotedHistoryShown: true,
		});
		expect(whole.hasQuotedHistory).toBe(true);
		expect(body(whole.html).body.textContent).toContain("Earlier email");
	});

	it("cuts the history a Gmail reply quotes, even inside wrapping elements", () => {
		const built = buildMailHtmlDocument(
			'<div dir="ltr"><div>Thanks!</div><div class="gmail_quote"><div class="gmail_attr">On Monday Ada wrote:</div><blockquote>Earlier</blockquote></div></div><div>After</div>',
			options,
		);
		const text = body(built.html).body.textContent ?? "";
		expect(text).toContain("Thanks!");
		expect(text).not.toContain("Earlier");
		expect(text).not.toContain("After");
	});

	it("shows an email that only forwards another whole", () => {
		const built = buildMailHtmlDocument(
			'<div class="gmail_quote">---------- Forwarded message ---------<div>The report</div></div>',
			options,
		);
		expect(built.hasQuotedHistory).toBe(false);
		expect(body(built.html).body.textContent).toContain("The report");
	});

	it("says when there is nothing to show", () => {
		expect(buildMailHtmlDocument("<div> </div>", options).hasContent).toBe(
			false,
		);
		expect(
			buildMailHtmlDocument('<img src="cid:only">', options).hasContent,
		).toBe(true);
	});

	it("keeps only web and email links", () => {
		expect(getMailLink("mailto:ada@example.com")).toBe(
			"mailto:ada@example.com",
		);
		expect(getMailLink("http://example.com")).toBe("http://example.com/");
		expect(getMailLink("data:text/html,hi")).toBeUndefined();
		expect(getMailLink("not a url")).toBeUndefined();
	});

	it("loads a background a style or an old attribute names once its pictures are shown", () => {
		const html =
			'<table background="cid:bg@x"><tr><td style="background:url(\'cid:tile@x\') repeat">Hi</td><td style="background-image:url(https://example.com/b.png)">Web</td></tr></table>';
		const hidden = buildMailHtmlDocument(html, options);
		expect(hidden.hasEmbeddedImages).toBe(true);
		expect(hidden.hasRemoteImages).toBe(true);
		expect(hidden.html).toContain("img-src 'none'");
		expect(hidden.html).not.toContain("base64");
		expect(body(hidden.html).querySelector("[background]")).toBeNull();

		const shown = buildMailHtmlDocument(html, {
			...options,
			isRemoteImagesShown: true,
			embeddedImages: [
				{ contentId: "bg@x", contentType: "image/png", data: "AAAA" },
				{ contentId: "tile@x", contentType: "image/gif", data: "BBBB" },
			],
		});
		expect(shown.html).toContain('url("data:image/png;base64,AAAA")');
		expect(shown.html).toContain('url("data:image/gif;base64,BBBB")');
		expect(shown.html).toContain("url(https://example.com/b.png)");
		expect(shown.html).toContain("img-src data: https:");
	});

	it("fits the frame to the email, whatever height the email gives itself", () => {
		const built = buildMailHtmlDocument(
			'<html><head><style>html,body{height:100%;overflow:auto}</style></head><body style="height:100%">Hi</body></html>',
			options,
		);
		expect(built.html.startsWith("<!DOCTYPE html>")).toBe(true);
		const doc = body(built.html);
		expect(doc.body.style.getPropertyValue("height")).toBe("auto");
		expect(doc.body.style.getPropertyPriority("height")).toBe("important");
		const styles = doc.querySelectorAll("style");
		expect(styles[styles.length - 1]?.textContent).toContain(
			"overflow-y:hidden!important",
		);
		expect(styles[styles.length - 1]?.textContent).toContain(
			"display:flow-root!important",
		);
	});

	it("puts its policy first in the head, whatever the email's own head holds", () => {
		for (const html of [
			'<html><head lang="en" class="x"><style>@import url(https://evil.example/a.css);</style></head><body style="background:url(https://track.example/q.gif)">Hi</body></html>',
			'<html title="<head>"><head><title>Hi</title></head><body>Hi</body></html>',
			'<html><head><meta http-equiv="refresh" content="0;url=https://evil.example"><meta http-equiv="Content-Security-Policy" content="img-src *"></head><body>Hi</body></html>',
		]) {
			const built = buildMailHtmlDocument(html, options);
			const doc = body(built.html);
			const first = doc.head.firstElementChild;
			expect(first?.getAttribute("http-equiv")).toBe(
				"Content-Security-Policy",
			);
			expect(first?.getAttribute("content")).toContain(
				"default-src 'none'",
			);
			expect(first?.getAttribute("content")).toContain("img-src 'none'");
			expect(
				doc.querySelectorAll(
					'meta[http-equiv="Content-Security-Policy"]',
				),
			).toHaveLength(1);
			expect(doc.querySelector('meta[http-equiv="refresh"]')).toBeNull();
			expect(
				doc
					.querySelector('meta[name="referrer"]')
					?.getAttribute("content"),
			).toBe("no-referrer");
		}
	});

	it("keeps an Outlook email's styles, which it writes inside a comment", () => {
		const built = buildMailHtmlDocument(
			'<html><head><style><!--\n/* Style Definitions */\np.MsoNormal, li.MsoNormal, div.MsoNormal\n\t{margin:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;}\n--></style></head><body lang="EN-US"><div class=WordSection1><p class=MsoNormal>Hi Maher,</p><p class=MsoNormal>Thanks.</p></div></body></html>',
			options,
		);
		const css = Array.from(
			body(built.html).querySelectorAll("style"),
			(style) => style.textContent ?? "",
		).join("\n");
		expect(css).toContain("p.MsoNormal");
		expect(css).toContain("margin:0in");
		expect(css).not.toContain("<!--");
		expect(css).toContain(":where(.MsoNormal){margin:0}");
	});

	it("is not changed by hooks other code adds to the shared sanitizer", async () => {
		const shared = (await import("dompurify")).default;
		shared.addHook("afterSanitizeAttributes", (node) => {
			if (node.tagName === "A") {
				node.setAttribute("rel", "noopener");
			}
		});
		try {
			const link = body(
				buildMailHtmlDocument(
					'<a href="https://example.com">x</a>',
					options,
				).html,
			).querySelector("a");
			expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
		} finally {
			shared.removeAllHooks();
		}
	});

	it("opens an image map's links in a new tab and drops unsafe ones", () => {
		const doc = body(
			buildMailHtmlDocument(
				'<img src="cid:map" usemap="#m"><map name="m"><area href="https://example.com/a" shape="rect" coords="0,0,1,1"><area href="javascript:alert(1)" shape="rect" coords="1,1,2,2"></map>',
				options,
			).html,
		);
		const [safe, unsafe] = Array.from(doc.querySelectorAll("area"));
		expect(safe.getAttribute("href")).toBe("https://example.com/a");
		expect(safe.getAttribute("target")).toBe("_blank");
		expect(safe.getAttribute("rel")).toBe("noopener noreferrer");
		expect(unsafe.hasAttribute("href")).toBe(false);
	});

	it("says whether an email's formatted body has pictures worth settings", () => {
		const html = (content: string) => ({
			contentType: "html" as const,
			content: content,
			isTruncated: false,
			inlineImagesOmitted: 0,
		});
		expect(hasMailHtmlPictures(html('<img src="cid:logo">'))).toBe(true);
		expect(
			hasMailHtmlPictures(
				html(
					'<div style="background:url(https://example.com/a.png)">x</div>',
				),
			),
		).toBe(true);
		expect(hasMailHtmlPictures(html("<p>Just text</p>"))).toBe(false);
		expect(
			hasMailHtmlPictures({
				...html('<img src="cid:logo">'),
				contentType: "text",
			}),
		).toBe(false);
		expect(hasMailHtmlPictures(undefined)).toBe(false);
	});
});
