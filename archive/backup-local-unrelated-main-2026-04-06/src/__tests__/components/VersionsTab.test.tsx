import { render, screen } from '@testing-library/react'
import { VersionsTab } from '@/components/VersionsTab'
import type { Track, TrackVersion } from '@/types/music'

const makeVersion = (overrides: Partial<TrackVersion> = {}): TrackVersion => ({
  id: 'v1',
  versionNumber: 1,
  createdAt: new Date().toISOString(),
  status: 'complete',
  prompt: '',
  negativePrompt: '',
  lyrics: '',
  style: { genre: 'Pop', moods: [], tempo: 120, key: 'C', isMinor: false, instruments: [], vocalStyle: 'Neutral', duration: '3:00', sunoApiVersion: 'v4' },
  dimensionScores: { melody: 0, harmony: 0, rhythm: 0, production: 0, lyricsFit: 0, originality: 0, emotionalImpact: 0 },
  feedback: { musicPositives: '', musicNegatives: '', lyricsPositives: '', lyricsNegatives: '', thingsToAvoid: '' },
  rating: 5,
  notes: '',
  isBest: true,
  audioFileName: null,
  audioUrl: null,
  ...overrides,
})

const mockTrack: Track = {
  id: 't1', name: 'Test', genre: 'Pop', themeIds: [],
  versions: [makeVersion()],
}

describe('VersionsTab', () => {
  it('renders version rows', () => {
    render(
      <VersionsTab
        track={mockTrack}
        selectedVersionId="v1"
        onSelectVersion={() => {}}
        onCloneVersion={async () => {}}
        onMarkBest={async () => {}}
        onAudioUpload={async () => {}}
        version={makeVersion()}
      />
    )
    expect(screen.getAllByText(/v1/i).length).toBeGreaterThan(0)
  })
})
