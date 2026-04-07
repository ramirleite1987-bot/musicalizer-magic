import { render, screen } from '@testing-library/react'
import { EvaluateTab } from '@/components/EvaluateTab'
import type { TrackVersion } from '@/types/music'

const makeVersion = (overrides: Partial<TrackVersion> = {}): TrackVersion => ({
  id: 'v1',
  versionNumber: 1,
  createdAt: new Date().toISOString(),
  status: 'complete',
  prompt: '',
  negativePrompt: '',
  lyrics: '',
  style: { genre: 'Pop', moods: [], tempo: 120, key: 'C', isMinor: false, instruments: [], vocalStyle: 'Neutral', duration: '3:00', sunoApiVersion: 'v4' },
  dimensionScores: { melody: 5, harmony: 5, rhythm: 5, production: 5, lyricsFit: 5, originality: 5, emotionalImpact: 5 },
  feedback: { musicPositives: '', musicNegatives: '', lyricsPositives: '', lyricsNegatives: '', thingsToAvoid: '' },
  rating: 4,
  notes: '',
  isBest: false,
  audioFileName: null,
  audioUrl: null,
  ...overrides,
})

describe('EvaluateTab', () => {
  it('renders "Mark as Best Version" button when not best', () => {
    render(
      <EvaluateTab
        version={makeVersion()}
        allVersions={[makeVersion()]}
        onUpdate={async () => {}}
        onMarkBest={async () => {}}
      />
    )
    expect(screen.getByRole('button', { name: /mark as best/i })).toBeInTheDocument()
  })

  it('button is disabled when already the best version', () => {
    render(
      <EvaluateTab
        version={makeVersion({ isBest: true })}
        allVersions={[makeVersion({ isBest: true })]}
        onUpdate={async () => {}}
        onMarkBest={async () => {}}
      />
    )
    expect(screen.getByRole('button', { name: /current best version/i })).toBeDisabled()
  })
})
