import {
	type Control,
	Controller,
	type UseFormSetValue,
} from "react-hook-form";
import type { ListenerActions } from "@semoss/renderer";
import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface Page {
	id: string;
	route: string;
}

interface RedirectDestinationSelectorProps {
	control: Control<ListenerActions>;
	setValue: UseFormSetValue<ListenerActions>;
	destinationType: string;
	pages: Page[];
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
						value={field.value || ""}
						onValueChange={(value) => {
							setValue("payload.destination", "");
							field.onChange(value);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Destination" />
						</SelectTrigger>
						<SelectContent>
							{["External", "Internal"].map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
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
								<Input
									placeholder="URL"
									value={field.value || ""}
									onChange={field.onChange}
								/>
							) : (
								<Select
									value={field.value || ""}
									onValueChange={field.onChange}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Page" />
									</SelectTrigger>
									<SelectContent>
										{pages.map((page) => (
											<SelectItem
												key={page.id}
												value={`${page.route}`}
											>
												{page.id === "page-1"
													? "/page-1"
													: `/${page.route}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</>
					)}
				/>
			)}
		</>
	);
};
