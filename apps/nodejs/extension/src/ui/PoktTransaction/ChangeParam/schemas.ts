import { z } from "zod";
import { SupportedProtocols } from "@soothe/vault";
import { isValidAddress } from "../../../utils/networkOperations";

export const stringSchema = z.string().nonempty();
export const addressSchema = z
  .string()
  .refine(
    (value) => isValidAddress(value, SupportedProtocols.Pocket),
    "Invalid address"
  );
export const intSchema = z.string().regex(/^\d+$/);
export const floatSchema = z.string().regex(/^\d+\.\d+$/);
export const chainsSchema = z
  .array(z.string().length(4).toUpperCase())
  .nonempty();
export const booleanSchema = z.enum(["true", "false"]);

export const feeMultiplierSchema = z.object({
  fee_multiplier: z
    .object({
      key: stringSchema,
      multiplier: intSchema,
    })
    .optional()
    .nullable(),
  default: intSchema,
});

export const upgradeSchema = z.object({
  type: z.literal("gov/upgrade"),
  value: z.object({
    Height: intSchema,
    Version: z
      .string()
      .nonempty()
      .regex(/^\d+\.\d+\.\d+$/),
    OldUpgradeHeight: intSchema,
    Features: z.array(
      z
        .string()
        .nonempty()
        .regex(/^[A-Za-z]+:\d+$/)
    ),
  }),
});

export const govAclListSchema = z.object({
  type: z.literal("gov/non_map_acl"),
  value: z
    .array(
      z.object({
        acl_key: z.string().nonempty(),
        address: addressSchema,
      })
    )
    .nonempty(),
});
const relaysToTokenMultiplierSchema = z.record(stringSchema, intSchema);

export function getSchemaFromParamKey(
  paramKey: string,
  value: string
): { schema: z.ZodTypeAny; schemaIsSecure: boolean } {
  const returnValue = (schema: z.ZodTypeAny, schemaIsSecure = false) => ({
    schema,
    schemaIsSecure,
  });

  if (paramKey) {
    switch (paramKey) {
      case "auth/FeeMultipliers": {
        return returnValue(feeMultiplierSchema);
      }
      case "gov/acl": {
        return returnValue(govAclListSchema);
      }
      case "gov/upgrade": {
        return returnValue(upgradeSchema);
      }
      case "pos/RelaysToTokensMultiplierMap": {
        return returnValue(relaysToTokenMultiplierSchema);
      }
      case "pocketcore/SupportedBlockchains": {
        return returnValue(chainsSchema);
      }
    }

    try {
      const valueParsed = JSON.parse(value);

      switch (typeof valueParsed) {
        case "string":
          return returnValue(stringSchema);
        case "number":
          if (value.includes(".")) {
            return returnValue(floatSchema);
          } else {
            return returnValue(intSchema);
          }
        case "boolean":
          return returnValue(booleanSchema);
        default:
          return returnValue(stringSchema, false);
      }
    } catch (e) {
      if (isValidAddress(value, SupportedProtocols.Pocket)) {
        return returnValue(addressSchema);
      } else {
        return returnValue(stringSchema);
      }
    }
  }
}
