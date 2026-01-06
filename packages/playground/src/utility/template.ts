/**
 * Template token types produced by parseTemplate
 */
export type TemplateToken = TextTemplateToken | DataTemplateToken;

type TextTemplateToken = {
	type: "TEXT";
	text: string;
};

type DataTemplateToken = {
	type: "DATA";
	data: Record<string, unknown>;
};

/**
 * Parse a template string into tokens.
 * @param template - the input template string
 * @returns array of TemplateTokens
 */
export const parseTemplate = (template: string): TemplateToken[] => {
	const tokens: TemplateToken[] = [];
	// Matches patterns like:
	// {{ urlencodedcontent }}, {{urlencodedcontent}}
	const re = /{{\s*([^\s}]+)\s*}}/g;
	let lastIndex = 0;
	let m: RegExpExecArray | null;

	while (true) {
		m = re.exec(template);
		if (m === null) {
			break;
		}

		const matchStart = m.index;
		const matchEnd = re.lastIndex;

		// text before match
		if (matchStart > lastIndex) {
			tokens.push({
				type: "TEXT",
				text: template.slice(lastIndex, matchStart),
			});
		}

		// matched expression
		const expression = m[1];

		let data = {};
		try {
			data = JSON.parse(decodeURIComponent(expression));
		} catch (_e) {}

		// variable token
		tokens.push({
			type: "DATA",
			data: data,
		});

		lastIndex = matchEnd;
	}

	// trailing text
	if (lastIndex < template.length) {
		tokens.push({
			type: "TEXT",
			text: template.slice(lastIndex),
		});
	}

	return tokens;
};

/**
 * Generate a template string from tokens.
 *
 * @param tokens - array of TemplateToken
 * @returns reconstructed string
 */
export const generateTemplate = (
	tokens: (TextTemplateToken | Omit<DataTemplateToken, "expression">)[],
): string => {
	const parts = [];
	for (const t of tokens) {
		if (t.type === "TEXT") {
			parts.push(t.text);
		} else {
			parts.push(`{{${encodeURIComponent(JSON.stringify(t.data))}}}`);
		}
	}
	return parts.join("");
};
