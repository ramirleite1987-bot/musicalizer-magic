import { prisma } from '@/lib/prisma'
import { shapeTheme, shapeTrack } from '@/lib/shapes'
import type { Theme, Track } from '@/types/music'

interface DashboardData {
  tracks: Track[]
  themes: Theme[]
  loadError: string | null
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [rawTracks, rawThemes] = await Promise.all([
      prisma.track.findMany({
        include: {
          versions: { orderBy: { versionNumber: 'asc' } },
          themes: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.theme.findMany({ orderBy: { createdAt: 'asc' } }),
    ])

    return {
      tracks: rawTracks.map(shapeTrack),
      themes: rawThemes.map(shapeTheme),
      loadError: null,
    }
  } catch (error) {
    console.error('Failed to load dashboard data', error)

    return {
      tracks: [],
      themes: [],
      loadError:
        'Dashboard loaded without database data. Check DATABASE_URL and Prisma connectivity in Vercel.',
    }
  }
}
