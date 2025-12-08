import {
	AppShortcut,
	AssignmentOutlined,
	DvrOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { List, styled } from "@semoss/ui";
import { FlexLayout } from "@/components/flex-layout";
import { Panel } from "@/components/workspace";
import { useWorkspace } from "@/hooks";

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	flexDirection: "column",
}));

const StyledTitle = styled("div")(({ theme }) => ({
	borderRadius: "16px",
	background: "#EBF4FE",
	width: "fit-content",
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	marginBottom: "8px",
	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
	"&&": {
		marginTop: theme.spacing(1),
	},
}));

const StyledTitleSpan = styled("span")(({ theme }) => ({
	color: "var(--Primary-Dark, #1260DD)",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontSize: "13px",
	fontFamily: "Inter",
	fontWeight: 400,
	fontStyle: "normal",
	letterSpacing: "0.16px",
	lineHeight: "18px",
	marginBottom: "8px",
	marginTop: "8px",
}));

const StyledListItemBtn = styled(List.ItemButton)(({ theme }) => ({
	color: theme.palette.text.primary,
	width: "100%",
	textAlign: "left",
	"&:hover": {
		backgroundColor: theme.palette.primary.selected,
	},
}));

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
			<StyledTitle>
				<StyledTitleSpan>Settings</StyledTitleSpan>
			</StyledTitle>
			<StyledContainer>
				{SETTINGS_OPTIONS.map((item) => {
					return (
						<StyledListItemBtn
							key={item.value}
							onClick={() => addSettingsTab(item)}
							aria-label={item.label}
							dense={true}
						>
							<List.ItemIcon>{item.icon}</List.ItemIcon>
							<List.ItemText primary={item.label} />
						</StyledListItemBtn>
					);
				})}
			</StyledContainer>
		</Panel>
	);
});
