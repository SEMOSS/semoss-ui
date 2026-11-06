import { ServerIcon, Trash2Icon } from "lucide-react";
import { useId, useState, useSyncExternalStore } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	H2,
	Muted,
} from "@semoss/ui/next";
import type { InstanceProfile, InstanceStore } from "./instance.store";
import { InstanceForm } from "./instance-form";

/** Props for {@link InstancePickerPage}. */
export interface InstancePickerPageProps {
	/** The saved instances. */
	instances: InstanceStore;
	/** Start the app over on the instance just picked. */
	onUseInstance: () => void;
}

/**
 * Pick the SEMOSS instance to use: the saved ones, each with Use and Remove,
 * and a form to add one, which is all a first launch shows. Picking one
 * starts the app over against it.
 *
 * @component
 */
export const InstancePickerPage = ({
	instances,
	onUseInstance,
}: InstancePickerPageProps) => {
	const { t } = useTranslation("desktop");
	const { instances: saved } = useSyncExternalStore(
		instances.subscribe,
		instances.getSnapshot,
	);
	const [isAdding, setIsAdding] = useState(false);
	const savedLabelId = useId();
	const showForm = isAdding || saved.length === 0;

	const pickInstance = async (instance: InstanceProfile): Promise<void> => {
		await instances.setActiveInstance(instance.id);
		onUseInstance();
	};

	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>
						<H2 className="text-xl">{t("instances.title")}</H2>
					</CardTitle>
					<CardDescription>
						{t("instances.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					{saved.length > 0 && (
						<section
							aria-labelledby={savedLabelId}
							className="flex flex-col gap-2"
						>
							<Muted id={savedLabelId}>
								{t("instances.saved")}
							</Muted>
							<ul className="flex flex-col divide-y divide-border rounded-md border border-border">
								{saved.map((instance) => (
									<li
										key={instance.id}
										className="flex items-center gap-3 p-3"
									>
										<ServerIcon
											aria-hidden
											className="size-4 shrink-0 text-muted-foreground"
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-sm">
												{instance.name}
											</p>
											<p className="truncate text-muted-foreground text-xs">
												{instance.url}
												{instance.module}
											</p>
										</div>
										<Button
											size="sm"
											onClick={() =>
												void pickInstance(instance)
											}
										>
											{t("instances.use")}
										</Button>
										<Button
											size="icon-sm"
											variant="ghost"
											aria-label={t("instances.remove", {
												name: instance.name,
											})}
											onClick={() =>
												void instances.removeInstance(
													instance.id,
												)
											}
										>
											<Trash2Icon aria-hidden />
										</Button>
									</li>
								))}
							</ul>
						</section>
					)}
					{showForm ? (
						<InstanceForm
							onConnect={async (instance) => {
								await instances.saveInstance(instance);
								await pickInstance(instance);
							}}
							onCancel={
								saved.length > 0
									? () => setIsAdding(false)
									: undefined
							}
						/>
					) : (
						<Button
							variant="outline"
							onClick={() => setIsAdding(true)}
						>
							{t("instances.addAnother")}
						</Button>
					)}
				</CardContent>
			</Card>
		</main>
	);
};
