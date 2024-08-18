import {describe, test, expect} from 'vitest';
import parsingNegativeObjects from '../../../test/parsing_negative_objects.json';
import { SiwpMessage } from './SiwpMessage';
import {SiwpError, SiwpErrorType} from "./types";


describe('SiwpMessage', () => {
    describe('Message Generation', () => {
        describe('Failure Cases When Parsing Objects', () => {
            const parsingNegativeObjectsCases: [string, Record<string, any>][] = Object.entries(parsingNegativeObjects);
            test.each(parsingNegativeObjectsCases)('Fails when: %s', (_, testInputObject) => {
                try {
                    new SiwpMessage(testInputObject);
                } catch (error) {
                    expect(error).toBeInstanceOf(SiwpError);
                }
            });
        });
    });
});
