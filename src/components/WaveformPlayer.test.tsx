import { render, screen } from '@testing-library/react';
import WaveformPlayer from './WaveformPlayer';

// Mock the wavesurfer.js library.
// The actual library tries to use browser APIs that don't exist in the test environment.
// We are replacing it with a dummy object that has the methods our component calls.
jest.mock('wavesurfer.js', () => ({
  create: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    destroy: jest.fn(),
    playPause: jest.fn(),
    getDuration: jest.fn(() => 120), // return a dummy duration
    getCurrentTime: jest.fn(() => 30), // return a dummy current time
  })),
}));

describe('WaveformPlayer', () => {
  const defaultProps = {
    audioUrl: '/test-audio.mp3',
    fileName: 'My Awesome Beat',
    demoid: 'demo-123',
    stems: [],
  };

  it('renders the component container', () => {
    render(<WaveformPlayer {...defaultProps} />);

    // Check for the main container using the data-testid we added.
    const container = screen.getByTestId('waveform-player-container');
    expect(container).toBeInTheDocument();
  });

  it('displays the file name', () => {
    render(<WaveformPlayer {...defaultProps} />);

    // Check if the file name passed in props is displayed on the screen.
    // We use a regular expression with 'i' to make the text match case-insensitive.
    const fileNameElement = screen.getByText(/my awesome beat/i);
    expect(fileNameElement).toBeInTheDocument();
  });
});
