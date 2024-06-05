import type { SupportedProtocols } from "@poktscan/vault";
import { getPrivateKeyFromPPK } from "../../utils/networkOperations";
import { ImportAccountFormValues } from "./ImportAccountModal";
import { INVALID_FILE_PASSWORD } from "../../errors/account";
import { readFile } from "../../utils/ui";

export async function getPrivateKey(
  data: Omit<ImportAccountFormValues, "account_name">,
  protocol: SupportedProtocols
) {
  try {
    let privateKey: string;

    if (data.json_file) {
      const contentFile = await readFile(data.json_file);

      privateKey = await getPrivateKeyFromPPK(
        contentFile,
        data.file_password,
        protocol
      );
    } else {
      privateKey = data.private_key;
    }

    return privateKey;
  } catch (e) {
    if (
      [
        "Cannot define property stack, object is not extensible",
        "Unsupported state or unable to authenticate data",
        "Key derivation failed - possibly wrong password",
      ].includes(e?.message)
    ) {
      throw INVALID_FILE_PASSWORD;
    }

    throw e;
  }
}
