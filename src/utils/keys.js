const options = [
  { value: 'C', text: 'C', show: true },
  { value: 'C#', text: 'C# / D♭', show: true },
  { value: 'D', text: 'D', show: true },
  { value: 'D#', text: 'D# / E♭', show: true },
  { value: 'E', text: 'E', show: true },
  { value: 'F', text: 'F', show: true },
  { value: 'F#', text: 'F# / G♭', show: true },
  { value: 'G', text: 'G', show: true },
  { value: 'G#', text: 'G# / A♭', show: true },
  { value: 'A', text: 'A', show: true },
  { value: 'A#', text: 'A# / B♭', show: true },
  { value: 'B', text: 'B', show: true },
  // Major #/## keys for relatives
  { value: 'B#', text: 'C', show: false },
  { value: 'C##', text: 'D', show: false },
  { value: 'E#', text: 'F', show: false },
  { value: 'F##', text: 'G', show: false },
  { value: 'G##', text: 'A', show: false },
  // Minor ♭ keys for relatives
  { value: 'Db', text: 'C# / D♭', show: false },
  { value: 'Eb', text: 'D# / E♭', show: false },
  { value: 'Gb', text: 'F# / G♭', show: false },
  { value: 'Ab', text: 'G# / A♭', show: false },
  { value: 'Bb', text: 'A# / B♭', show: false },
]

export const keys = {
  all: options,
  show: options.filter((option) => option.show),
}
