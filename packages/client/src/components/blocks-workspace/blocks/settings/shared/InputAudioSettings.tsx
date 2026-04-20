import { Download, Mic, MicOff } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import { Button, Input } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";

interface InputAudioSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to pass into the input
	 */
	label: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 * Placeholder for text field
	 */
	placeholder?: string;
}

export const InputAudioSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
		label = "",
		path,
		placeholder = "",
	}: InputAudioSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);

		// track the value
		const [value, setValue] = useState<string>(
			(data.value as string) ?? "",
		);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		const [recording, setRecording] = useState(false);
		const [transcript, setTranscript] = useState(
			data.value?.toString() ?? "",
		);
		const [_interimTranscript, setInterimTranscript] = useState("");
		const [mediaRecorder, setMediaRecorder] =
			useState<MediaRecorder | null>(null);
		const recognitionRef = useRef(null);
		const chunks = useRef<Blob[]>([]);

		useEffect(() => {
			if (data.mode === "transcribe") {
				const recognition =
					new // biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
					(window as any).webkitSpeechRecognition();
				recognition.continuous = true;
				recognition.interimResults = true;
				recognition.lang = "en-US";

				recognition.onstart = () => {
					setRecording(true);
					setTranscript("");
				};
				recognition.onend = () => {
					setRecording(false);
				};
				recognition.onresult = (event) => {
					let interim = "";
					let final = "";
					for (
						let i = event.resultIndex;
						i < event.results.length;
						++i
					) {
						if (event.results[i].isFinal) {
							final += event.results[i][0].transcript;
						} else {
							interim += event.results[i][0].transcript;
						}
					}
					setTranscript((prev) => prev + final);
					setInterimTranscript(interim);
				};
				recognitionRef.current = recognition;
			}
		}, [data.mode]);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v = getValueByPath(data, path) as unknown as string;
				if (typeof v === "undefined") {
					return "";
				} else if (
					data.mode === "transcribe" &&
					typeof v === "string" &&
					v.startsWith("data:audio/")
				) {
					return "";
				} else if (
					data.mode === "record" &&
					typeof v === "string" &&
					!v.startsWith("data:audio/")
				) {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (data.mode === "transcribe") {
				onChange(transcript);
			}
		}, [transcript]);

		const handleRecording = (stopRecording = false) => {
			if (recognitionRef.current && data.mode === "transcribe") {
				if (recording || stopRecording) {
					recognitionRef.current.stop();
				} else {
					recognitionRef.current.start();
				}
			} else {
				if (recording) {
					if (mediaRecorder && mediaRecorder.state === "recording") {
						mediaRecorder.stop();
					}
					setRecording(false);
				} else {
					chunks.current = []; // Clear chunks before new recording
					navigator.mediaDevices
						.getUserMedia({ audio: true })
						.then((stream) => {
							const recorder = new MediaRecorder(stream);

							recorder.ondataavailable = (e) => {
								if (e.data.size > 0) {
									chunks.current.push(e.data);
								}
							};

							recorder.onstop = () => {
								const audioBlob = new Blob(chunks.current, {
									type: "audio/webm",
								});

								const reader = new FileReader();
								reader.onloadend = () => {
									const base64Audio = reader.result as string;
									setData(
										path,
										base64Audio as PathValue<
											D["data"],
											typeof path
										>,
									);
								};
								reader.readAsDataURL(audioBlob);

								// Stop and cleanup tracks
								stream
									.getTracks()
									// biome-ignore lint/suspicious/useIterableCallbackReturn: echart callback
									.forEach((track) => track.stop());
							};

							setMediaRecorder(recorder);
							recorder.start();
							setRecording(true);
						})
						.catch((err) => {
							console.error("Error getting media stream:", err);
						});
				}
			}
		};

		// Cleanup effect
		useEffect(() => {
			return () => {
				if (mediaRecorder && mediaRecorder.state !== "inactive") {
					mediaRecorder.stop();
					const tracks = mediaRecorder.stream.getTracks();
					// biome-ignore lint/suspicious/useIterableCallbackReturn: echart callback
					tracks.forEach((track) => track.stop());
				}
			};
		}, [mediaRecorder]);

		const handleDownload = () => {
			if (
				data.mode === "record" &&
				(data.value as string)?.startsWith("data:audio/")
			) {
				const link = document.createElement("a");
				link.href = data.value as string;
				link.download = `recording-${new Date().toISOString()}.webm`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		};

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string) => {
			// set the value
			setValue(value);

			// clear out he old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(path, value as PathValue<D["data"], typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection
				label={data.mode === "transcribe" ? "Transcript" : "Recording"}
			>
				<div className="flex flex-1 flex-col gap-1.5">
					<Input
						placeholder={placeholder}
						value={value}
						onChange={
							data.mode === "transcribe"
								? (e) => onChange(e.target.value)
								: undefined
						}
						disabled={data.mode === "record"}
						type={
							Object.hasOwn(data, "type") && path === "value"
								? (data.type as string)
								: undefined
						}
						autoComplete="off"
					/>
					{data.mode === "record" &&
						(data.value as string)?.startsWith("data:audio/") && (
							<Button
								size="sm"
								onClick={handleDownload}
								variant="outline"
								className="flex items-center gap-1"
							>
								<Download className="size-4" />
								Download Recording
							</Button>
						)}
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => handleRecording()}
					className={recording ? "text-destructive" : "text-primary"}
				>
					{recording ? <MicOff /> : <Mic />}
				</Button>
			</BaseSettingSection>
		);
	},
);
