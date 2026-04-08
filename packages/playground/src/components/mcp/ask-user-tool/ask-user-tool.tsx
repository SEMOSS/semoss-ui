import { CheckIcon, SendIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
import {
	Button,
	Checkbox,
	Input,
	RadioGroup,
	RadioGroupItem,
	Textarea,
} from "@semoss/ui/next";
import type { RoomStore, ToolStore } from "@/stores";

interface AskUserToolProps {
	/** Room store */
	room: RoomStore;

	/** Tool store for the active askUser tool */
	tool: ToolStore;

	/** Callback when overlay is dismissed */
	onClose: () => void;
}

type InputType =
	| "text"
	| "single_select"
	| "multi_select"
	| "yes_no"
	| "buttons";

interface AskUserParams {
	question: string;
	input_type: InputType;
	options?: string[];
	placeholder?: string;
}

export const AskUserTool: React.FC<AskUserToolProps> = observer(
	({ room, tool, onClose }) => {
		const params = (tool.parameters || {}) as Partial<AskUserParams>;
		const question =
			params.question || "The assistant has a question for you.";
		const inputType: InputType = params.input_type || "text";
		const options = params.options || [];
		const placeholder = params.placeholder || "Type your answer...";

		const [textValue, setTextValue] = useState("");
		const [singleValue, setSingleValue] = useState("");
		const [multiValues, setMultiValues] = useState<string[]>([]);
		const baseId = useId();
		const [isSubmitting, setIsSubmitting] = useState(false);

		const messageId = tool.toolCallMessage?.id;

		const handleSubmit = async (answer: string) => {
			if (!answer.trim() || isSubmitting || !messageId) return;
			setIsSubmitting(true);

			try {
				await room.processTool(messageId, tool.id, answer, "success", {
					...params,
					user_response: answer,
				});
				onClose();
			} catch (e) {
				console.error("askUser submit failed:", e);
			} finally {
				setIsSubmitting(false);
			}
		};

		const handleButtonClick = (value: string) => {
			handleSubmit(value);
		};

		const handleMultiSubmit = () => {
			if (multiValues.length === 0) return;
			handleSubmit(multiValues.join(", "));
		};

		const toggleMultiValue = (value: string) => {
			setMultiValues((prev) =>
				prev.includes(value)
					? prev.filter((v) => v !== value)
					: [...prev, value],
			);
		};

		return (
			<div className="flex max-h-96 flex-col rounded-xl border border-border bg-background shadow-lg">
				{/* Header: navigation + close */}
				<div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1">
					<span className="text-muted-foreground text-sm">
						Follow-up Question
					</span>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close"
					>
						<XIcon className="size-4" />
					</Button>
				</div>

				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto px-4">
					<p className="mb-3 font-medium text-base">{question}</p>

					{inputType === "text" && (
						<Textarea
							placeholder={placeholder}
							value={textValue}
							onChange={(e) => setTextValue(e.target.value)}
							className="min-h-20 resize-none"
							disabled={isSubmitting}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSubmit(textValue);
								}
							}}
						/>
					)}

					{inputType === "single_select" && (
						<RadioGroup
							value={singleValue}
							onValueChange={setSingleValue}
						>
							{options.map((option, idx) => (
								<label
									key={option}
									htmlFor={`${baseId}-single-${idx}`}
									className="flex cursor-pointer items-center gap-3 border-border border-b py-3 last:border-b-0"
								>
									<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-sm">
										{idx + 1}
									</span>
									<span className="flex-1 text-sm">
										{option}
									</span>
									<RadioGroupItem
										id={`${baseId}-single-${idx}`}
										value={option}
										className="sr-only"
									/>
									{singleValue === option && (
										<CheckIcon className="size-4 text-primary" />
									)}
								</label>
							))}
							{/* Custom input option */}
							<label
								htmlFor={`${baseId}-single-custom`}
								className="flex cursor-pointer items-center gap-3 py-3"
							>
								<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-sm">
									✎
								</span>
								<Input
									id={`${baseId}-single-custom`}
									placeholder="Type your answer..."
									className="flex-1"
									value={
										singleValue &&
										!options.includes(singleValue)
											? singleValue
											: ""
									}
									onChange={(e) =>
										setSingleValue(e.target.value)
									}
									onFocus={() => {
										if (options.includes(singleValue)) {
											setSingleValue("");
										}
									}}
								/>
							</label>
						</RadioGroup>
					)}

					{inputType === "multi_select" && (
						<div className="flex flex-col">
							{options.map((option, idx) => (
								<label
									key={option}
									htmlFor={`${baseId}-multi-${idx}`}
									className="flex cursor-pointer items-center gap-3 border-border border-b py-3 last:border-b-0"
								>
									<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-sm">
										{idx + 1}
									</span>
									<span className="flex-1 text-sm">
										{option}
									</span>
									<Checkbox
										id={`${baseId}-multi-${idx}`}
										checked={multiValues.includes(option)}
										onCheckedChange={() =>
											toggleMultiValue(option)
										}
									/>
								</label>
							))}
						</div>
					)}

					{inputType === "yes_no" && (
						<div className="flex gap-3 py-2">
							<Button
								variant="outline"
								className="flex-1"
								size="lg"
								onClick={() => handleButtonClick("Yes")}
								disabled={isSubmitting}
							>
								Yes
							</Button>
							<Button
								variant="outline"
								className="flex-1"
								size="lg"
								onClick={() => handleButtonClick("No")}
								disabled={isSubmitting}
							>
								No
							</Button>
						</div>
					)}

					{inputType === "buttons" && (
						<div className="flex flex-wrap gap-2 py-2">
							{options.map((option) => (
								<Button
									key={option}
									variant="outline"
									onClick={() => handleButtonClick(option)}
									disabled={isSubmitting}
								>
									{option}
								</Button>
							))}
						</div>
					)}

					{/* Submit button — inside card body */}
					{(inputType === "text" ||
						inputType === "single_select" ||
						inputType === "multi_select") && (
						<div className="pt-3 pb-1">
							<Button
								className="w-full"
								size="sm"
								onClick={() => {
									if (inputType === "multi_select") {
										handleMultiSubmit();
									} else if (inputType === "single_select") {
										handleSubmit(singleValue);
									} else {
										handleSubmit(textValue);
									}
								}}
								disabled={
									isSubmitting ||
									(inputType === "text" &&
										!textValue.trim()) ||
									(inputType === "single_select" &&
										!singleValue) ||
									(inputType === "multi_select" &&
										multiValues.length === 0)
								}
							>
								<SendIcon className="size-4" />
								{isSubmitting ? "Sending..." : "Submit"}
							</Button>
						</div>
					)}
				</div>
			</div>
		);
	},
);
