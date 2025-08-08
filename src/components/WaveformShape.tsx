
import { BaseBoxShapeUtil, TLBaseShape } from 'tldraw'
import WaveformPlayer from './WaveformPlayer'
import { useAudioStore } from '@/store/audioStore'

// A type for our custom shape
export type WaveformShape = TLBaseShape<
	'waveform',
	{
		w: number
		h: number
		assetId: string | null
	}
>

// A class for our custom shape's utility
export class WaveformShapeUtil extends BaseBoxShapeUtil<WaveformShape> {
	static override type = 'waveform' as const

	override canResize = () => true
	override canBind = () => true

	// Default props
	override getDefaultProps(): WaveformShape['props'] {
		return {
			w: 300,
			h: 400,
			assetId: null,
		}
	}

	// Component
	override component(shape: WaveformShape) {
		const { demos } = useAudioStore()
		const demo = demos.find((d) => d.id === shape.props.assetId)

		if (!demo) {
			return (
				<div style={{ width: shape.props.w, height: shape.props.h, backgroundColor: '#efefef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<p>Loading...</p>
				</div>
			)
		}

		return (
			<div style={{ width: shape.props.w, height: shape.props.h, overflow: 'hidden' }}>
				<WaveformPlayer
					audioUrl={demo.master_url}
					fileName={demo.name}
					demoid={demo.id}
					stems={demo.stems}
				/>
			</div>
		)
	}

	// Indicator
	override indicator(shape: WaveformShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}
