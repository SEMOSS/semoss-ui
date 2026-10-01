import { moduleUrlFor } from "@/config/profiles";
import type { DesktopInstanceProfile, InstanceConfig } from "@/types";
import { request } from "./transport";

interface PixelReturn<T> {
	operationType: string[];
	output: T;
	timeToRun?: number;
}

interface PixelResponse<T> {
	insightID: string;
	pixelReturn: PixelReturn<T>[];
}

const readErrorMessage = async (response: Response): Promise<string> => {
	try {
		const body: unknown = await response.json();
		if (body && typeof body === "object" && !Array.isArray(body)) {
			const record = body as Record<string, unknown>;
			const message =
				record.message || record.error || record.errorMessage;
			if (typeof message === "string" && message.trim()) return message;
		}
	} catch {
		// Status text is the deliberate fallback for non-JSON errors.
	}

	return response.statusText || `Request failed (${response.status})`;
};

export const runPixel = async <T>(
	profile: DesktopInstanceProfile,
	config: InstanceConfig,
	expression: string,
	insightId?: string,
): Promise<{
	insightId: string;
	output: T;
	outputs: unknown[];
	returns?: PixelReturn<unknown>[];
}> => {
	const body = new URLSearchParams({
		expression,
		tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
	if (insightId) body.set("insightId", insightId);

	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/x-www-form-urlencoded",
	};
	if (config.csrf && config["X-CSRF-Token"]) {
		headers["X-CSRF-Token"] = config["X-CSRF-Token"];
	}

	const response = await request(
		profile,
		`${moduleUrlFor(profile)}/api/engine/runPixel`,
		{
			method: "POST",
			headers,
			body: body.toString(),
		},
	);
	if (!response.ok) throw new Error(await readErrorMessage(response));

	const result = (await response.json()) as PixelResponse<T>;
	const errors = result.pixelReturn
		.filter(({ operationType }) => operationType.includes("ERROR"))
		.map(({ output }) =>
			typeof output === "string" ? output : JSON.stringify(output),
		);
	if (errors.length > 0) throw new Error(errors.join("\n"));

	const first = result.pixelReturn[0];
	if (!first) throw new Error("The instance returned no Pixel result.");

	return {
		insightId: result.insightID,
		output: first.output,
		outputs: result.pixelReturn.map(({ output }) => output),
		returns: result.pixelReturn,
	};
};
