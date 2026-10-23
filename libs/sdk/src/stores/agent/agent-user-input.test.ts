import { describe, expect, it } from "vitest";
import { parseUserInputRequest } from "./agent-user-input";

describe("parseUserInputRequest", () => {
	it("keeps question and option collections without upper bounds", () => {
		const options = Array.from({ length: 6 }, (_, index) => ({
			label: `Option ${index + 1}`,
			value: String(index + 1),
		}));
		const questions = Array.from({ length: 4 }, (_, index) => ({
			id: `question-${index + 1}`,
			question: `Question ${index + 1}`,
			type: "single_select",
			options,
		}));

		const request = parseUserInputRequest({ toolArgs: { questions } });

		expect(request?.questions).toHaveLength(4);
		expect(request?.questions[0].options).toHaveLength(6);
	});

	it("does not expose the retired required flag", () => {
		const request = parseUserInputRequest({
			toolArgs: {
				questions: [
					{
						id: "database",
						question: "Which database?",
						type: "text",
						required: true,
					},
				],
			},
		});

		expect(request?.questions[0]).not.toHaveProperty("required");
	});
});
