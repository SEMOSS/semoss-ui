import { Controller } from "react-hook-form";
import { Select, TextField } from "@semoss/ui";

interface RedirectDestinationSelectorProps {
	control: any;
	setValue: any;
	destinationType: string;
	pages: any[];
}

export const RedirectDestinationSelector = ({
	control,
	setValue,
	destinationType,
	pages,
}: RedirectDestinationSelectorProps) => {
	return (
		<>
			<Controller
				name="payload.destinationType"
				control={control}
				render={({ field }) => (
					<Select
						label="Destination"
						value={field.value || ""}
						onChange={(value) => {
							setValue("payload.destination", "");
							field.onChange(value);
						}}
					>
						{["External", "Internal"].map((type, index) => (
							<Select.Item key={`${type}-${index}`} value={type}>
								{type}
							</Select.Item>
						))}
					</Select>
				)}
			/>

			{destinationType && (
				<Controller
					name="payload.destination"
					control={control}
					render={({ field }) => (
						<>
							{destinationType === "External" ? (
								<TextField
									label="URL"
									value={field.value || ""}
									onChange={field.onChange}
								/>
							) : (
								<Select
									label="Page"
									value={field.value || ""}
									onChange={field.onChange}
								>
									{pages.map((page: any, index: number) => (
										<Select.Item
											key={`${page.id}-${index}`}
											value={`${page.route}`}
										>
											{page.id === "page-1" ? "/page-1" : `/${page.route}`}
										</Select.Item>
									))}
								</Select>
							)}
						</>
					)}
				/>
			)}
		</>
	);
};
