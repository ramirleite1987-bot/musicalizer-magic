import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create themes
  const th1 = await prisma.theme.upsert({
    where: { id: 'th1' },
    update: {},
    create: {
      id: 'th1',
      name: 'Cyberpunk Dystopia',
      description: 'High tech, low life. Neon-lit streets and corporate espionage.',
      keywords: ['neon', 'dystopia', 'technology', 'rebellion', 'urban decay'],
      color: 'violet',
      source: 'url',
      sourceRef: 'https://en.wikipedia.org/wiki/Cyberpunk',
    },
  })

  const th2 = await prisma.theme.upsert({
    where: { id: 'th2' },
    update: {},
    create: {
      id: 'th2',
      name: 'Lost Love Letters',
      description: 'The bittersweet feeling of finding old correspondence from a past lover.',
      keywords: ['heartbreak', 'nostalgia', 'letters', 'distance', 'memory'],
      color: 'rose',
      source: 'document',
      sourceRef: 'love-poems-collection.pdf',
    },
  })

  const th3 = await prisma.theme.upsert({
    where: { id: 'th3' },
    update: {},
    create: {
      id: 'th3',
      name: 'Ocean at Midnight',
      description: 'The vast, dark, and mysterious expanse of the sea under moonlight.',
      keywords: ['ocean', 'waves', 'moonlight', 'solitude', 'depth'],
      color: 'sky',
      source: 'manual',
      sourceRef: '',
    },
  })

  const th4 = await prisma.theme.upsert({
    where: { id: 'th4' },
    update: {},
    create: {
      id: 'th4',
      name: 'Urban Hustle',
      description: 'The fast-paced, relentless energy of city life and ambition.',
      keywords: ['city', 'grind', 'ambition', 'streets', 'energy'],
      color: 'amber',
      source: 'manual',
      sourceRef: '',
    },
  })

  const th5 = await prisma.theme.upsert({
    where: { id: 'th5' },
    update: {},
    create: {
      id: 'th5',
      name: 'Cosmic Journey',
      description: 'An epic voyage through the stars, exploring the unknown.',
      keywords: ['space', 'stars', 'infinity', 'wonder', 'exploration'],
      color: 'violet',
      source: 'url',
      sourceRef: 'https://www.nasa.gov/missions',
    },
  })

  const th6 = await prisma.theme.upsert({
    where: { id: 'th6' },
    update: {},
    create: {
      id: 'th6',
      name: 'Autumn Melancholy',
      description: 'The changing of seasons, reflection, and the quiet beauty of decay.',
      keywords: ['falling leaves', 'rain', 'change', 'reflection', 'warmth'],
      color: 'orange',
      source: 'document',
      sourceRef: 'seasonal-poetry.txt',
    },
  })

  // Track 1: Neon Nights
  const t1 = await prisma.track.upsert({
    where: { id: 't1' },
    update: {},
    create: {
      id: 't1',
      name: 'Neon Nights',
      genre: 'Synthwave',
      themes: { connect: [{ id: th1.id }, { id: th4.id }] },
    },
  })

  await prisma.trackVersion.upsert({
    where: { id: 'v1-1' },
    update: {},
    create: {
      id: 'v1-1',
      versionNumber: 1,
      createdAt: new Date('2023-10-25T10:00:00Z'),
      status: 'complete',
      prompt: 'A retro synthwave track with driving bassline and ethereal pads. 80s nostalgia.',
      negativePrompt: 'vocals, acoustic instruments, slow',
      lyrics: '',
      style: {
        genre: 'Electronic',
        moods: ['Energetic', 'Dreamy'],
        tempo: 120,
        key: 'A',
        isMinor: true,
        instruments: ['Synth', 'Drums', 'Bass'],
        vocalStyle: 'None',
        duration: '3min',
        sunoApiVersion: 'v3.5',
      },
      rating: 3,
      dimensionScores: {
        melody: 6,
        harmony: 7,
        rhythm: 8,
        production: 6,
        lyricsFit: 0,
        originality: 5,
        emotionalImpact: 6,
      },
      notes: 'Good start, but the bass is a bit muddy. Needs more punch.',
      feedback: {
        musicPositives: 'The ethereal pads sound great.',
        musicNegatives: 'Bass is muddy and lacks definition.',
        lyricsPositives: '',
        lyricsNegatives: '',
        thingsToAvoid: 'Muddy low-end frequencies.',
      },
      isBest: false,
      trackId: t1.id,
    },
  })

  await prisma.trackVersion.upsert({
    where: { id: 'v1-2' },
    update: {},
    create: {
      id: 'v1-2',
      versionNumber: 2,
      createdAt: new Date('2023-10-25T11:30:00Z'),
      status: 'complete',
      prompt: 'A retro synthwave track with driving bassline, punchy drums, and ethereal pads. 80s nostalgia, cyberpunk vibes.',
      negativePrompt: 'vocals, acoustic instruments, slow, muddy bass',
      lyrics: '',
      style: {
        genre: 'Electronic',
        moods: ['Energetic', 'Dreamy', 'Aggressive'],
        tempo: 125,
        key: 'A',
        isMinor: true,
        instruments: ['Synth', 'Drums', 'Bass', 'Pad'],
        vocalStyle: 'None',
        duration: '3min',
        sunoApiVersion: 'v4',
      },
      rating: 4,
      dimensionScores: {
        melody: 7,
        harmony: 8,
        rhythm: 9,
        production: 8,
        lyricsFit: 0,
        originality: 7,
        emotionalImpact: 8,
      },
      notes: 'Much better! The drums hit hard. Maybe add a lead synth melody in the bridge.',
      feedback: {
        musicPositives: 'Punchy drums and clear bassline.',
        musicNegatives: 'Missing a strong lead melody.',
        lyricsPositives: '',
        lyricsNegatives: '',
        thingsToAvoid: 'Overpowering pads.',
      },
      isBest: true,
      trackId: t1.id,
    },
  })

  // Track 2: Fading Echoes
  const t2 = await prisma.track.upsert({
    where: { id: 't2' },
    update: {},
    create: {
      id: 't2',
      name: 'Fading Echoes',
      genre: 'Indie Pop',
      themes: { connect: [{ id: th2.id }, { id: th6.id }] },
    },
  })

  await prisma.trackVersion.upsert({
    where: { id: 'v2-1' },
    update: {},
    create: {
      id: 'v2-1',
      versionNumber: 1,
      createdAt: new Date('2023-10-26T14:15:00Z'),
      status: 'complete',
      prompt: 'A melancholic indie pop song with acoustic guitar and soft female vocals.',
      negativePrompt: 'heavy drums, electronic synths, aggressive',
      lyrics: '[Verse 1]\nWalking down this empty street\nShadows falling at my feet\n\n[Chorus]\nFading echoes in my mind\nLeaving all the past behind',
      style: {
        genre: 'Pop',
        moods: ['Melancholic', 'Chill'],
        tempo: 95,
        key: 'E',
        isMinor: true,
        instruments: ['Guitar', 'Vocals', 'Bass', 'Percussion'],
        vocalStyle: 'Female',
        duration: '2min',
        sunoApiVersion: 'v3.5',
      },
      rating: 4,
      dimensionScores: {
        melody: 8,
        harmony: 7,
        rhythm: 6,
        production: 7,
        lyricsFit: 8,
        originality: 6,
        emotionalImpact: 9,
      },
      notes: 'Vocals are beautiful. The chorus needs a bit more lift.',
      feedback: {
        musicPositives: 'Acoustic guitar tone is perfect.',
        musicNegatives: 'Chorus lacks energy.',
        lyricsPositives: 'Good emotional resonance.',
        lyricsNegatives: 'A bit cliché in the chorus.',
        thingsToAvoid: 'Flat dynamics in the chorus.',
      },
      isBest: true,
      trackId: t2.id,
    },
  })

  await prisma.trackVersion.upsert({
    where: { id: 'v2-2' },
    update: {},
    create: {
      id: 'v2-2',
      versionNumber: 2,
      createdAt: new Date('2023-10-26T15:00:00Z'),
      status: 'draft',
      prompt: 'A melancholic indie pop song with acoustic guitar, soft female vocals, and subtle strings in the chorus.',
      negativePrompt: 'heavy drums, electronic synths, aggressive',
      lyrics: '[Verse 1]\nWalking down this empty street\nShadows falling at my feet\n\n[Chorus]\nFading echoes in my mind\nLeaving all the past behind\n(Oh, they fade away)',
      style: {
        genre: 'Pop',
        moods: ['Melancholic', 'Chill', 'Romantic'],
        tempo: 95,
        key: 'E',
        isMinor: true,
        instruments: ['Guitar', 'Vocals', 'Bass', 'Percussion', 'Strings'],
        vocalStyle: 'Female',
        duration: '3min',
        sunoApiVersion: 'v4',
      },
      rating: 0,
      dimensionScores: {
        melody: 0,
        harmony: 0,
        rhythm: 0,
        production: 0,
        lyricsFit: 0,
        originality: 0,
        emotionalImpact: 0,
      },
      notes: '',
      feedback: {
        musicPositives: '',
        musicNegatives: '',
        lyricsPositives: '',
        lyricsNegatives: '',
        thingsToAvoid: '',
      },
      isBest: false,
      trackId: t2.id,
    },
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
