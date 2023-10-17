import type { SerializedAccountReference } from "@poktscan/keyring";
import type { ExternalTransferRequest } from "../../../types/communication";
import type { RootState } from "../../../redux/store";
import type { FormValues, FromAddressStatus } from "../index";
import { connect } from "react-redux";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  getAddressFromPrivateKey,
  protocolsAreEquals,
} from "../../../utils/networkOperations";
import AccountsAutocompleteV2 from "../../Account/Autocomplete";
import NetworkAutocomplete from "./NetworkAutocomplete";
import AutocompleteAsset from "../../Account/AutocompleteAsset";
import ToAddressAutocomplete from "./ToAddressAutocomplete";
import { getAssetByProtocol, isAddress, isPrivateKey } from "../../../utils";
import AmountFeeInputs, { type AmountStatus } from "./AmountFeeInputs";

interface TransferFormProps {
  fromAddressStatus: FromAddressStatus | null;
  fromAddress: string;
  request?: ExternalTransferRequest;
  fromBalance: number;
  getBalance?: () => void;
  getFee?: () => void;
  fee: number;
  balanceStatus?: AmountStatus;
  feeStatus?: AmountStatus;
  assets: RootState["vault"]["entities"]["assets"]["list"];
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

const TransferForm: React.FC<TransferFormProps> = ({
  fromAddressStatus,
  fromAddress,
  request,
  fromBalance,
  balanceStatus,
  getBalance,
  fee,
  feeStatus,
  getFee,
  assets,
  accounts,
}) => {
  const theme = useTheme();
  const { control, watch, register, formState, setValue, clearErrors } =
    useFormContext<FormValues>();
  const [selectedAccount, setSelectedAccount] =
    useState<SerializedAccountReference>(null);
  const [fromType, asset, from] = watch(["fromType", "asset", "from"]);

  useEffect(() => {
    if (fromType === "saved_account" && isAddress(from) && asset) {
      const account = accounts.find(
        (item) =>
          item.address === from &&
          protocolsAreEquals(item.protocol, asset.protocol)
      );

      if (account) {
        setSelectedAccount(account);
      }
    }
  }, []);

  const onChangeSelectedAccount = useCallback(
    (newAccount: SerializedAccountReference) => {
      setSelectedAccount(newAccount);
      setValue("from", newAccount.address);
      clearErrors("from");

      const asset = getAssetByProtocol(assets, newAccount.protocol);

      if (asset) {
        setValue("asset", asset);
        clearErrors("asset");
      }

      clearErrors("network");
    },
    [setValue, assets, clearErrors]
  );

  const onChangeFromType = useCallback(
    (value: FormValues["fromType"]) => {
      setValue("from", "");
      setValue("toAddress", "");
      setValue("memo", "");
      setValue("amount", "");
      setValue("fee", "");
      setValue("accountPassword", "");
      setValue("network", null);
      clearErrors("from");
      clearErrors("toAddress");
      clearErrors("amount");
      clearErrors("fee");
      clearErrors("accountPassword");
      clearErrors("network");
      setSelectedAccount(null);

      if (value === "private_key" && request?.protocol) {
        const asset = getAssetByProtocol(assets, request.protocol);

        if (asset) {
          setValue("asset", asset);
        }
      } else {
        setValue("asset", null);
      }

      clearErrors("asset");
    },
    [setValue, clearErrors, assets, request]
  );

  const validatePrivateKey = useCallback(
    async (value: string, formValues: FormValues) => {
      if (formValues.fromType === "private_key") {
        if (!isPrivateKey(value)) {
          return "Invalid Private Key";
        }

        if (fromAddress) {
          const addressOfPrivateKey = await getAddressFromPrivateKey(
            value,
            formValues.asset.protocol
          );

          if (addressOfPrivateKey !== fromAddress) {
            return `Should be the PK of ${fromAddress.substring(
              0,
              10
            )}...${fromAddress.substring(fromAddress.length - 10)} wallet`;
          }
        }
      }
      return true;
    },
    [fromAddress]
  );

  const fromIsAccountSaved = fromAddressStatus === "is_account_saved";
  const fromTypeIsPk = fromType === "private_key";

  return (
    <Stack
      width={1}
      spacing={fromTypeIsPk ? (request ? 1.5 : 1.7) : 1.2}
      overflow={"hidden"}
    >
      <Stack
        width={1}
        height={30}
        paddingTop={0.1}
        direction={"row"}
        alignItems={"center"}
        boxSizing={"border-box"}
        justifyContent={"space-between"}
        display={fromAddressStatus ? "none" : "flex"}
      >
        <Typography
          fontSize={14}
          fontWeight={500}
          letterSpacing={"0.5px"}
          color={theme.customColors.dark100}
        >
          From Account
        </Typography>
        <Controller
          name={"fromType"}
          control={control}
          render={({ field }) => (
            <TextField
              select
              size={"small"}
              placeholder={"Type"}
              SelectProps={{
                MenuProps: {
                  sx: {
                    "& .MuiMenuItem-root": {
                      fontSize: 12,
                    },
                  },
                },
              }}
              sx={{
                width: 120,
                backgroundColor: theme.customColors.dark2,
                minHeight: 30,
                maxHeight: 30,
                height: 30,
                "& .MuiSelect-select": {
                  fontSize: "12px!important",
                },
                "& .MuiInputBase-root": {
                  paddingTop: 0.3,
                  minHeight: 30,
                  maxHeight: 30,
                  height: 30,
                  "& input": {
                    minHeight: 30,
                    maxHeight: 30,
                    height: 30,
                  },
                },
              }}
              {...field}
              onChange={(event) => {
                field.onChange(event);
                onChangeFromType(event.target.value as FormValues["fromType"]);
              }}
            >
              <MenuItem value={"saved_account"}>Internal</MenuItem>
              <MenuItem value={"private_key"}>External</MenuItem>
            </TextField>
          )}
        />
      </Stack>
      {fromTypeIsPk && (
        <TextField
          label={"Private Key"}
          fullWidth
          autoFocus
          autoComplete={"off"}
          size={"small"}
          disabled={!asset}
          {...register("from", {
            required: "Required",
            validate: validatePrivateKey,
          })}
          error={!!formState?.errors?.from}
          helperText={
            formState?.errors?.from?.message ||
            (fromAddressStatus === "private_key_required" ? (
              <span>
                Of <b>{fromAddress}</b> wallet
              </span>
            ) : null)
          }
          sx={{
            order: 3,
            "& label:not(.MuiInputLabel-shrink)": {
              fontSize: "12px!important",
              top: 3,
            },
            "& input": {
              fontSize: "12px!important",
            },
          }}
        />
      )}
      {!fromIsAccountSaved && !fromTypeIsPk && (
        <Controller
          control={control}
          render={() => (
            <AccountsAutocompleteV2
              selectedAccount={selectedAccount}
              onChangeSelectedAccount={onChangeSelectedAccount}
              autocompleteProps={{
                disabled: !!fromAddressStatus,
              }}
              textFieldProps={{
                disabled: !!fromAddressStatus,
                error: !!formState.errors.from,
              }}
            />
          )}
          name={"from"}
          rules={{ required: "Required" }}
        />
      )}
      {fromTypeIsPk && (
        <AutocompleteAsset
          control={control}
          disabled={!!request?.protocol && !!asset}
          autocompleteProps={{
            sx: {
              order: 1,
              marginTop: !fromAddressStatus
                ? "10px!important"
                : request
                ? "5px!important"
                : undefined,
            },
          }}
        />
      )}
      <NetworkAutocomplete />
      <AmountFeeInputs
        fee={fee}
        getFee={getFee}
        feeStatus={feeStatus}
        getBalance={getBalance}
        fromBalance={fromBalance}
        requestFee={request?.fee}
        balanceStatus={balanceStatus}
        requestAmount={request?.amount}
      />
      <Divider
        sx={{
          marginTop:
            request && fromTypeIsPk ? "20px!important" : "25px!important",
          marginBottom: request ? "15px!important" : 0,
          order: 5,
        }}
      />
      {!request && (
        <Typography
          fontSize={14}
          fontWeight={500}
          lineHeight={"30px"}
          sx={{
            userSelect: "none",
            order: 6,
          }}
          letterSpacing={"0.5px"}
          marginTop={"10px!important"}
          color={theme.customColors.dark100}
        >
          To Account
        </Typography>
      )}
      <ToAddressAutocomplete disabled={!!request?.toAddress} />
      <Controller
        control={control}
        name={"memo"}
        render={({ field }) => (
          <TextField
            label={"Memo"}
            fullWidth
            autoComplete={"off"}
            size={"small"}
            disabled={!!request?.memo}
            {...field}
            sx={{
              order: 8,
              marginTop: "17px!important",
            }}
          />
        )}
      />
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  assets: state.vault.entities.assets.list,
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(TransferForm);
