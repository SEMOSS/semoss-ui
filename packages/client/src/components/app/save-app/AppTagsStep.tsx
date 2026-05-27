import { X } from "lucide-react";
import { useId, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { Badge, Input, Label } from "@semoss/ui/next";
import { ADD_APP_FORM_FIELD_TAGS } from "./save-app.constants";

export const AppTagsStep = (props: {
	// biome-ignore lint/suspicious/noExplicitAny: react-hook-form generic
	control: Control<any, any>;
}) => {
	const [tagInput, setTagInput] = useState("");
	const tagId = useId();

	return (
		<Controller
			name={ADD_APP_FORM_FIELD_TAGS}
			control={props.control}
			rules={{}}
			render={({ field }) => {
				const tags: string[] = field.value || [];

				const addTag = () => {
					const trimmed = tagInput.trim();
					if (trimmed && !tags.includes(trimmed)) {
						field.onChange([...tags, trimmed]);
					}
					setTagInput("");
				};

				return (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={tagId}>Tags</Label>
						<Input
							id={tagId}
							value={tagInput}
							placeholder='Press "Enter" to add tag'
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addTag();
								}
							}}
						/>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="gap-1"
									>
										{tag}
										<button
											type="button"
											onClick={() =>
												field.onChange(
													tags.filter(
														(t) => t !== tag,
													),
												)
											}
											className="hover:text-destructive"
										>
											<X className="size-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>
				);
			}}
		/>
	);
};
