import { Visibility } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type React from "react";
import { type CSSProperties, useCallback, useEffect, useState } from "react";
import { Button, Tooltip } from "@semoss/ui";
import { useBlock, useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type BlockComponent,
	type BlockDef,
	type ListenerActions,
} from "../../../store";
import { Slot } from "../../blocks";

export interface FormBlockDef extends BlockDef<"form"> {
	widget: "form";
	data: {
		style: CSSProperties;
		show: string;
		loading: boolean | string;
		database: string;
		type: string;
		table: string;
		column: string[];
		dimension?: null | string;
		rowSpacing?: null | string;
	};
	slots: {
		children: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onSubmit: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

type FormValue = {
	name: string;
	value: unknown;
};

export const FormBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<FormBlockDef>(id);
	const { state } = useBlocks();
	const [hasRequiredError, setHasRequiredError] = useState(false);
	const [formValues, setFormValues] = useState<FormValue[]>([]);
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);
	/**
	 * Validate all required children and sync submit button disabled state.
	 * Returns true if form is valid, false otherwise.
	 */
	const validateAndSyncSubmitButtons = useCallback((): boolean => {
		const formBlock = state.getBlock(id);
		console.log("Validating form block:", formBlock);
		if (!formBlock) {
			setHasRequiredError(false);
			setFormValues([]);
			return true;
		}

		const childIds: string[] = formBlock.slots?.children?.children || [];

		let hasRequiredErrorLocal = false;
		const nextFormValues: FormValue[] = [];

		for (const childId of childIds) {
			const childBlock = state.getBlock(childId);
			if (!childBlock) continue;

			const data = childBlock.data || {};
			const getLabel = (childBlock): string | null => {
				const lbl = childBlock?.data?.label;
				return typeof lbl === "string" ? lbl : null;
			};
			const label = getLabel(childBlock);

			let value: unknown;

			value =
				data.value ??
				data.defaultValue ??
				(Array.isArray(data.value) ? data.value : "");

			if (label) {
				nextFormValues.push({
					name: label,
					value,
				});
			}

			const required = data.required;
			const isEmpty =
				value === "" ||
				value === null ||
				typeof value === "undefined" ||
				(Array.isArray(value) && value.length === 0);

			if (required && isEmpty) {
				hasRequiredErrorLocal = true;
			}
		}

		setHasRequiredError(hasRequiredErrorLocal);
		setFormValues(nextFormValues);

		for (const childId of childIds) {
			const childBlock = state.getBlock(childId);
			if (
				childBlock?.widget === "button" &&
				childBlock.data?.type === "submit"
			) {
				const currentDisabled = !!childBlock.data?.disabled;
				const desiredDisabled = hasRequiredErrorLocal;

				if (currentDisabled !== desiredDisabled) {
					state.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: childId,
							path: "disabled",
							value: desiredDisabled,
						},
					});

					const updated = state.getBlock(childId);
					console.log(
						`After update ${childId}.data.disabled =`,
						updated?.data?.disabled,
					);
				}
			}
		}

		return !hasRequiredErrorLocal;
	}, [id, state]);

	useEffect(() => {
		validateAndSyncSubmitButtons();
	}, [validateAndSyncSubmitButtons]);

	const handleFormChange = () => {
		validateAndSyncSubmitButtons();
	};
	console.log("Form values from FormData:", formValues);
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log("Form submitted", e.target);

		const isValid = validateAndSyncSubmitButtons();
		if (!isValid) return;
		console.log("Form values from FormData:", formValues);

		if (listeners.onSubmit) {
			listeners.onSubmit();
		}
	};

	console.log(state.getBlock("checkbox--1"));
	const block = state.getBlock(id);

	const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		state.dispatch({
			message: ActionMessages.DISPATCH_EVENT,
			payload: {
				name: "FORM_MENU_OPEN",
				detail: {
					formId: id,
				},
			},
		});
	};

	return (
		<form
			onSubmit={handleSubmit}
			onChange={handleFormChange}
			style={{
				...data.style,
				display: "flex",
				overflowWrap: "anywhere",
				flexDirection: "column",
				gap: "8px",
			}}
			{...attrs}
		>
			{hasRequiredError && (
				<Tooltip title="Please fill all the required fields">
					<Visibility color="error" fontSize="small" />
				</Tooltip>
			)}

			{block?.data?.type === "manual" ? (
				slots?.children?.children?.length < 1 && (
					<Button type="button" onClick={handleAddClick}>
						Add Input
					</Button>
				)
			) : (
				<div
					style={{
						fontSize: ".875rem",
						height: "fit-content(8px)",
						width: "fit-content(8px)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						textOverflow: "hidden",
					}}
				>
					Select a form type to generate fields
				</div>
			)}
			<Slot slot={slots.children}></Slot>
		</form>
	);
});
