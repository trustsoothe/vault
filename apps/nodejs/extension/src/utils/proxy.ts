import type { SupportedProtocols } from "@soothe/vault";
import { z, ZodError } from "zod";
import {
  propertyIsNotValid,
  propertyIsRequired,
  propertyOfTypeIsNotValid,
  typeIsNotValid,
} from "../errors/communication";
import {
  isBytes,
  isInt,
  isUInt,
  isAddress as isEthAddress,
} from "web3-validator";

export function isPocketAddress(address: string): boolean {
  return /^[0-9a-fA-F]+$/g.test(address) && address.length === 40;
}

export function isShannonAddress(address: string) {
  return /^pokt[ac-hj-np-z0-9]{39}$/.test(address);
}

export const isValidAddress = (
  address: string,
  protocol: SupportedProtocols
) => {
  const fn = (() => {
    switch (protocol) {
      case "Pocket":
        return isPocketAddress;
      case "Ethereum":
        return isEthAddress;
      case "Cosmos":
        return isShannonAddress;
      default:
        throw new Error("Unsupported protocol");
    }
  })();

  return fn(address);
};

const typedDataSchema = z.object({
  types: z.record(
    z.string(),
    z.array(
      z
        .object({
          name: z.string(),
          type: z.string(),
        })
        .strict()
    )
  ),
  domain: z
    .object({
      name: z.string(),
      version: z.string().or(z.number().transform(String)),
      chainId: z.number().int(),
      verifyingContract: z.string(),
      salt: z.string(),
    })
    .partial()
    .refine((value) => Object.keys(value).length !== 0, "cannot be empty"),
  primaryType: z.string(),
  message: z.record(z.string(), z.any()),
});

const solidityTypes = ["string", "address", "int", "uint", "bytes"];

function isValidSolidityType(type: string) {
  try {
    if (solidityTypes.includes(type)) {
      return true;
    }

    if (type.startsWith("bytes")) {
      const num = Number(type.replace("bytes", ""));

      return num >= 1 && num <= 32;
    }

    if (type.startsWith("int") || type.startsWith("uint")) {
      const num = Number(type.replace("int", "").replace("u", ""));

      return num >= 8 && num <= 256;
    }

    return false;
  } catch (e) {
    return false;
  }
}

export const validateTypedDataPayload = (
  payload: z.infer<typeof typedDataSchema>
) => {
  try {
    if (!payload.types) {
      return propertyIsRequired("types");
    }

    if (!payload.primaryType) {
      return propertyIsRequired("primaryType");
    }

    if (!payload.domain) {
      return propertyIsRequired("domain");
    }

    if (!payload.message) {
      return propertyIsRequired("message");
    }

    try {
      payload = typedDataSchema.parse(payload);
    } catch (e) {
      const zodError: ZodError = e;
      const path = zodError?.issues?.[0]?.path?.[0];

      return propertyIsNotValid(path as string);
    }

    const getPropsOfType = (type) =>
      payload.types[type].reduce(
        (acc, item) => ({ ...acc, [item.name]: item.type }),
        {}
      );

    const validateType = (obj: object, type: keyof typeof payload.types) => {
      const types = getPropsOfType(type);

      for (const objKey in obj) {
        const value = obj[objKey];
        const typeOfValue = types[objKey].replaceAll("[]", "");

        const checkType = (valueItem: string | object | number) => {
          if (payload.types[typeOfValue]) {
            const err = validateType(valueItem as object, typeOfValue);

            if (err) {
              return err;
            }
          } else {
            if (!isValidSolidityType(typeOfValue)) {
              return typeIsNotValid(typeOfValue);
            }

            let invalid = false;

            if (typeOfValue === "string" && typeof valueItem !== "string") {
              invalid = true;
            } else if (
              typeOfValue === "address" &&
              !isEthAddress(valueItem as string)
            ) {
              invalid = true;
            } else if (/^u?int/.test(typeOfValue)) {
              const isValid = typeOfValue.startsWith("u") ? isUInt : isInt;

              if (!isValid(valueItem as number, { abiType: typeOfValue })) {
                invalid = true;
              }
            } else if (
              typeOfValue.startsWith("bytes") &&
              !isBytes(valueItem as string, { abiType: typeOfValue })
            ) {
              invalid = true;
            }

            if (invalid) {
              return propertyOfTypeIsNotValid(objKey, typeOfValue);
            }
          }
        };

        if (types[objKey].endsWith("[]")) {
          if (Array.isArray(value)) {
            for (const item of value) {
              const err = checkType(item);

              if (err) {
                return err;
              }
            }
          } else {
            return propertyOfTypeIsNotValid(objKey, `${typeOfValue}[]`);
          }
        } else {
          const err = checkType(value);

          if (err) {
            return err;
          }
        }
      }
    };

    const errDomain = validateType(payload.domain, "EIP712Domain");

    if (errDomain) {
      return errDomain;
    }

    return validateType(payload.message, payload.primaryType);
  } catch (e) {
    return propertyIsNotValid("TypedData (params[1])");
  }
};
