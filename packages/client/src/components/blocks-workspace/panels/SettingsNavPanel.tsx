import {
	LayoutGrid as AppShortcut,
	ClipboardList as AssignmentOutlined,
	Monitor as DvrOutlined,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { FlexLayout } from "@/components/flex-layout";
import { Panel } from "@/components/workspace";
import { useWorkspace } from "@/hooks";

const SETTINGS_OPTIONS: {
	label: string;
	value: SettingValues;
	icon?: JSX.Element;
}[] = [
	{ label: "Members", value: "CURRENT", icon: <DvrOutlined /> },
	{ label: "Apps", value: "APP", icon: <AppShortcut /> },
	{ label: "General", value: "GENERAL", icon: <AssignmentOutlined /> },
];

type SettingValues = "CURRENT" | "GENERAL" | "APP";

export const SettingsNavPanel = observer(() => {
	const { workspace } = useWorkspace();

	const { Actions, DockLocation, TabNode } = FlexLayout;
	const addSettingsTab = (option) => {
		// get the model
		const model = workspace.model;
		if (!model) throw new Error("Missing model");

		let selectedNode: FlexLayout.TabNode | null = null;

		// visit the notes, and see if it exists
		model.visitNodes((node) => {
			// check if it is a tabNode and it needs to be a settingsPanel
			if (
				node instanceof TabNode &&
				node.getComponent() === "settingsPanel"
			) {
				const config = node.getConfig();
				if (option.value === config.value) {
					selectedNode = node;
				}
			}
		});

		// create a new panel if there is no node
		if (!selectedNode) {
			const addId =
				model.getActiveTabset()?.getId() ||
				model.getRoot().getChildren()[0]?.getId() ||
				"";

			model.doAction(
				Actions.addNode(
					{
						type: "tab",
						name: option.label,
						component: "settingsPanel",
						config: { value: option.value },
						enableClose: true,
					},
					addId,
					DockLocation.CENTER,
					-1,
					true,
				),
			);
		} else {
			model.doAction(Actions.selectTab(selectedNode.getId()));
		}
	};

	return (
		<Panel>
			<div className="mt-2 mb-2 w-fit rounded-2xl bg-primary/10 px-4">
				<span className="mt-2 mb-2 inline-block font-normal text-[13px] text-primary leading-[18px] tracking-[0.16px]">
					Settings
				</span>
			</div>
			<div className="flex flex-col justify-between">
				{SETTINGS_OPTIONS.map((item) => {
					return (
						<button
							key={item.value}
							type="button"
							className="flex w-full flex-row items-center gap-3 px-4 py-2 text-left text-foreground text-sm transition-colors duration-150 hover:bg-primary/10"
							onClick={() => addSettingsTab(item)}
							aria-label={item.label}
						>
							<span className="flex size-5 shrink-0 items-center justify-center">
								{item.icon}
							</span>
							<span>{item.label}</span>
						</button>
					);
				})}
			</div>
		</Panel>
	);
});
