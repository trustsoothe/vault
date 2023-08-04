import { SerializedAccountReference } from "@poktscan/keyring";

interface AccountWithBalance extends SerializedAccountReference {
  balance?: number;
}
