import { expect, test } from "vitest";
import { isBackOnInstance } from "./auth-window";
import { getDownloadFileName } from "./downloads";

test("a download is offered under the name its response gives", () => {
	expect(
		getDownloadFileName('attachment; filename="Room Export.docx"', "k"),
	).toBe("Room Export.docx");
	expect(
		getDownloadFileName(
			"attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf",
			"k",
		),
	).toBe("résumé.pdf");
	expect(getDownloadFileName(null, "exports/abc/chat.pdf")).toBe("chat.pdf");
});

test("a sign in window is back once it leaves the sign in pages", () => {
	const module = "https://host.example/Monolith";
	expect(
		isBackOnInstance(
			"https://host.example/Monolith/api/auth/login/ms",
			module,
		),
	).toBe(false);
	expect(
		isBackOnInstance("https://login.microsoftonline.com/x", module),
	).toBe(false);
	expect(isBackOnInstance("https://host.example/SemossWeb/", module)).toBe(
		true,
	);
	expect(isBackOnInstance("about:blank", module)).toBe(false);
});
