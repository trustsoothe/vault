import {z} from "zod";


export const PocketRpcFeeParamValueSchema =  z.object({
  fee_multiplier: z.number().nullable(),
  default: z.string().regex(/^[0-9]+$/),
});

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

export const PocketRpcBalanceResponseSchema = z.object({
  balance: z.number(),
});


export const PocketRpcCanSendTransactionResponseSchema = z.object({
  code: z.literal(2),
  raw_log: z.string().regex(/^.*txBytes are empty.*$/),
});
