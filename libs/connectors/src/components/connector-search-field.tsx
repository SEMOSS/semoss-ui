import { SearchIcon, XIcon } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Muted,
} from "@semoss/ui/next";

/** Props for {@link ConnectorSearchField}. */
interface ConnectorSearchFieldProps {
	/** What is typed. */
	value: string;
	/** Called as the user types. */
	onChange: (value: string) => void;
	/** The hint, also read as the field's name. */
	placeholder: string;
	/** How the search reads what is typed, shown under the field when given. */
	description?: string;
}

/** A viewer's search box, with a button to clear it. */
export const ConnectorSearchField = ({
	value,
	onChange,
	placeholder,
	description,
}: ConnectorSearchFieldProps) => {
	const { t } = useTranslation("connectors");
	const descriptionId = useId();

	// the description follows the field rather than wrapping it, so the field
	// keeps its place, and its focus, when the description comes and goes
	return (
		<>
			<InputGroup className="h-8 rounded-md bg-background shadow-none">
				<InputGroupInput
					type="search"
					value={value}
					placeholder={placeholder}
					aria-label={placeholder}
					aria-describedby={description ? descriptionId : undefined}
					onChange={(event) => onChange(event.target.value)}
				/>
				<InputGroupAddon>
					<SearchIcon aria-hidden />
				</InputGroupAddon>
				{value ? (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							size="icon-xs"
							aria-label={t("common.clearSearch")}
							onClick={() => onChange("")}
						>
							<XIcon aria-hidden />
						</InputGroupButton>
					</InputGroupAddon>
				) : null}
			</InputGroup>
			{description ? (
				<Muted id={descriptionId} className="text-xs">
					{description}
				</Muted>
			) : null}
		</>
	);
};
