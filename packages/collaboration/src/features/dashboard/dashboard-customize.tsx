import { Eye, LayoutGrid, Plus, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Form,
	FormInput,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useDashboard } from "./dashboard.context";
import { DashboardAppPicker } from "./dashboard-app-picker";

const presetSchema = z.object({
	name: z.string().trim().min(1, "Enter a preset name.").max(60),
});

/** All layout and preset edits are staged together until Save layout succeeds. */
export function DashboardCustomize() {
	const { layout } = useDashboard();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isNamingPreset, setIsNamingPreset] = useState(false);
	const form = useForm<z.infer<typeof presetSchema>>({
		resolver: zodResolver(presetSchema),
		defaultValues: { name: "" },
	});
	return (
		<div className="mb-5 space-y-3 rounded-xl border border-primary/30 bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<div className="mr-auto">
					<p className="font-medium">Make this space yours</p>
					<p className="text-muted-foreground text-sm">
						Drag to arrange. Resize a corner, or use each tile’s
						settings.
					</p>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<LayoutGrid aria-hidden="true" />
							Presets
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{[
							"Balanced",
							"Focus",
							"Meetings",
							...layout.draft.presets.map(
								(preset) => preset.name,
							),
						].map((name) => (
							<DropdownMenuItem
								key={name}
								onSelect={() => layout.applyPreset(name)}
							>
								{name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<Eye aria-hidden="true" />
							Widgets
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{layout.draft.widgets.map((widget) => (
							<DropdownMenuItem
								key={widget.id}
								onSelect={() =>
									layout.setWidgets(
										layout.draft.widgets.map((entry) =>
											entry.id === widget.id
												? {
														...entry,
														visible: !entry.visible,
													}
												: entry,
										),
									)
								}
							>
								{widget.visible ? "Hide" : "Show"}{" "}
								{widget.title}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setIsPickerOpen(true)}
				>
					<Plus aria-hidden="true" />
					Add app
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setIsNamingPreset((value) => !value)}
				>
					<Save aria-hidden="true" />
					Save preset
				</Button>
				<Button size="sm" variant="ghost" onClick={layout.reset}>
					<RotateCcw aria-hidden="true" />
					Reset
				</Button>
				<Button size="sm" variant="outline" onClick={layout.cancel}>
					Cancel
				</Button>
				<Button size="sm" onClick={layout.save}>
					Save layout
				</Button>
			</div>
			{isNamingPreset && (
				<Form
					form={form}
					onSubmit={({ name }) => {
						const error = layout.savePreset(name);
						if (error) form.setError("name", { message: error });
						else {
							form.reset();
							setIsNamingPreset(false);
						}
					}}
					className="flex flex-wrap items-end gap-2"
					noValidate
				>
					<FormInput name="name" label="Preset name" required />
					<Button size="sm" type="submit">
						Keep preset
					</Button>
				</Form>
			)}
			{layout.error && (
				<Alert variant="destructive">
					<AlertDescription>{layout.error}</AlertDescription>
				</Alert>
			)}
			<DashboardAppPicker
				isOpen={isPickerOpen}
				onClose={() => setIsPickerOpen(false)}
			/>
		</div>
	);
}
