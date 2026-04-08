import { render, screen } from '@testing-library/react'
import { Header } from '@/components/Header'
import type { Track, TrackVersion } from '@/types/music'

const mockVersion: TrackVersion = {
  id: 'v1',
  versionNumber: 1,
  createdAt: new Date().toISOString(),
  status: 'complete',
  prompt: 'test prompt',
  negativePrompt: '',
  lyrics: '',
  style: {
    genre: 'Pop',
    moods: [],
    tempo: 120,
    key: 'C',
    isMinor: false,
    instruments: [],
    vocalStyle: 'Neutral',
    duration: '3:00',
    sunoApiVersion: 'v4',
  },
  dimensionScores: { melody: 0, harmony: 0, rhythm: 0, production: 0, lyricsFit: 0, originality: 0, emotionalImpact: 0 },
  feedback: { musicPositives: '', musicNegatives: '', lyricsPositives: '', lyricsNegatives: '', thingsToAvoid: '' },
  rating: 0,
  notes: '',
  isBest: false,
  audioFileName: null,
  audioUrl: null,
}

const mockTrack: Track = {
  id: 't1',
  name: 'Test Track',
  genre: 'Pop',
  themeIds: [],
  versions: [mockVersion],
}

describe('Header', () => {
  it('renders track name and version number', () => {
    render(<Header track={mockTrack} version={mockVersion} onUpdateVersion={async () => {}} />)
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText(/Version 1/)).toBeInTheDocument()
  })

  it('shows the Suno API version badge', () => {
    render(<Header track={mockTrack} version={mockVersion} onUpdateVersion={async () => {}} />)
    expect(screen.getByText(/v4/i)).toBeInTheDocument()
  })
})
