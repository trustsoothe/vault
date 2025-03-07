import { Buffer } from 'buffer'
import { MsgUnjail } from './../proto/generated/tx-signer'
import { Any } from '../proto/generated/google/protobuf/any'
import { TxMsg } from './tx-msg'

/**
 * Model representing a MsgAppUnjail to unjail an Application in the Pocket Network
 */
export class MsgProtoAppUnjail extends TxMsg {
    public readonly KEY: string = 'x.nodes.MsgUnjail'
    public readonly AMINO_KEY: string = 'apps/MsgAppUnjail'
    public readonly address: string

    /**
     *
     * @param {string} address - The address of the Application to unjail
     */
    public constructor(address: string) {
        super()
        this.address = address
    }

    /**
     * Converts an Msg Object to StdSignDoc
     * @returns {object} - Msg type key value.
     * @memberof MsgAppUnjail
     */
    public toStdSignDocMsgObj(): object {
        return {
            type: this.AMINO_KEY,
            value: {
                address: this.address.toLowerCase(),
            },
        }
    }

    /**
     * Converts an Msg Object to StdTx
     * @returns {any} - Msg type key value.
     * @memberof MsgAppUnjail
     */
    public toStdTxMsgObj(): any {
        const data = { AppAddr: Buffer.from(this.address) }

        return Any.fromJSON({
            typeUrl: this.KEY,
            value: Buffer.from(MsgUnjail.encode(data).finish()).toString('base64'),
        })
    }
}
