import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type { HttpRequestConfig } from "@/pages/workflow/workflow.types";
import { BoundInput } from "./shared";

export function HttpRequestForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: HttpRequestConfig;
	upstreamVars: string[];
	onChange: (c: HttpRequestConfig) => void;
}) {
	const showBody = ["POST", "PUT", "PATCH"].includes(config.method);
	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2">
				<Field className="w-28 shrink-0">
					<FieldLabel>Method</FieldLabel>
					<Select
						value={config.method}
						onValueChange={(v) =>
							onChange({
								...config,
								method: v as HttpRequestConfig["method"],
							})
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(
								[
									"GET",
									"POST",
									"PUT",
									"PATCH",
									"DELETE",
								] as const
							).map((m) => (
								<SelectItem key={m} value={m}>
									{m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<BoundInput
					label="URL"
					value={config.url}
					placeholder="https://api.example.com/v1/data"
					onChange={(v) => onChange({ ...config, url: v })}
					upstreamVars={upstreamVars}
				/>
			</div>
			<Field>
				<FieldLabel>Headers (JSON)</FieldLabel>
				<Textarea
					value={config.headers ?? ""}
					onChange={(e) =>
						onChange({ ...config, headers: e.target.value })
					}
					placeholder={
						// biome-ignore lint/suspicious/noTemplateCurlyInString: placeholder shows ${token} as example
						'{"Content-Type": "application/json", "Authorization": "Bearer ${token}"}'
					}
					className="font-mono text-xs"
					rows={3}
				/>
			</Field>
			{showBody && (
				<Field>
					<FieldLabel>Body</FieldLabel>
					<div className="relative">
						<Textarea
							value={config.body ?? ""}
							onChange={(e) =>
								onChange({ ...config, body: e.target.value })
							}
							// biome-ignore lint/suspicious/noTemplateCurlyInString: placeholder shows ${upstream_var} as example
							placeholder={'{"key": "${upstream_var}"}'}
							className="font-mono text-xs"
							rows={5}
						/>
						{upstreamVars.length > 0 && (
							<div className="mt-1 flex flex-wrap gap-1">
								{upstreamVars.map((v) => (
									<button
										key={v}
										type="button"
										className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent"
										onClick={() =>
											onChange({
												...config,
												body: `${config.body ?? ""}\${${v}}`,
											})
										}
									>
										{`\${${v}}`}
									</button>
								))}
							</div>
						)}
					</div>
				</Field>
			)}
			<details className="group rounded-md border border-border">
				<summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-muted-foreground text-xs hover:text-foreground">
					<span>Basic Auth (optional)</span>
					<span className="text-[10px]">▸</span>
				</summary>
				<div className="flex flex-col gap-3 border-border border-t p-3">
					<Field>
						<FieldLabel>Username</FieldLabel>
						<Input
							value={config.username ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									username: e.target.value,
								})
							}
							placeholder="api_user"
						/>
					</Field>
					<Field>
						<FieldLabel>Password</FieldLabel>
						<Input
							type="password"
							value={config.password ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									password: e.target.value,
								})
							}
							placeholder="••••••••"
						/>
					</Field>
				</div>
			</details>
		</div>
	);
}
