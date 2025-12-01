import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { ActionMessages, type BlockJSON, useBlocks } from "@semoss/renderer";
import { getBlockElement } from "@/stores";
import { DEFAULT_MENU } from "../blocks-workspace/menus/default-menu";
import type { DesignerMenuItem } from "../blocks-workspace/menus/menu-types";
import { FormMenu } from "./FormMenu";

export const FormMenuHost = observer(() => {
	const { state } = useBlocks();

	const [open, setOpen] = useState(false);
	const [formId, setFormId] = useState<string | null>(null);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	const systemItems: DesignerMenuItem[] = useMemo(
		() => DEFAULT_MENU.filter((item) => item.section === "Input"),
		[],
	);

	const handleClose = () => {
		setOpen(false);
		setFormId(null);
		setAnchorEl(null);
	};

	useEffect(() => {
		const handleOpen = (e: Event) => {
			const { detail } = e as CustomEvent<{ formId: string }>;
			const newFormId = detail?.formId;
			if (!newFormId) return;

			const formBlock = state.getBlock(newFormId);
			if (!formBlock) return;

			const ele = getBlockElement(newFormId);

			setFormId(newFormId);
			setAnchorEl(ele instanceof HTMLElement ? ele : null);
			setOpen(true);
		};

		const handleCloseEvent = () => handleClose();

		window.addEventListener("FORM_MENU_OPEN", handleOpen as EventListener);
		window.addEventListener("FORM_MENU_CLOSE", handleCloseEvent);

		return () => {
			window.removeEventListener(
				"FORM_MENU_OPEN",
				handleOpen as EventListener,
			);
			window.removeEventListener("FORM_MENU_CLOSE", handleCloseEvent);
		};
	}, [state]); // handleClose is stable enough here for this usage

	const formBlock = formId ? state.getBlock(formId) : null;

	const handleSelect = async (blockJson: BlockJSON) => {
		if (!formBlock) return;

		await state.dispatch({
			message: ActionMessages.ADD_BLOCK,
			payload: {
				json: blockJson,
				position: {
					parent: formBlock.id,
					slot: "children",
				},
			},
		});

		handleClose();
	};

	if (!open || !formBlock) return null;

	return (
		<FormMenu
			parentId={formBlock.id}
			anchorEl={anchorEl}
			onClose={handleClose}
			onSelect={handleSelect}
			systemItems={systemItems}
		/>
	);
});
