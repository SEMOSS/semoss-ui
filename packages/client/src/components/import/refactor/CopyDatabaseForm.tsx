import { Controller, useForm } from "react-hook-form";
import { Input, Label } from "@semoss/ui/next";

/**
 * @deprecated
 */
export const CopyDatabaseForm = () => {
	const { control } = useForm();

	return (
		<form>
			<div className="flex flex-col gap-2">
				<Controller
					name={"DATABASE_NAME"}
					control={control}
					rules={{ required: true }}
					render={({ field, fieldState: _fieldState }) => {
						return (
							<div>
								<Label htmlFor="database-name">
									Database Name *
								</Label>
								{/* biome-ignore lint/correctness/useUniqueElementIds: IDs are scoped to component instances */}
								<Input
									id="database-name"
									required
									value={field.value ? field.value : ""}
									onChange={(e) =>
										field.onChange(e.target.value)
									}
								/>
							</div>
						);
					}}
				/>
				<Controller
					name={"DATABASE_LOCATION"}
					control={control}
					rules={{ required: false }}
					render={({ field, fieldState: _fieldState }) => {
						return (
							<div>
								<Label htmlFor="database-location">
									Database LOCATION
								</Label>
								{/* biome-ignore lint/correctness/useUniqueElementIds: IDs are scoped to component instances */}
								<Input
									id="database-location"
									value={field.value ? field.value : ""}
									onChange={(e) =>
										field.onChange(e.target.value)
									}
								/>
							</div>
						);
					}}
				/>
			</div>
		</form>
	);
};
