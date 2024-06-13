import IEntity from "../../common/IEntity";
import {v4, validate} from "uuid";
import * as bip39 from "@scure/bip39";
import {wordlist} from "@scure/bip39/wordlists/english";
import {RecoveryPhraseError} from "../../../errors";

export interface SerializedRecoveryPhrase extends IEntity {
    id: string
    phrase: string
    name: string
    createdAt: number
    updatedAt: number
    passphrase?: string
}

export class RecoveryPhraseReference {
    private readonly _id: string;
    private readonly _createdAt: number;
    private readonly _updatedAt: number;
    private readonly _hasPassphrase: boolean;
    private readonly _name: string;

    constructor(recoveryPhrase: RecoveryPhrase) {
        this._id = recoveryPhrase.id;
        this._name = recoveryPhrase.name;
        this._hasPassphrase = !!recoveryPhrase.passphrase;
        this._createdAt = recoveryPhrase.createdAt;
        this._updatedAt = recoveryPhrase.updatedAt;
    }

    get id(): string {
        return this._id;
    }

    get createdAt(): number {
        return this._createdAt;
    }

    get updatedAt(): number {
        return this._updatedAt;
    }

    get name(): string {
        return this._name;
    }

    get hasPassphrase(): boolean {
        return this._hasPassphrase;
    }
}

export class RecoveryPhrase implements IEntity {
    private readonly _id: string;
    private readonly _phrase: string;
    private _createdAt: number;
    private _updatedAt: number;
    private _name: string;
    private readonly _passphrase?: string;


    constructor(phrase: string, name: string, passphrase: string = '', id: string = v4()) {
        if (id && !validate(id)) {
            throw new Error("Invalid id: " + id);
        }

        if (!name) {
            throw new Error('Invalid argument: name. Expected a non-empty string')
        }

        if (!phrase || !this.validateRecoveryPhrase(phrase)) {
            throw new RecoveryPhraseError('Invalid argument: phrase. Expected a valid recovery phrase')
        }

        this._id = id
        this._phrase = phrase
        this._name = name
        this._passphrase = passphrase
        this._createdAt = Date.now()
        this._updatedAt = this._createdAt
    }

    get id(): string {
        return this._id
    }

    get createdAt(): number {
        return this._createdAt
    }

    get updatedAt(): number {
        return this._updatedAt
    }

    get passphrase() {
        return this._passphrase
    }

    get name(): string {
        return this._name
    }

    get phrase(): string {
        return this._phrase
    }

    updateName(name: string): void {
        if (!name) {
            throw new Error('Invalid argument: name. Expected a non-empty string')
        }

        this._name = name
        this._updatedAt = Date.now()
    }

    serialize(): SerializedRecoveryPhrase {
        return {
            id: this._id,
            phrase: this._phrase,
            name: this._name,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            passphrase: this._passphrase
        }
    }

    static deserialize(serializedRecoveryPhrase: SerializedRecoveryPhrase): RecoveryPhrase {
        if (!serializedRecoveryPhrase) {
            throw new Error('Invalid argument: serializedRecoveryPhrase. Expected a non-null SerializedRecoveryPhrase object')
        }

        const deserializedPhrase = new RecoveryPhrase(serializedRecoveryPhrase.phrase, serializedRecoveryPhrase.name, serializedRecoveryPhrase.passphrase, serializedRecoveryPhrase.id)
        deserializedPhrase._updatedAt = serializedRecoveryPhrase.updatedAt
        deserializedPhrase._createdAt = serializedRecoveryPhrase.createdAt
        return deserializedPhrase
    }

    asReference(): RecoveryPhraseReference {
        return new RecoveryPhraseReference(this)
    }

    private validateRecoveryPhrase(recoveryPhrase: string): boolean {
        if (!recoveryPhrase) {
            return false;
        }
        return bip39.validateMnemonic(recoveryPhrase, wordlist);
    }
}
