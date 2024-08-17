import {describe, test, expect} from 'vitest'
import { ParsedMessage } from "./abnf";
import parsingPositive from "../../../test/parsing_positive.json";
import parsingNegative from "../../../test/parsing_negative.json";

describe('AB-NF Parser', () => {
    describe("Unsuccessful parsing examples", () => {
        const parsingNegativeCases: [string, string][] = Object.entries(parsingNegative);
        test.each(parsingNegativeCases)('Fails when: %s', (_, test) => {
            expect(() => new ParsedMessage(test)).toThrow();
        });
    });

    describe("Successful parsing examples", () => {
        const parsingPositiveCases: [string, { message: string, fields: Record<string, any> }][] = Object.entries(parsingPositive);

        test.each(parsingPositiveCases)(
            "%s",
            (_, test) => {
                const parsedMessage = new ParsedMessage(test.message);
                for (const [field, value] of Object.entries(test.fields)) {
                    if (value === null) {
                        expect(parsedMessage[field]).toBeUndefined();
                    }
                    else if (typeof value === "object") {
                        expect(parsedMessage[field]).toStrictEqual(value);
                    } else {
                        expect(parsedMessage[field]).toBe(value);
                    }
                }
            }
        );
    });
});
