import { SearchIcon, XIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@semoss/ui/next";

/** Props for {@link ConnectorSearchField}. */
export interface ConnectorSearchFieldProps {
	/** What is typed. */
	value: string;
	/** Called as the user types. */
	onChange: (value: string) => void;
	/** The hint, also read as the field's name. */
	placeholder: string;
}

/** A viewer's search box, with a button to clear it. */
export const ConnectorSearchField = ({
	value,
	onChange,
	placeholder,
}: ConnectorSearchFieldProps) => {
	const { t } = useTranslation("connectors");

	return (
		<InputGroup className="h-8 rounded-md bg-background shadow-none">
			<InputGroupInput
				type="search"
				value={value}
				placeholder={placeholder}
				aria-label={placeholder}
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
	);
};
