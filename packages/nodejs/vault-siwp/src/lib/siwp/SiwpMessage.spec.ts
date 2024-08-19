import {describe, test, expect} from 'vitest';
import { SiwpMessage } from './SiwpMessage';
import {SiwpError} from "./types";
import parsingNegativeObjects from '../../../test/parsing_negative_objects.json';
import parsingPositiveEntries from '../../../test/parsing_positive.json';

describe('SiwpMessage', () => {
    describe('#validateMessages', () => {
        const parsingNegativeObjectsCases: [string, Record<string, any>][] = Object.entries(parsingNegativeObjects);
        test.each(parsingNegativeObjectsCases)('Fails when: %s', (_, testInputObject) => {
            try {
                new SiwpMessage(testInputObject);
            } catch (error) {
                expect(error).toBeInstanceOf(SiwpError);
            }
        });
    });

    describe('#prepareMessage', () => {
        const parsingPositiveEntriesCases: [string, { fields: Record<string, any>, message: string }][] = Object.entries(parsingPositiveEntries);
        test.each(parsingPositiveEntriesCases)('Generates message successfully: %s', (_, testInputObject) => {
            const siwpMessage = new SiwpMessage(testInputObject.fields);
            expect(siwpMessage.prepareMessage()).toBe(testInputObject.message);
        });
    });

    describe('#verify', () => {
        const privateKey = 'ae531b9e7aaf3e300914d0a95eaef3320ce943e125854eb1490478d44ff45f5479673eefacacd933535e25c2975fe7950247de201690e074719771a6752f1e47';
        const publicKey = privateKey.slice(64);
        const address = '961206e997ff088fd4b7d906df2a625851e2a18a';
    });
});
