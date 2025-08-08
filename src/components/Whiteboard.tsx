
"use client";

import dynamic from "next/dynamic";
import "tldraw/tldraw.css";
import { useAudioStore } from "@/store/audioStore";
import { useRef, useEffect } from "react";
import { WaveformShapeUtil } from "./WaveformShape";
import { useEditor } from "tldraw";

const Tldraw = dynamic(
	() => import("tldraw").then((mod) => mod.Tldraw),
	{ ssr: false }
);

const customShapeUtils = [WaveformShapeUtil];

function UI() {
	const editor = useEditor();
	const { demos, uploadDemo, isUploading } = useAudioStore();
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const existingWaveformIds = editor
			.getCurrentPageShapes()
			.filter((shape) => shape.type === 'waveform')
			.map((shape) => shape.props.assetId);

		demos.forEach((demo, i) => {
			if (!existingWaveformIds.includes(demo.id)) {
				editor.createShape({
					type: 'waveform',
					x: 150 * i,
					y: 150,
					props: { assetId: demo.id },
				});
			}
		});
	}, [demos, editor]);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		for (const file of Array.from(files)) {
			if (file.type.startsWith("audio/")) {
				try {
					const newDemo = await uploadDemo(file);
					if (newDemo) {
						editor.createShape({
							type: "waveform",
							props: { assetId: newDemo.id },
						});
					}
				} catch (error) {
					console.error(`❌ Failed to upload ${file.name}:`, error);
				}
			} else {
				console.log(`⚠️ Skipped non-audio file: ${file.name} (${file.type})`);
			}
		}
		e.target.value = "";
	};

	return (
		<div className="absolute mt-8 ml-8 z-50">
			<input
				ref={fileInputRef}
				type="file"
				accept="audio/*"
				multiple
				onChange={handleFileSelect}
				style={{ display: "none" }}
			/>
			<button
				onClick={() => fileInputRef.current?.click()}
				disabled={isUploading}
				className={`px-4 py-2 rounded text-white font-medium transition-transform duration-200 ease-in-out hover:scale-105 ${
					isUploading
						? "bg-gray-400 cursor-not-allowed"
						: "animated-background bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500"
				}`}
			>
				{isUploading ? "Uploading..." : "📁 Upload Demo"}
			</button>
		</div>
	);
}

export default function Whiteboard() {
	const { fetchDemos } = useAudioStore();

	useEffect(() => {
		fetchDemos();
	}, [fetchDemos]);

	return (
		<div style={{ position: "fixed", inset: 0 }}>
			<Tldraw shapeUtils={customShapeUtils}>
				<UI />
			</Tldraw>
		</div>
	);
}

