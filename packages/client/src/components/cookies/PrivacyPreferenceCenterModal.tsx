import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
	Button,
	IconButton,
	Modal,
	Stack,
	styled,
	Tabs,
	Typography,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";

const StyledModal = styled(Modal)({
	"& .MuiPaper-root": {
		overflowY: "auto",
	},
});
const StyledModalHeader = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(2),
}));

const StyledContent = styled("div")(({ theme }) => ({
	borderTop: `1px solid ${theme.palette.divider}`,
	borderBottom: `1px solid ${theme.palette.divider}`,
	paddingBottom: theme.spacing(2),
	width: "100%",
}));

const StyledTabBox = styled("div")(({ theme }) => ({
	display: "grid",
	gap: theme.spacing(3),
	gridTemplateColumns: "250px 1fr",
}));

const StyledText = styled("div")(({ theme }) => ({
	paddingTop: theme.spacing(3),
}));

const StyledBodyText = styled("div")(({ theme }) => ({
	padding: `${theme.spacing(2)} ${theme.spacing(2)} 0`,
}));

const StyledFooter = styled("div")(({ theme }) => ({
	padding: theme.spacing(2),
}));

interface PrivacyPreferenceCenterProps {
	/** determines if the modal is displayed or not */
	isOpen: boolean;

	/** function called when the user attempts to close the modal. */
	onClose: (boolean) => void;
}

export const PrivacyPreferenceCenterModal = (
	props: PrivacyPreferenceCenterProps,
) => {
	const { isOpen, onClose } = props;
	const { configStore } = useRootStore();
	const [cookiePolicyOrder, setCookiePolicyOrder] = useState<string[]>([]);
	const [cookiePolicies, setCookiePolicies] = useState({});
	const [cookiePolicyModalHeader, setCookiePolicyModalHeader] = useState("");
	const [cookiePolicyModalBody, setCookiePolicyModalBody] = useState("");
	const [selectedTab, setTab] = useState<string | number>(0);

	useEffect(() => {
		const theme = configStore.theme;

		try {
			const order = theme["cookiePolicyOrderReact"]
				? theme["cookiePolicyOrderReact"]
				: [];
			setCookiePolicyOrder(order);
			const policies = theme["cookiePoliciesReact"]
				? theme["cookiePoliciesReact"]
				: {};
			setCookiePolicies(policies);
			const body = theme["cookiePolicyModalBodyReact"]
				? theme["cookiePolicyModalBodyReact"]
				: "";
			setCookiePolicyModalBody(body);
			const header = theme["cookiePolicyModalHeaderReact"]
				? theme["cookiePolicyModalHeaderReact"]
				: "Privacy Preference Center";
			setCookiePolicyModalHeader(header);
		} catch {
			console.error(
				"Unable to parse theme for Privacy Preference Center",
			);
		}
	}, [configStore.theme]);

	return (
		<StyledModal open={isOpen} fullWidth maxWidth="lg" onClose={onClose}>
			<StyledModalHeader
				direction="row"
				justifyContent="space-between"
				alignItems="center"
			>
				<Typography variant="h6">{cookiePolicyModalHeader}</Typography>

				<IconButton onClick={onClose}>
					<Close />
				</IconButton>
			</StyledModalHeader>

			<StyledContent>
				{cookiePolicyOrder.length > 0 &&
				Object.keys(cookiePolicies).length > 0 ? (
					<StyledTabBox>
						<Tabs
							value={selectedTab}
							onChange={(e, val) => setTab(val)}
							orientation="vertical"
						>
							{cookiePolicyOrder.map((name, idx) => (
								<Tabs.Item
									value={idx}
									label={name}
									key={`tab-${name}-${idx}`}
								/>
							))}
						</Tabs>

						<StyledText
							id="modal-content"
							dangerouslySetInnerHTML={{
								__html:
									cookiePolicies[
										cookiePolicyOrder[selectedTab]
									] || "",
							}}
						/>
					</StyledTabBox>
				) : (
					<StyledBodyText
						id="cookie-modal-body"
						dangerouslySetInnerHTML={{
							__html: cookiePolicyModalBody,
						}}
					/>
				)}
			</StyledContent>

			<StyledFooter>
				<Button variant="contained" onClick={onClose}>
					Close
				</Button>
			</StyledFooter>
		</StyledModal>
	);
};
