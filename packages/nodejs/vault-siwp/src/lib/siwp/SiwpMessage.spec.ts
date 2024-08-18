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
});
