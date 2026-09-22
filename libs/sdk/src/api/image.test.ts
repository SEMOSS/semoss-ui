import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { CSRF } from "../utility/fetch";
import {
	CATALOG_IMAGE_MAX_BYTES,
	getCatalogImageValidationError,
	uploadEngineImage,
	uploadProjectImage,
} from "./image";

const result = {
	message: "Successfully updated image",
	id: "saved-id",
	name: "Research agent",
	imageUrl: "/Monolith/api/project-saved-id/projectImage/download",
	contentType: "image/png",
};

function response(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

describe("catalog image uploads", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(result)));
		Env.update({
			MODULE: "/Monolith",
			ACCESS_KEY: "",
			SECRET_KEY: "",
			BEARER_TOKEN: "",
			BEARER_PROVIDER: "",
			CSRF: false,
		});
		CSRF.isEnabled = false;
		CSRF.token = "";
	});

	afterEach(() => vi.unstubAllGlobals());

	it.each([
		[uploadEngineImage, "e"],
		[uploadProjectImage, "project"],
	] as const)(
		"uploads one file with the %s wrapper",
		async (upload, resource) => {
			const file = new File(["image bytes"], "avatar.png", {
				type: "image/png",
			});
			expect(await upload("saved-id", file)).toEqual(result);
			const [url, options] = vi.mocked(fetch).mock.calls[0];
			expect(url).toBe(`/Monolith/api/${resource}-saved-id/image/upload`);
			expect(options?.method).toBe("POST");
			expect(options?.body).toBeInstanceOf(FormData);
			const form = options?.body as FormData;
			expect([...form.keys()]).toEqual(["file"]);
			expect(form.get("file")).toBe(file);
			expect(new Headers(options?.headers).has("Content-Type")).toBe(
				false,
			);
		},
	);

	it("encodes IDs and retains SDK authentication and CSRF handling", async () => {
		Env.update({
			MODULE: "https://example.test/backend",
			BEARER_TOKEN: "test-token",
			CSRF: true,
		});
		CSRF.token = "csrf-test-token";
		vi.mocked(fetch).mockResolvedValue(
			response({ ...result, id: "a b#c" }),
		);
		await uploadProjectImage(
			"a b#c",
			new File(["bytes"], "a.gif", { type: "image/gif" }),
		);
		const [url, options] = vi.mocked(fetch).mock.calls[0];
		expect(url).toBe(
			"https://example.test/backend/api/project-a%20b%23c/image/upload",
		);
		const headers = new Headers(options?.headers);
		expect(headers.get("Authorization")).toBe("Bearer test-token");
		expect(headers.get("X-CSRF-Token")).toBe("csrf-test-token");
	});

	it.each([400, 401, 403, 413, 415, 500])(
		"surfaces server errors for HTTP %s",
		async (status) => {
			vi.mocked(fetch).mockResolvedValue(
				response({ errorMessage: "Image upload rejected" }, status),
			);
			await expect(
				uploadProjectImage(
					"saved-id",
					new File(["bytes"], "a.png", { type: "image/png" }),
				),
			).rejects.toThrow("Image upload rejected");
		},
	);

	it.each([
		{},
		null,
		{ ...result, id: "wrong-id" },
		{ ...result, imageUrl: "" },
		{ ...result, contentType: "text/html" },
	])("rejects a malformed success response: %j", async (data) => {
		vi.mocked(fetch).mockResolvedValue(response(data));
		await expect(
			uploadEngineImage(
				"saved-id",
				new File(["bytes"], "a.png", { type: "image/png" }),
			),
		).rejects.toThrow("did not confirm");
	});

	it("requires a saved ID before sending a request", async () => {
		await expect(
			uploadProjectImage(
				" ",
				new File(["bytes"], "a.png", { type: "image/png" }),
			),
		).rejects.toThrow("saved resource ID");
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each([
		[new File([], "empty.png", { type: "image/png" }), "not empty"],
		[
			new File(["svg"], "image.svg", { type: "image/svg+xml" }),
			"PNG, JPEG, or GIF",
		],
		[
			new File(
				[new Uint8Array(CATALOG_IMAGE_MAX_BYTES + 1)],
				"large.png",
				{ type: "image/png" },
			),
			"10 MiB",
		],
	] as const)(
		"rejects an invalid file before uploading: %s",
		async (file, message) => {
			await expect(uploadProjectImage("saved-id", file)).rejects.toThrow(
				message,
			);
			expect(fetch).not.toHaveBeenCalled();
		},
	);

	it("accepts the 10 MiB boundary and supported filenames with unavailable MIME metadata", () => {
		expect(
			getCatalogImageValidationError(
				new File(
					[new Uint8Array(CATALOG_IMAGE_MAX_BYTES)],
					"avatar.PNG",
				),
			),
		).toBeNull();
		expect(
			getCatalogImageValidationError(new File(["bytes"], "avatar.JPG")),
		).toBeNull();
	});
});
