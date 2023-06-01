import {describe, test, expect} from "vitest";
import {MnemonicPhrase} from "./MnemonicPhrase";

describe('MnemonicPhrase', () => {
  describe('addWord', () => {
    test('should add word to phrase', () => {
      const phrase = new MnemonicPhrase(1)
      phrase.addWord('word', 1)

      expect(phrase.words).toEqual([{word: 'word', index: 1}])
    })

    test('trims the given word before adding them', () => {
      const phrase = new MnemonicPhrase(1)
      phrase.addWord(' word ', 1)

      expect(phrase.words).toEqual([{word: 'word', index: 1}])
    })

    test('throws if word is empty', () => {
      const phrase = new MnemonicPhrase(1)
      expect(() => phrase.addWord('', 1)).toThrow('Invalid Operation: Word cannot be empty')
    })

    test('throws if word index has already been provided', () => {
      const phrase = new MnemonicPhrase(1)
      phrase.addWord('word', 1)

      expect(() => phrase.addWord('word', 1)).toThrow('Invalid Operation: Word index already set')
    })

    test('throws if word index is out of bounds', () => {
      const phrase = new MnemonicPhrase(1)
      expect(() => phrase.addWord('word', 2)).toThrow('Invalid Operation: Word index out of bounds')
    })
  })

  describe('isValid', () => {
    test('should return true if all words are set', () => {
      const phrase = new MnemonicPhrase(2)
      phrase.addWord('word', 1)
      phrase.addWord('word', 2)

      expect(phrase.isValid()).toBe(true)
    })

    test('should return false if all words are not set', () => {
      const phrase = new MnemonicPhrase(2)
      phrase.addWord('word', 1)
      expect(phrase.isValid()).toBe(false)
    })
  })

  describe('equals', () => {
    test('should return true if all words are equal', () => {
      const phrase1 = new MnemonicPhrase(2)
      phrase1.addWord('word', 1)
      phrase1.addWord('word', 2)

      const phrase2 = new MnemonicPhrase(2)
      phrase2.addWord('word', 1)
      phrase2.addWord('word', 2)

      expect(phrase1.equals(phrase2)).toBe(true)
    })

    test('should return false if all words are not equal', () => {
      const phrase1 = new MnemonicPhrase(2)
      phrase1.addWord('word', 1)
      phrase1.addWord('word', 2)

      const phrase2 = new MnemonicPhrase(3)
      phrase2.addWord('word', 1)
      phrase2.addWord('word', 3)

      expect(phrase1.equals(phrase2)).toBe(false)
    })
  })
})
