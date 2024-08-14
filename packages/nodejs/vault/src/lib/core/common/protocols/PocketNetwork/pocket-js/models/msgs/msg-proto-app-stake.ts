import { Buffer } from 'buffer'
import { MsgProtoStake } from '../proto/generated/tx-signer'
import { Any } from '../proto/generated/google/protobuf/any'
import { TxMsg } from './tx-msg'

const MINIMUM_STAKE_AMOUNT = 1000000

/**
 * Model representing a MsgAppStake to stake as an Application in the Pocket Network
 */
export class MsgProtoAppStake extends TxMsg {
    public readonly KEY: string = '/x.apps.MsgProtoStake'
    public readonly AMINO_KEY: string = 'apps/MsgAppStake'
    public readonly pubKey: Buffer
    public readonly chains: string[]
    public readonly amount: string

    /**
     * Constructor for this class
     * @param {Buffer} pubKey - Public key buffer
     * @param {string[]} chains - Network identifier list to be requested by this app
     * @param {string} amount - The amount to stake, must be greater than 0
     */
    constructor(pubKey: string, chains: string[], amount: string) {
        super()
        this.pubKey = Buffer.from(pubKey, 'hex')
        this.chains = chains
        this.amount = amount

        const amountNumber = Number(this.amount)

        if (isNaN(amountNumber)) {
            throw new Error('Amount is not a valid number')
        } else if (amountNumber < MINIMUM_STAKE_AMOUNT) {
            throw new Error(
                'Amount should be bigger than ${MINIMUM_STAKE_AMOUNT} uPOKT'
            )
        } else if (this.chains.length === 0) {
            throw new Error('Chains is empty')
        }
    }

    /**
     * Returns the msg type key
     * @returns {string} - Msg type key value.
     * @memberof MsgAppStake
     */
    public getMsgTypeKey(): string {
        return this.KEY
    }

    /**
     * Converts an Msg Object to StdSignDoc
     * @returns {object} - Msg type key value.
     * @memberof MsgAppStake
     */
    public toStdSignDocMsgObj(): object {
        return {
            type: this.AMINO_KEY,
            value: {
                chains: this.chains,
                pubkey: {
                    type: 'crypto/ed25519_public_key',
                    value: this.pubKey.toString('hex'),
                },
                value: this.amount,
            },
        }
    }

    /**
     * Converts an Msg Object for StdTx encoding
     * @returns {any} - Msg type key value.
     * @memberof MsgAppStake
     */
    public toStdTxMsgObj(): any {
        const data = {
            pubKey: this.pubKey,
            chains: this.chains,
            value: this.amount,
        }

        return Any.fromJSON({
            typeUrl: this.KEY,
            value: Buffer.from(MsgProtoStake.encode(data).finish()).toString(
                'base64'
            ),
        })
    }
}
