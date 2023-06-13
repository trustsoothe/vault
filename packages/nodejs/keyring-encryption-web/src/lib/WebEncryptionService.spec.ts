import {describe, beforeEach, expect, test} from 'vitest';
import {EncryptionServiceSpecFactory} from '@poktscan/keyring';
import {WebEncryptionService} from "./WebEncryptionService";

describe('WebEncryptionService', () => {
  /**
   * Vitest (or esbuild) is unable to import "vitest" inside the imported function. So we're passing the used vitest
   * methods from our own import.
   */
  EncryptionServiceSpecFactory(WebEncryptionService, beforeEach, describe, expect, test)
})
