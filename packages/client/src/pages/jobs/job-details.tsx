import { X } from "lucide-react";
import { useState } from "react";
import {
	Badge,
	Field,
	FieldContent,
	FieldLabel,
	Input,
	Textarea,
} from "@semoss/ui/next";
import { getTagBadgeStyle } from "@/utility/tags";
import type { JobBuilder } from "./job.types";
import { RequiredMark } from "./required-mark";

interface JobDetailsProps {
	/** The job being added or edited */
	builder: JobBuilder;

	/** Set one field of the job */
	setBuilderField: (
		field: keyof JobBuilder,
		value: string | string[] | boolean,
	) => void;
}

/**
 * The job's name, pixel and tags. A tag is added on Enter, a comma or leaving
 * the tag field.
 */
export const JobDetails = (props: JobDetailsProps) => {
	const { builder, setBuilderField } = props;
	const [tagInput, setTagInput] = useState("");
	const tags = (builder.tags as string[]) ?? [];

	const addTag = () => {
		const trimmed = tagInput.trim();
		if (!trimmed) {
			return;
		}

		if (!tags.includes(trimmed)) {
			setBuilderField("tags", [...tags, trimmed]);
		}

		setTagInput("");
	};

	return (
		<div className="flex flex-col gap-6">
			<Field>
				<FieldLabel>
					Name <RequiredMark />
				</FieldLabel>
				<FieldContent>
					<Input
						placeholder="Enter the Name"
						value={builder.name}
						onChange={(e) =>
							setBuilderField("name", e.target.value)
						}
					/>
				</FieldContent>
			</Field>

			<Field>
				<FieldLabel>
					Pixel <RequiredMark />
				</FieldLabel>
				<FieldContent>
					<div className="relative w-full cursor-pointer">
						<Textarea
							placeholder="Enter Pixel"
							value={builder.pixel}
							onChange={(e) =>
								setBuilderField("pixel", e.target.value)
							}
							rows={3}
						/>
					</div>
				</FieldContent>
			</Field>

			<Field>
				<FieldLabel>Tags</FieldLabel>
				<FieldContent>
					<Input
						value={tagInput}
						placeholder='Press "Enter" to add tag'
						onChange={(e) => setTagInput(e.target.value)}
						onBlur={addTag}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === ",") {
								e.preventDefault();
								addTag();
							}
						}}
					/>
					{!!tags.length && (
						<div className="mt-2 flex flex-wrap gap-1">
							{tags.map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="gap-1"
									style={getTagBadgeStyle(tag)}
								>
									{tag}
									<button
										type="button"
										onClick={() =>
											setBuilderField(
												"tags",
												tags.filter((t) => t !== tag),
											)
										}
										className="hover:text-destructive"
										aria-label={`Remove ${tag} tag`}
									>
										<X className="size-3" />
									</button>
								</Badge>
							))}
						</div>
					)}
				</FieldContent>
			</Field>
		</div>
	);
};
