import {beforeEach, describe, expect, test} from "vitest";
import {Asset, Passphrase, IProtocolService} from "@poktscan/keyring";

export default <T extends IProtocolService>(TProtocolServiceCreator: () => T, asset: Asset) => {
  let protocolService: T
  const passphrase = new Passphrase('passphrase')

  beforeEach(() => {
    protocolService = TProtocolServiceCreator()
  })

  describe('createAccount', () => {
    test('throws if an asset instance is not provided', async () => {
      await expect(protocolService.createAccount({ asset: undefined, passphrase })).rejects.toThrow('Invalid Operation: Asset instance not provided')
    })

    test('throws if a passphrase is not provided', async () => {
      await expect(protocolService.createAccount({ asset, passphrase: undefined })).rejects.toThrow('Invalid Operation: Passphrase instance not provided')
    })

    describe('new random accounts generations', () => {
      test('creates a new random account using the asset.', async () => {
        const account = await protocolService.createAccount({ asset, passphrase })
        expect(account).toBeDefined()
        expect(account.address).toBeDefined()
        expect(account.publicKey).toBeDefined()
        expect(account.privateKey).toBeDefined()
      })
    })
  })
}
