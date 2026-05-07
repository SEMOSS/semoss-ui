import { Env } from "../env";

const EMBED_AUTH_MESSAGE_TYPE = "SMSS_EMBED_AUTH";
const EMBED_AUTH_READY_TYPE = "SMSS_EMBED_AUTH_READY";
const EMBED_AUTH_TIMEOUT_MS = 4000;
const EMBED_AUTH_QUERY_PARAM = "SMSS_EMBED_AUTH";

interface EmbedAuthMessagePayload {
	bearerToken?: unknown;
	bearer?: unknown;
	loginProvider?: unknown;
	bearerProvider?: unknown;
	provider?: unknown;
}

interface EmbedAuthMessage {
	type?: unknown;
	payload?: unknown;
	bearerToken?: unknown;
	bearer?: unknown;
	loginProvider?: unknown;
	bearerProvider?: unknown;
	provider?: unknown;
}

let embedAuthPromise: Promise<void> | null = null;

const toCleanString = (value: unknown): string => {
	return typeof value === "string" ? value.trim() : "";
};

const resolveParentOrigin = (): string | null => {
	if (typeof document === "undefined" || !document.referrer) {
		return null;
	}

	try {
		return new URL(document.referrer).origin;
	} catch {
		return null;
	}
};

const isTruthyQueryValue = (value: string | null): boolean => {
	if (!value) {
		return false;
	}

	const normalized = value.trim().toLowerCase();
	return normalized === "true" || normalized === "1" || normalized === "yes";
};

const getHashQueryParam = (key: string): string | null => {
	if (typeof window === "undefined" || !window.location.hash) {
		return null;
	}

	const queryStart = window.location.hash.indexOf("?");
	if (queryStart === -1) {
		return null;
	}

	const query = window.location.hash.slice(queryStart + 1);
	return new URLSearchParams(query).get(key);
};

const shouldWaitForEmbedAuth = (): boolean => {
	if (typeof window === "undefined") {
		return false;
	}

	if (window.self === window.top) {
		return false;
	}

	const searchParam = new URLSearchParams(window.location.search).get(
		EMBED_AUTH_QUERY_PARAM,
	);
	const hashParam = getHashQueryParam(EMBED_AUTH_QUERY_PARAM);

	return isTruthyQueryValue(searchParam) || isTruthyQueryValue(hashParam);
};

const normalizeAuthPayload = (
	value: EmbedAuthMessagePayload,
): { bearerToken: string; loginProvider: string } => {
	return {
		bearerToken: toCleanString(value.bearerToken || value.bearer),
		loginProvider: toCleanString(
			value.loginProvider || value.bearerProvider || value.provider,
		),
	};
};

const extractEmbedAuthPayload = (
	value: unknown,
): { bearerToken: string; loginProvider: string } | null => {
	if (!value || typeof value !== "object") {
		return null;
	}

	const data = value as EmbedAuthMessage;
	if (data.type !== EMBED_AUTH_MESSAGE_TYPE) {
		return null;
	}

	const payload =
		data.payload && typeof data.payload === "object"
			? (data.payload as EmbedAuthMessagePayload)
			: (data as EmbedAuthMessagePayload);

	return normalizeAuthPayload(payload);
};

const applyEmbedAuth = (payload: {
	bearerToken: string;
	loginProvider: string;
}) => {
	Env.update({
		BEARER_TOKEN: payload.bearerToken,
		BEARER_PROVIDER: payload.loginProvider,
	});
};

/**
 * If running in an iframe with `SMSS_EMBED_AUTH=true` in URL query/hash query,
 * wait briefly for parent auth details via postMessage before bootstrapping.
 */
export const waitForEmbedAuth = (): Promise<void> => {
	if (embedAuthPromise) {
		return embedAuthPromise;
	}

	embedAuthPromise = new Promise<void>((resolve) => {
		if (!shouldWaitForEmbedAuth()) {
			resolve();
			return;
		}

		const expectedOrigin = resolveParentOrigin();
		const targetOrigin = expectedOrigin || "*";
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		function cleanup() {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			window.removeEventListener("message", handleMessage);
		}

		function finish() {
			cleanup();
			resolve();
		}

		function handleMessage(event: MessageEvent) {
			if (event.source !== window.parent) {
				return;
			}

			if (expectedOrigin && event.origin !== expectedOrigin) {
				return;
			}

			const payload = extractEmbedAuthPayload(event.data);
			if (!payload) {
				return;
			}

			applyEmbedAuth(payload);
			finish();
		}

		window.addEventListener("message", handleMessage);

		try {
			window.parent.postMessage(
				{
					type: EMBED_AUTH_READY_TYPE,
				},
				targetOrigin,
			);
		} catch {
			// noop
		}

		timeoutId = setTimeout(() => {
			finish();
		}, EMBED_AUTH_TIMEOUT_MS);
	});

	return embedAuthPromise;
};
