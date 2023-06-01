interface MnemonicWord {
  word: string
  index: number
}

export class MnemonicPhrase {
  private readonly _words: MnemonicWord[]

  constructor(size: number) {
    this._words = new Array(size).fill(undefined)
  }

  addWord(word: string, index: number): void {
    const storedIndex = index - 1

    if (word.trim().length === 0) {
      throw new Error('Invalid Operation: Word cannot be empty')
    }

    if (this._words[storedIndex]) {
      throw new Error('Invalid Operation: Word index already set')
    }

    if (index < 0 || index > this._words.length) {
      throw new Error('Invalid Operation: Word index out of bounds')
    }

    const trimmedWord = word.trim()
    this._words[storedIndex] = {word: trimmedWord, index}
  }

  isValid(): boolean {
    return this.words.every((w) => w !== undefined)
  }

  equals(other: MnemonicPhrase): boolean {
    return this.words.every((w, i) => other.words[i] && w.word === other.words[i].word)
  }

  get words(): ReadonlyArray<MnemonicWord> {
    return this._words
  }
}
