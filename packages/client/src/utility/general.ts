import { useEffect, useMemo, useRef } from "react";
import { Env } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type { Role } from "@/types";

/**
 * @desc splits a string at the period
 * Used in the UI Builder and notebook
 */
export const splitAtPeriod = (str, side = "left") => {
	const indexOfPeriod = str.indexOf(".");
	if (indexOfPeriod === -1) {
		return str; // No period found, return the entire string
	}

	if (side === "left") {
		return str.substring(0, indexOfPeriod);
	} else if (side === "right") {
		return str.substring(indexOfPeriod + 1);
	} else {
		throw new Error("Invalid side argument. Choose 'left' or 'right'");
	}
};

/**
 * @desc lowercases the whole string
 */
export const lowercase = (str) => {
	if (str.length === 0 || str.length === 1) {
		return str.toLowerCase();
	}
	// Identify word boundaries using regular expression
	const regex = /\b\w+\b/g;
	const match = regex.exec(str);
	if (!match) {
		return str;
	}
	const word = match[0].toLowerCase();
	return str.replace(regex, word);
};

export const capitalizeFirstLetter = (str) => {
	return str.replace(/\w{1}/, (match) => match.toUpperCase());
};

/*
 * @desc capitalizes every word that is spaced
 * "hello world" --> "Hello World"
 */
export const toTitleCase = (str) => {
	return str.replace(/\w\S*/g, (txt) => {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};

/**
 * @desc splits word on _ and Uppercases first word
 * "this_is_a_string" --> "This is a string"
 */
export const removeUnderscores = (str: string) => {
	const frags = str.split("_");
	for (let i = 0; i < frags.length; i++) {
		frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
	}
	return frags.join(" ");
};

export const formatPermission = (permission: Role | ""): string => {
	const errorString = "No permission found";

	if (!permission) {
		return errorString;
	}

	switch (permission) {
		case "OWNER":
			return "Author";
		case "EDIT":
		case "EDITOR":
			return "Editor";
		case "READ_ONLY":
		case "VIEWER":
			return "Read-Only";
		case "DISCOVERABLE":
			return "Discoverable";
		default:
			return errorString;
	}
};

/**
 * @desc Copies string to clipboard
 */
export const copyTextToClipboard = (text: string) => {
	try {
		navigator.clipboard.writeText(text);
		toast.success("Successfully copied to clipboard");
	} catch (e) {
		toast.error(e.message);
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

const debounce = (func, wait) => {
	let timeout: ReturnType<typeof setTimeout>;

	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

/**
 * @desc useDebounce utility function returns a debounced function
 */
export const debounced = (callback, delay) => {
	const ref = useRef(() => {
		console.log("ref");
	});

	useEffect(() => {
		ref.current = callback;
	}, [callback]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	const debouncedCallback = useMemo(() => {
		const func = () => {
			ref.current?.();
		};

		return debounce(func, delay);
	}, []);

	return debouncedCallback;
};

/**
 * @desc Checks if output and verify if its a JSON object
 */
export const isOutputJSON = (output: unknown) => {
	if (typeof output === "object" && output !== null) {
		return output;
	}
	if (typeof output === "string") {
		try {
			return JSON.parse(output);
		} catch {
			const validateJsonString = output.replace(/'/g, '"');
			try {
				return JSON.parse(validateJsonString);
			} catch {
				return null;
			}
		}
	}
	return null;
};

export const permissionPriorityMapper = (permission: string | number) => {
	if (!permission) {
		console.warn("No permission");
		return;
	}

	switch (permission) {
		case 1:
		case "OWNER":
			return { permission: "Author", priority: 1 };
		case "Author":
			return { permission: "OWNER", priority: 1 };

		case 2:
		case "EDIT":
			return { permission: "Editor", priority: 2 };
		case "Editor":
			return { permission: "EDIT", priority: 2 };

		case 3:
		case "READ_ONLY":
			return { permission: "Read-Only", priority: 3 };
		case "Read-Only":
			return { permission: "READ_ONLY", priority: 3 };

		default:
			return { permission: "", priority: 0 };
	}
};

/**
 * @name extractInitials
 *
 * Extract a initials for a string
 *
 * @param str
 */
export const extractInitials = (str: string): string => {
	if (str.length < 1) {
		return "";
	}

	return str.split(" ").reduce((prev, curr) => {
		return prev + (curr[0] || "");
	}, "");
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
