import IEncryptionService from './IEncryptionService';
import {MnemonicPhrase} from "../values";

export default <T extends IEncryptionService>(TEncryptionServiceCreator: {  new (): T }, beforeEach, describe, expect, test) => {
  let encryptionService: T

  beforeEach(() => {
    encryptionService = new TEncryptionServiceCreator()
  })

  describe('deriveSeed', () => {
    test('throws if a mnemonic phrase is not provided', async () => {
      await expect(encryptionService
          .deriveSeed(undefined))
          .rejects.toThrow('Invalid Operation: Mnemonic phrase not provided')
    })

    test('throws if a mnemonic phrase is not valid', async () => {
      await expect(encryptionService
          .deriveSeed(new MnemonicPhrase(2)))
          .rejects.toThrow('Invalid Operation: Mnemonic phrase is not valid')
    })

    describe('English: "budget useful announce picture imitate forget hospital loop people leopard toast toss" and no passphrase.', () => {
      let mnemonic: MnemonicPhrase = new MnemonicPhrase(12)

      beforeEach(() => {
        mnemonic.addWord('budget', 1)
        mnemonic.addWord('useful', 2)
        mnemonic.addWord('announce', 3)
        mnemonic.addWord('picture', 4)
        mnemonic.addWord('imitate', 5)
        mnemonic.addWord('forget', 6)
        mnemonic.addWord('hospital', 7)
        mnemonic.addWord('loop', 8)
        mnemonic.addWord('people', 9)
        mnemonic.addWord('leopard', 10)
        mnemonic.addWord('toast', 11)
        mnemonic.addWord('toss', 12)
      })

      test('Generates the appropriate seed: 71fc31986fec725e74250f8db3091db12a310fa59...', async () => {
        const expectedSeed = '71fc31986fec725e74250f8db3091db12a310fa591d2ca96f20b85d92bb33a5e07ba6307fe4cf9a3a7d5d3541af7f34d83b67be5dce10dcf4d57f0c05ba21745'
        const seed = await encryptionService.deriveSeed(mnemonic)
        expect(seed).toEqual(expectedSeed)
      })
    })

    describe('Spanish: "dardo flauta odisea afectar secta dieta trueno cinco fracaso anemia vaina monarca" and no passphrase.', () => {
      let mnemonic: MnemonicPhrase = new MnemonicPhrase(12)

      beforeEach(() => {
        mnemonic.addWord('dardo', 1)
        mnemonic.addWord('flauta', 2)
        mnemonic.addWord('odisea', 3)
        mnemonic.addWord('afectar', 4)
        mnemonic.addWord('secta', 5)
        mnemonic.addWord('dieta', 6)
        mnemonic.addWord('trueno', 7)
        mnemonic.addWord('cinco', 8)
        mnemonic.addWord('fracaso', 9)
        mnemonic.addWord('anemia', 10)
        mnemonic.addWord('vaina', 11)
        mnemonic.addWord('monarca', 12)
      })

      test('Generates the appropriate seed: 7a55ced5d80ced946d8c65e0c7cf71f030f9...', async () => {
        const expectedSeed = '7a55ced5d80ced946d8c65e0c7cf71f030f9833e633fef3fd5e83b59cc4801668b2d2abf64f17efc80e0b871666ec49fc48c0b6b1b19b8d888811f218ee79cf8'
        const seed = await encryptionService.deriveSeed(mnemonic)
        expect(seed).toEqual(expectedSeed)
      })
    })

    describe.skip('Korean: "효율적 궁극적 육십 양말 음성 입술 장면 고궁 아가씨 존댓말 편의 농구" and no passphrase.', () => {
      let mnemonic: MnemonicPhrase = new MnemonicPhrase(12)

      beforeEach(() => {
        mnemonic.addWord('효율적', 1)
        mnemonic.addWord('궁극적', 2)
        mnemonic.addWord('육십', 3)
        mnemonic.addWord('양말', 4)
        mnemonic.addWord('ᅳᆷ성', 5)
        mnemonic.addWord('입술', 6)
        mnemonic.addWord('장면', 7)
        mnemonic.addWord('고궁', 8)
        mnemonic.addWord('아가씨', 9)
        mnemonic.addWord('존댓말', 10)
        mnemonic.addWord('편의', 11)
        mnemonic.addWord('농구', 12)
      })

    })
  })
}
