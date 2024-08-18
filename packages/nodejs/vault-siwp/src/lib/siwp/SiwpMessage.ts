import {isValidPocketAddress, ParsedMessage} from "../parser";
import {generateNonce, isValidISO8601Date} from "./utils";
import {SiwpError, SiwpErrorType} from "./types";
import * as uri from 'valid-url';

export class SiwpMessage {
    /**RFC 3986 URI scheme for the authority that is requesting the signing. */
    scheme?: string;
    /**RFC 4501 dns authority that is requesting the signing. */
    domain: string;
    /**Ethereum address performing the signing conformant to capitalization
     * encoded checksum specified in EIP-55 where applicable. */
    address: string;
    /**Human-readable ASCII assertion that the user will sign, and it must not
     * contain `\n`. */
    statement?: string;
    /**RFC 3986 URI referring to the resource that is the subject of the signing
     *  (as in the __subject__ of a claim). */
    uri: string;
    /**Current version of the message. */
    version: string;
    /**EIP-155 Chain ID to which the session is bound, and the network where
     * Contract Accounts must be resolved. */
    chainId: "mainnet" | "testnet";
    /**Randomized token used to prevent replay attacks, at least 8 alphanumeric
     * characters. */
    nonce: string;
    /**ISO 8601 datetime string of the current time. */
    issuedAt?: string;
    /**ISO 8601 datetime string that, if present, indicates when the signed
     * authentication message is no longer valid. */
    expirationTime?: string;
    /**ISO 8601 datetime string that, if present, indicates when the signed
     * authentication message will become valid. */
    notBefore?: string;
    /**System-specific identifier that may be used to uniquely refer to the
     * sign-in request. */
    requestId?: string;
    /**List of information or references to information the user wishes to have
     * resolved as part of authentication by the relying party. They are
     * expressed as RFC 3986 URIs separated by `\n- `. */
    resources?: Array<string>;

    constructor(param: string | Partial<SiwpMessage>) {
        if (typeof param === 'string') {
            const parsedMessage = new ParsedMessage(param);
            this.scheme = parsedMessage.scheme;
            this.domain = parsedMessage.domain;
            this.address = parsedMessage.address;
            this.statement = parsedMessage.statement;
            this.uri = parsedMessage.uri;
            this.version = parsedMessage.version;
            this.nonce = parsedMessage.nonce;
            this.issuedAt = parsedMessage.issuedAt;
            this.expirationTime = parsedMessage.expirationTime;
            this.notBefore = parsedMessage.notBefore;
            this.requestId = parsedMessage.requestId;
            this.chainId = parsedMessage.chainId;
            this.resources = parsedMessage.resources;
        } else {
            this.scheme = param.scheme;
            this.domain = param.domain!;
            this.address = param.address!;
            this.statement = param.statement;
            this.uri = param.uri!;
            this.version = param.version!;
            this.chainId = param.chainId!;
            this.nonce = param.nonce!;
            this.issuedAt = param?.issuedAt;
            this.expirationTime = param.expirationTime;
            this.notBefore = param.notBefore;
            this.requestId = param.requestId;
            this.resources = param.resources;
        }
        this.nonce = this.nonce || generateNonce();
        this.validateMessage();
    }

    /**
     * Validates the values of this object fields.
     * @throws Throws an {ErrorType} if a field is invalid.
     */
    private validateMessage() {
        /** `domain` check. */
        if (
            !this.domain ||
            this.domain.length === 0 ||
            !/[^#?]*/.test(this.domain)
        ) {
            throw new SiwpError(
                SiwpErrorType.INVALID_DOMAIN,
                `${this.domain} to be a valid domain.`
            );
        }

        /** EIP-55 `address` check. */
        if (!isValidPocketAddress(this.address)) {
            throw new SiwpError(
                SiwpErrorType.INVALID_ADDRESS,
                `${this.address} to be a valid Pocket Network address.`
            );
        }

        /** Check if the URI is valid. */
        if (!uri.isUri(this.uri)) {
            throw new SiwpError(
                SiwpErrorType.INVALID_URI,
                `${this.uri} to be a valid uri.`
            );
        }

        /** Check if the version is 1. */
        if (this.version !== '1') {
            throw new SiwpError(
                SiwpErrorType.INVALID_MESSAGE_VERSION,
                '1',
                this.version
            );
        }

        /** Check if the nonce is alphanumeric and bigger then 8 characters */
        const nonce = this?.nonce?.match(/[a-zA-Z0-9]{8,}/);
        if (!nonce || this.nonce.length < 8 || nonce[0] !== this.nonce) {
            throw new SiwpError(
                SiwpErrorType.INVALID_NONCE,
                `Length > 8 (${nonce?.length}). Alphanumeric.`,
                this.nonce
            );
        }

        /** `issuedAt` conforms to ISO-8601 and is a valid date. */
        if (this.issuedAt) {
            if (!isValidISO8601Date(this.issuedAt)) {
                throw new Error(SiwpErrorType.INVALID_TIME_FORMAT);
            }
        }

        /** `expirationTime` conforms to ISO-8601 and is a valid date. */
        if (this.expirationTime) {
            if (!isValidISO8601Date(this.expirationTime)) {
                throw new Error(SiwpErrorType.INVALID_TIME_FORMAT);
            }
        }

        /** `notBefore` conforms to ISO-8601 and is a valid date. */
        if (this.notBefore) {
            if (!isValidISO8601Date(this.notBefore)) {
                throw new Error(SiwpErrorType.INVALID_TIME_FORMAT);
            }
        }

        /** `chainId` is either mainnet or testnet. */
        if (this.chainId !== 'mainnet' && this.chainId !== 'testnet') {
            throw new SiwpError(
                SiwpErrorType.INVALID_CHAIN_ID,
                'mainnet or testnet',
                this.chainId
            );
        }
    }
}
