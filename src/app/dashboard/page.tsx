import { MusicalizerApp } from '@/components/MusicalizerApp'
import { getDashboardData } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { tracks, themes, loadError } = await getDashboardData()

  return (
    <MusicalizerApp
      initialTracks={tracks}
      initialThemes={themes}
      loadError={loadError}
    />
  )
}
