import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
} from "../../../store";

type SendEmailFormValues = {
	smtpHost: string;
	smtpPort: string;
	subject: string;
	to: string;
	cc: string;
	bcc: string;
	from: string;
	message: string;
	username: string;
	password: string;
};

export interface SendEmailCellDef extends CellDef<"send-email"> {
	widget: "send-email";
	parameters: {
		smtpHost: string;
		smtpPort: string;
		subject: string;
		to: string;
		cc: string;
		bcc: string;
		from: string;
		message: string;
		username: string;
		password: string;
	};
}

export const SendEmailCell: CellComponent<SendEmailCellDef> = observer(
	(props) => {
		const _editorRef = useRef(null);

		const { cell, isExpanded: _isExpanded } = props;
		const { state } = useBlocks();
		const { control } = useForm<SendEmailFormValues>();

		const handleChange = (newValue, path) => {
			if (cell.isLoading) return;
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path,
					value: newValue,
				},
			});
		};

		return (
			<div className="flex w-full flex-col gap-4">
				<div className="flex flex-row items-center gap-2">
					<Controller
						name="smtpHost"
						control={control}
						defaultValue="localhost"
						rules={{ required: "Host is required" }}
						render={({ field }) => (
							<Input
								placeholder="smtpHost"
								defaultValue="localhost"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(
										newValue,
										"parameters.smtpHost",
									);
								}}
							/>
						)}
					/>
					<Controller
						name="smtpPort"
						control={control}
						defaultValue="1025"
						rules={{ required: "Port is required" }}
						render={({ field }) => (
							<Input
								placeholder="smtpPort"
								defaultValue="1025"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(
										newValue,
										"parameters.smtpPort",
									);
								}}
							/>
						)}
					/>
				</div>
				<div className="mt-[50px] flex flex-row items-center gap-2">
					<Controller
						name="username"
						control={control}
						defaultValue=""
						rules={{ required: "Username is required" }}
						render={({ field }) => (
							<Input
								placeholder="username"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(
										newValue,
										"parameters.username",
									);
								}}
							/>
						)}
					/>
					<Controller
						name="password"
						control={control}
						defaultValue=""
						rules={{ required: "Password is required" }}
						render={({ field }) => (
							<Input
								placeholder="password"
								type="password"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(
										newValue,
										"parameters.password",
									);
								}}
							/>
						)}
					/>
				</div>
				<div className="mt-[50px] flex flex-row items-center gap-2">
					<Controller
						name="from"
						control={control}
						defaultValue=""
						rules={{
							pattern: {
								value: /^S+@\S+\.\S+$/,
								message: "Invalid email format",
							},
						}}
						render={({ field }) => (
							<Input
								placeholder="from"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(newValue, "parameters.from");
								}}
							/>
						)}
					/>
					<Controller
						name="to"
						control={control}
						defaultValue=""
						rules={{
							required: "To is required",
							pattern: {
								value: /^S+@\S+\.\S+$/,
								message: "Invalid email format",
							},
						}}
						render={({ field }) => (
							<Input
								placeholder="to"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(newValue, "parameters.to");
								}}
							/>
						)}
					/>
				</div>
				<div className="mt-[50px] flex flex-row items-center gap-2">
					<Controller
						name="cc"
						control={control}
						defaultValue=""
						rules={{
							pattern: {
								value: /^S+@\S+\.\S+$/,
								message: "Invalid email format",
							},
						}}
						render={({ field }) => (
							<Input
								placeholder="cc"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(newValue, "parameters.cc");
								}}
							/>
						)}
					/>
					<Controller
						name="bcc"
						control={control}
						defaultValue=""
						rules={{
							pattern: {
								value: /^S+@\S+\.\S+$/,
								message: "Invalid email format",
							},
						}}
						render={({ field }) => (
							<Input
								placeholder="bcc"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(newValue, "parameters.bcc");
								}}
							/>
						)}
					/>
				</div>
				<div className="mt-[50px]">
					<Controller
						name="subject"
						control={control}
						defaultValue=""
						rules={{ required: "Subject is required" }}
						render={({ field }) => (
							<Input
								placeholder="subject"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(
										newValue,
										"parameters.subject",
									);
								}}
							/>
						)}
					/>
				</div>
				<div className="mt-[50px]">
					<Controller
						name="message"
						control={control}
						defaultValue=""
						rules={{ required: "Message is required" }}
						render={({ field }) => (
							<textarea
								className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								placeholder="message"
								onChange={(e) => {
									const newValue = e.target.value;
									field.onChange(newValue);
									handleChange(
										newValue,
										"parameters.message",
									);
								}}
							/>
						)}
					/>
				</div>
			</div>
		);
	},
);
