import * as varint from 'varint'
import { Buffer } from 'buffer'
import { BaseTxEncoder } from './base-tx-encoder'
import { CoinDenom } from '../models/coin-denom'
import { TxSignature } from '../models/tx-signature'
import {
  ProtoStdSignature,
  ProtoStdTx,
} from '../models/proto/generated/tx-signer'
import { stringifyObjectWithSort } from '../utils'

export class ProtoTxEncoder extends BaseTxEncoder {
  public getFeeObj() {
    return [
      {
        amount: this.fee,
        denom:
          this.feeDenom !== undefined
            ? CoinDenom[this.feeDenom].toLowerCase()
            : 'upokt',
      },
    ]
  }

  // Returns the bytes to be signed by the account sending the transaction
  public marshalStdSignDoc(): Buffer {
    const stdSignDoc = {
      chain_id: this.chainID,
      entropy: this.entropy,
      fee: this.getFeeObj(),
      memo: this.memo,
      msg: this.msg.toStdSignDocMsgObj(),
    }

    // Use stringifyObject instead JSON.stringify to get a deterministic result.
    return Buffer.from(stringifyObjectWithSort(stdSignDoc), 'utf-8')
  }

  // Returns the encoded transaction
  public marshalStdTx(signature: TxSignature): Buffer {
    const txSig: ProtoStdSignature = {
      publicKey: signature.pubKey,
      Signature: signature.signature,
    }
    const stdTx: ProtoStdTx = {
      msg: this.msg.toStdTxMsgObj(),
      fee: this.getFeeObj(),
      signature: txSig,
      memo: this.memo ? this.memo : '',
      entropy: parseInt(this.entropy, 10),
    }

    // Create the Proto Std Tx bytes
    const protoStdTxBytes: Buffer = Buffer.from(
      ProtoStdTx.encode(stdTx).finish()
    )

    // Create the prefix
    const prefixBytes = varint.encode(protoStdTxBytes.length)
    const prefix = Buffer.from(prefixBytes)

    // Concatenate for the result
    return Buffer.concat([prefix, protoStdTxBytes])
  }
}
