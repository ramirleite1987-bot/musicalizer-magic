import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/Sidebar'
import type { Track } from '@/types/music'

const mockTracks: Track[] = [
  { id: 't1', name: 'Track One', genre: 'Pop', themeIds: [], versions: [] },
  { id: 't2', name: 'Track Two', genre: 'Rock', themeIds: [], versions: [] },
]

describe('Sidebar', () => {
  it('renders all track names', () => {
    render(
      <Sidebar
        tracks={mockTracks}
        themes={[]}
        selectedTrackId="t1"
        onSelectTrack={() => {}}
        onCreateTrack={async () => {}}
        onDeleteTrack={async () => {}}
      />
    )
    expect(screen.getByText('Track One')).toBeInTheDocument()
    expect(screen.getByText('Track Two')).toBeInTheDocument()
  })
})
