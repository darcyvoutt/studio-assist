import { range } from '@/utils/convert'

// Internal Functions
// ----------------------------------------------------------------
const frequency = (keys, frequencies, multiplier = 1) => {
  let frequency = null

  keys.forEach((key) => {
    if (frequencies[key] === undefined) return
    const adjustment = key === 'B#' ? 2 : 1
    frequency = frequencies[key] / adjustment
  })
  return frequency * multiplier
}

// Export Functions
// ----------------------------------------------------------------
export const octaves = (frequencies) => {
  return [
    {
      letters: ['C', 'B#'],
      frequency: frequency(['C', 'B#'], frequencies),
      range: range(frequency(['C', 'B#'], frequencies)),
      children: {
        letters: ['C#', 'Db'],
        frequency: frequency(['C#', 'Db'], frequencies),
        range: range(frequency(['C#', 'Db'], frequencies)),
      },
    },
    {
      letters: ['D', 'C##'],
      frequency: frequency(['D', 'C##'], frequencies),
      range: range(frequency(['D', 'C##'], frequencies)),
      children: {
        letters: ['D#', 'Eb'],
        frequency: frequency(['D#', 'Eb'], frequencies),
        range: range(frequency(['D#', 'Eb'], frequencies)),
      },
    },
    {
      letters: ['E'],
      frequency: frequency(['E'], frequencies),
      range: range(frequency(['E'], frequencies)),
      children: {
        letters: [],
        frequency: null,
        range: null,
      },
    },
    {
      letters: ['F', 'E#'],
      frequency: frequency(['F', 'E#'], frequencies),
      range: range(frequency(['F', 'E#'], frequencies)),
      children: {
        letters: ['F#', 'Gb'],
        frequency: frequency(['F#', 'Gb'], frequencies),
        range: range(frequency(['F#', 'Gb'], frequencies)),
      },
    },
    {
      letters: ['G', 'F##'],
      frequency: frequency(['G', 'F##'], frequencies),
      range: range(frequency(['G', 'F##'], frequencies)),
      children: {
        letters: ['G#', 'Ab'],
        frequency: frequency(['G#', 'Ab'], frequencies),
        range: range(frequency(['G#', 'Ab'], frequencies)),
      },
    },
    {
      letters: ['A', 'G##'],
      frequency: frequency(['A', 'G##'], frequencies),
      range: range(frequency(['A', 'G##'], frequencies)),
      children: {
        letters: ['A#', 'Bb'],
        frequency: frequency(['A#', 'Bb'], frequencies),
        range: range(frequency(['A#', 'Bb'], frequencies)),
      },
    },
    {
      letters: ['B'],
      frequency: frequency(['B'], frequencies),
      range: range(frequency(['B'], frequencies)),
      children: {
        letters: [],
        frequency: null,
        range: null,
      },
    },
    {
      letters: ['C', 'B#'],
      frequency: frequency(['C', 'B#'], frequencies, 2),
      range: range(frequency(['C', 'B#'], frequencies, 2)),
      children: {
        letters: [],
        frequency: null,
        range: null,
      },
    },
  ]
}
