import { Mic, MicOff } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface AudioInputBlockDef extends BlockDef<"audio-input"> {
	widget: "audio-input";
	data: {
		style: CSSProperties;
		label: string;
		loading?: boolean;
		disabled?: boolean;
		variant: "contained" | "outlined" | "text";
		color: "primary" | "secondary" | "success" | "warning" | "error";
		value: string;
		mode: "transcribe" | "record";
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onComplete: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const variantMap: Record<
	AudioInputBlockDef["data"]["variant"],
	"default" | "outline" | "ghost"
> = {
	contained: "default",
	outlined: "outline",
	text: "ghost",
};

export const AudioInputBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData } = useBlock<AudioInputBlockDef>(id);
	const [recording, setRecording] = useState(false);
	const [transcript, setTranscript] = useState("");
	const recognitionRef = useRef(null);
	const [primaryBtnColor, _setPrimaryBtnColor] = useState(data.color);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null,
	);
	const chunks = useRef<Blob[]>([]);
	const previousValueRef = useRef(data.value);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (data.mode === "transcribe") {
			// biome-ignore lint/suspicious/noExplicitAny: webkitSpeechRecognition type is untyped
			const recognition = new (window as any).webkitSpeechRecognition();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = "en-US";

			recognition.onstart = () => {
				setRecording(true);
				setData("color", "error");
				setTranscript("");
			};
			recognition.onend = () => {
				setRecording(false);
				setData("color", primaryBtnColor);
			};
			recognition.onresult = (event) => {
				let final = "";
				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						final += event.results[i][0].transcript;
					}
				}
				setTranscript((prev) => prev + final);
			};
			recognitionRef.current = recognition;
		} else {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		}
	}, [data.mode]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (data.mode === "transcribe") {
			setData("value", transcript);
		}
	}, [transcript]);

	const handleRecording = (stopRecording = false) => {
		if (data.mode === "transcribe") {
			if (recognitionRef.current) {
				if (recording || stopRecording) {
					recognitionRef.current.stop();
				} else {
					recognitionRef.current.start();
				}
			}
		} else {
			if (recording || stopRecording) {
				if (mediaRecorder && mediaRecorder.state === "recording") {
					mediaRecorder.stop();
				}
				setData("color", primaryBtnColor);
				setRecording(false);
			} else {
				chunks.current = [];
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
								setData("value", reader.result as string);
							};
							reader.readAsDataURL(audioBlob);
							// biome-ignore lint/suspicious/useIterableCallbackReturn: forEach callback does not need return
							stream.getTracks().forEach((track) => track.stop());
						};

						setMediaRecorder(recorder);
						recorder.start();
						setRecording(true);
						setData("color", "error");
					})
					.catch((err) => {
						console.error("Error getting media stream:", err);
					});
			}
		}
	};

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (
			data.mode === "record" &&
			(data.value as string)?.startsWith("data:audio/") &&
			(data.value as string) !== previousValueRef.current &&
			!recording
		) {
			handleDownload();
		}
		previousValueRef.current = data.value;
	}, [data.value, recording]);

	useEffect(() => {
		return () => {
			if (mediaRecorder && mediaRecorder.state !== "inactive") {
				mediaRecorder.stop();
				// biome-ignore lint/suspicious/useIterableCallbackReturn: forEach callback does not need return
				mediaRecorder.stream.getTracks().forEach((t) => t.stop());
			}
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, [mediaRecorder]);

	return (
		<div {...attrs} className="p-1">
			<Button
				variant={variantMap[data.variant] ?? "default"}
				disabled={data?.disabled || data?.loading}
				style={data.style}
				className="rounded-full"
				onClick={() => handleRecording()}
			>
				{recording ? (
					<MicOff className="size-4" />
				) : (
					<Mic className="size-4" />
				)}
			</Button>
		</div>
	);
});
