import { Env } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { copyTextToClipboard as copyText } from "@semoss/utility";

export {
	isOutputJSON,
	metakeyToLabel,
	removeUnderscores,
	splitAtPeriod,
	toTitleCase,
} from "@semoss/utility";

/**
 * @desc Copies string to clipboard
 */
export const copyTextToClipboard = async (text: string): Promise<void> => {
	try {
		await copyText(text);
		toast.success("Successfully copied to clipboard");
	} catch (error) {
		toast.error(error instanceof Error ? error.message : String(error));
	}
};

export const getSDKSnippet = (
	type: "py" | "js",
	accessKey?: string,
	secretKey?: string,
) => {
	if (type === "py") {
		return `# import the ai platform package
import ai_server

# pass in your access and secret keys to authenticate
server_connection=ai_server.ServerClient(
    access_key="${accessKey ? accessKey : "<your access key>"}",
    secret_key="${secretKey ? secretKey : "<your secret key>"}",
    base="${Env.MODULE}/api"
)`;
	} else {
		return `# .env
MODULE="${Env.MODULE}"

#.env.local
ACCESS_KEY="${accessKey ? accessKey : "<your access key>"}"
SECRET_KEY="${secretKey ? secretKey : "<your secret key>"}"`;
	}
};

function parseAsUTC(input: string): Date | null {
	const m = input.match(
		/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
	);
	if (!m) {
		const d = new Date(input);
		return Number.isNaN(d.getTime()) ? null : d; // fallback
	}
	const [, y, mo, d, h, mi, s] = m;
	const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? "0"));
	return new Date(ms);
}

export function formatDate(createdAt: string): string {
	const dateUTC = parseAsUTC(createdAt);
	if (!dateUTC) return "";

	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

	const dayKey = (d: Date) =>
		new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(d);

	const now = new Date();
	const todayKey = dayKey(now);
	const yesterdayKey = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
	const itemKey = dayKey(dateUTC);

	const timeStr = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(dateUTC);

	if (itemKey === todayKey) return `Today, ${timeStr}`;
	if (itemKey === yesterdayKey) return `Yesterday, ${timeStr}`;

	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(dateUTC);
}

export const formatToDataTestId = (text: string) => {
	return text.replaceAll(/\(\)/g, "").replaceAll(" ", "-");
};
