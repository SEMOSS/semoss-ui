import { useId } from "react";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldTitle,
	RadioGroupItem,
} from "@semoss/ui/next";

/** Props for {@link GrantChoiceCard}. */
export interface GrantChoiceCardProps {
	/** The choice's value in its radio group */
	value: string;
	/** Its title */
	title: string;
	/** What choosing it means */
	description: string;
}

/**
 * One choice of a radio group in Add Access, as a card with its title and what
 * choosing it means. Put it inside a `RadioGroup`.
 */
export const GrantChoiceCard = ({
	value,
	title,
	description,
}: GrantChoiceCardProps) => {
	const id = useId();
	return (
		<FieldLabel htmlFor={id} className="cursor-pointer">
			<Field orientation="horizontal">
				<FieldContent>
					<FieldTitle>{title}</FieldTitle>
					<FieldDescription>{description}</FieldDescription>
				</FieldContent>
				<RadioGroupItem value={value} id={id} />
			</Field>
		</FieldLabel>
	);
};
