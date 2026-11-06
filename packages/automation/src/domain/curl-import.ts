import type { ApiRequestBodyType } from "./automation.types";

export interface CurlImportResult {
	method: string;
	url: string;
	headers: Record<string, string>;
	bodyType: ApiRequestBodyType;
	body: string;
	/** Things the user must still do, such as adding an input for a removed secret. */
	warnings: string[];
}

const CREDENTIAL_HEADERS = new Set([
	"authorization",
	"proxy-authorization",
	"x-api-key",
	"api-key",
	"apikey",
	"x-auth-token",
	"cookie",
]);

const BODY_FLAGS = new Set([
	"-d",
	"--data",
	"--data-raw",
	"--data-binary",
	"--data-ascii",
	"--data-urlencode",
	"--json",
]);

/** Splits a shell-style command into words, honouring quotes and line continuations. */
export function tokenizeCommand(command: string): string[] {
	const text = command.replace(/\\\r?\n/g, " ");
	const tokens: string[] = [];
	let current = "";
	let quote: "'" | '"' | null = null;
	let inToken = false;
	for (let index = 0; index < text.length; index++) {
		const char = text[index];
		if (quote === "'") {
			if (char === "'") quote = null;
			else current += char;
			continue;
		}
		if (quote === '"') {
			if (char === '"') {
				quote = null;
			} else if (char === "\\" && index + 1 < text.length) {
				const next = text[index + 1];
				if (next === '"' || next === "\\" || next === "$") {
					current += next;
					index++;
				} else {
					current += char;
				}
			} else {
				current += char;
			}
			continue;
		}
		if (char === "'" || char === '"') {
			quote = char;
			inToken = true;
		} else if (/\s/.test(char)) {
			if (inToken) {
				tokens.push(current);
				current = "";
				inToken = false;
			}
		} else if (char === "\\" && index + 1 < text.length) {
			current += text[index + 1];
			index++;
			inToken = true;
		} else {
			current += char;
			inToken = true;
		}
	}
	if (quote) throw new Error("The command has an unclosed quote.");
	if (inToken) tokens.push(current);
	return tokens;
}

function secretReference(name: string): string {
	const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
	return `\${${slug.replace(/^_+|_+$/g, "") || "secret"}}`;
}

function parseForm(body: string): Record<string, string> {
	const fields: Record<string, string> = {};
	for (const pair of body.split("&")) {
		if (!pair) continue;
		const separator = pair.indexOf("=");
		const rawKey = separator === -1 ? pair : pair.slice(0, separator);
		const rawValue = separator === -1 ? "" : pair.slice(separator + 1);
		const decode = (value: string) => {
			try {
				return decodeURIComponent(value.replace(/\+/g, " "));
			} catch {
				return value;
			}
		};
		fields[decode(rawKey)] = decode(rawValue);
	}
	return fields;
}

/** Converts a pasted cURL command into the fields of an API Request node. */
export function parseCurlCommand(command: string): CurlImportResult {
	const tokens = tokenizeCommand(command.trim());
	if (tokens.length === 0 || tokens[0].toLowerCase() !== "curl") {
		throw new Error("Paste a command that starts with curl.");
	}
	const warnings: string[] = [];
	const headers: Record<string, string> = {};
	const bodyParts: string[] = [];
	let method = "";
	let url = "";
	let forceGet = false;
	let jsonFlag = false;

	for (let index = 1; index < tokens.length; index++) {
		const token = tokens[index];
		const equals = token.startsWith("--") ? token.indexOf("=") : -1;
		const flag = equals === -1 ? token : token.slice(0, equals);
		const inlineValue = equals === -1 ? undefined : token.slice(equals + 1);
		const value = () => {
			if (inlineValue !== undefined) return inlineValue;
			index++;
			if (index >= tokens.length) {
				throw new Error(`${flag} needs a value.`);
			}
			return tokens[index];
		};
		if (flag === "-X" || flag === "--request") {
			method = value().toUpperCase();
		} else if (flag === "-H" || flag === "--header") {
			const header = value();
			const separator = header.indexOf(":");
			if (separator > 0) {
				const name = header.slice(0, separator).trim();
				const headerValue = header.slice(separator + 1).trim();
				if (CREDENTIAL_HEADERS.has(name.toLowerCase())) {
					const reference = secretReference(name);
					const scheme = /^(bearer|basic|token|digest)\s/i.exec(
						headerValue,
					);
					headers[name] = scheme
						? `${scheme[1]} ${reference}`
						: reference;
					warnings.push(
						`${name} was replaced with ${reference}. Add a trigger input with that name so the secret is not saved in the automation.`,
					);
				} else {
					headers[name] = headerValue;
				}
			}
		} else if (BODY_FLAGS.has(flag)) {
			if (flag === "--json") jsonFlag = true;
			bodyParts.push(value());
		} else if (flag === "-G" || flag === "--get") {
			forceGet = true;
		} else if (flag === "-u" || flag === "--user") {
			value();
			headers.Authorization = `Basic ${secretReference("basic_auth")}`;
			warnings.push(
				"Basic auth credentials were removed. Add a trigger input named basic_auth holding the encoded value.",
			);
		} else if (flag === "-I" || flag === "--head") {
			method = "HEAD";
		} else if (flag.startsWith("-")) {
			// Flags that change transport only (-s, -k, -L, --compressed, ...)
			if (flag === "-k" || flag === "--insecure") {
				warnings.push(
					"-k (skip certificate checks) is not supported and was ignored.",
				);
			}
		} else if (!url) {
			url = token;
		}
	}
	if (!url) throw new Error("The command has no URL.");

	let body = bodyParts.join("&");
	if (forceGet && body) {
		url += (url.includes("?") ? "&" : "?") + body;
		body = "";
	}
	if (!method) method = body ? "POST" : "GET";

	const contentTypeName = Object.keys(headers).find(
		(name) => name.toLowerCase() === "content-type",
	);
	const contentType = contentTypeName
		? headers[contentTypeName].toLowerCase()
		: "";
	let bodyType: ApiRequestBodyType = "none";
	if (body) {
		let isJson = jsonFlag || contentType.includes("json");
		if (!isJson && !contentType) {
			try {
				JSON.parse(body);
				isJson = true;
			} catch {
				isJson = false;
			}
		}
		if (isJson) {
			bodyType = "json";
			if (jsonFlag && !contentTypeName) {
				headers["Content-Type"] = "application/json";
			}
		} else if (
			contentType.includes("application/x-www-form-urlencoded") ||
			(!contentType && /^[^=\s]+=/.test(body))
		) {
			bodyType = "form";
			body = JSON.stringify(parseForm(body), null, 2);
			if (contentTypeName) delete headers[contentTypeName];
		} else {
			bodyType = "raw";
		}
		if (method === "GET" || method === "HEAD") {
			warnings.push(
				`${method} requests cannot send a body, so the body was dropped.`,
			);
			bodyType = "none";
			body = "";
		}
	}
	return { method, url, headers, bodyType, body, warnings };
}
