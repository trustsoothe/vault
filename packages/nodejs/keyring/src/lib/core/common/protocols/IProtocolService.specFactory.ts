import {beforeEach, describe, expect, test} from "vitest";
import {IProtocolService} from "./IProtocolService";
import {Asset} from "../../asset";
import {MnemonicPhrase} from "../values";

export default <T extends IProtocolService>(TProtocolServiceCreator: {  new (): T }, asset: Asset) => {
  let protocolService: T

  beforeEach(() => {
    protocolService = new TProtocolServiceCreator()
  })

  describe('createAccount', () => {
    test('throws if an asset instance is not provided', async () => {
      await expect(protocolService.createAccount({ asset: undefined, mnemonic: new MnemonicPhrase(1)})).rejects.toThrow('Invalid Operation: Asset instance not provided')
    })

    test('throws if a mnemonic phrase is not provided', async () => {
      await expect(protocolService.createAccount({ asset })).rejects.toThrow('Invalid Operation: Mnemonic phrase not provided')
    })

    test('throws if a mnemonic phrase is not valid', async () => {
      const mnemonic = new MnemonicPhrase(2)
      mnemonic.addWord('word', 1)

      await expect(protocolService.createAccount({ asset, mnemonic })).rejects.toThrow('Invalid Operation: Mnemonic phrase is not valid')
    })
  })
}
