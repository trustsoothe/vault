import {z} from "zod";


export const PocketRpcFeeParamValueSchema =  z.object({
  fee_multiplier: z.number().nullable().transform((value, ctx) => {
    if (value === null) {
      return 0.01
    }

    return value
  }),
  default: z.string(),
}).strict();

export const PocketRpcFeeParamsResponseSchema = z.object({
  param_key: z.literal("auth/FeeMultipliers"),
  param_value: z.string().transform((value, ctx) => {
    let paramValue;

    try {
      paramValue = JSON.parse(value)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The value of the param_value "auth/FeeMultipliers" is not a valid JSON string. It could not be parsed.'
      })
      return z.NEVER
    }

    try {
      PocketRpcFeeParamValueSchema.parse(paramValue)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The value for "auth/FeeMultipliers" does not match the expected schema.',
      })
      return z.NEVER
    }

    return value
  }),
});

export const PocketRpcFeeParamsResponseValue = z.object({
  param_key: z.literal("auth/FeeMultipliers"),
  param_value: z.string().transform((value, ctx) => {
    let paramValue;

    try {
      paramValue = JSON.parse(value)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The value of the param_value "auth/FeeMultipliers" is not a valid JSON string. It could not be parsed.'
      })
      return z.NEVER
    }

    try {
      return PocketRpcFeeParamValueSchema.parse(paramValue)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The value for "auth/FeeMultipliers" does not match the expected schema.',
      })
      return z.NEVER
    }
  }),
});

export const PocketRpcBalanceResponseSchema = z.object({
  balance: z.number(),
});

export const PocketRpcCanSendTransactionResponseSchema = z.object({
  code: z.literal(2),
  raw_log: z.string().regex(/^.*txBytes are empty.*$/),
});

export const PocketPPKFileSchema = z.object({
  kdf: z.literal('scrypt'),
  salt: z.string().regex(/^[0-9a-fA-F]+$/),
  secparam: z.string().transform((value, ctx) => {
    const secparam = parseInt(value)

    if (isNaN(secparam)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The secparam value is not a valid number.'
      })
      return z.NEVER
    }

    if (secparam <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The secparam value must be greater than 0.'
      })
      return z.NEVER
    }

    return secparam
  }),
  ciphertext: z.string().min(1),
})
