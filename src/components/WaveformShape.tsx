
import { BaseBoxShapeUtil, TLBaseShape } from 'tldraw'

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
			h: 120,
			assetId: null,
		}
	}

	// Component method
	override component(shape: WaveformShape) {
		return (
			<div
				style={{
					width: shape.props.w,
					height: shape.props.h,
					backgroundColor: 'lightblue',
					border: '1px solid black',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<p>Waveform Player Placeholder</p>
			</div>
		)
	}

	// Indicator
	override indicator(shape: WaveformShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}
