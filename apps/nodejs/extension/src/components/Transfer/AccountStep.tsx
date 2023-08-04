import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
} from "@mui/material";
import type { SerializedAccountReference } from "@poktscan/keyring";
import type { ExternalTransferRequest } from "../../types/communication";
import type { AccountWithBalance } from "../../types";
import type { RootState } from "../../redux/store";
import type { FormValues } from "./index";
import { connect } from "react-redux";
import React, { useCallback, useEffect, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import { filterAccounts } from "../Account/List";
import ListAccountItem from "../Account/ListItem";
import AutocompleteAsset from "../Account/AutocompleteAsset";
import { getAllBalances } from "../../redux/slices/vault";
import { useAppDispatch } from "../../hooks/redux";

export const isHex = (str: string) => {
  return str.match(/^[0-9a-fA-F]+$/g);
};

export const byteLength = (str: string) => new Blob([str]).size;

//todo: validate private key?
const isPrivateKey = (str: string) => isHex(str) && byteLength(str) === 128;

interface AccountsAutocompleteProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
  fromAddressStatus: string | null;
  balanceByIdMap: RootState["vault"]["entities"]["accounts"]["balances"]["byId"];
}

const AccountsAutocompleteFC: React.FC<AccountsAutocompleteProps> = ({
  accounts,
  fromAddressStatus,
  balanceByIdMap,
}) => {
  const dispatch = useAppDispatch();
  const { control } = useFormContext<FormValues>();

  useEffect(() => {
    dispatch(getAllBalances());
    const timeout = setInterval(() => {
      dispatch(getAllBalances());
    }, 60000);

    return () => clearInterval(timeout);
  }, [dispatch]);

  const accountsWithBalance: AccountWithBalance[] = useMemo(() => {
    return accounts.map((item) => ({
      ...item,
      balance: balanceByIdMap[item.id]?.amount || 0,
    }));
  }, [accounts, balanceByIdMap]);

  const accountsMap: Record<string, SerializedAccountReference> =
    useMemo(() => {
      return accountsWithBalance.reduce(
        (acc, item) => ({ ...acc, [item.address]: item }),
        {}
      );
    }, [accountsWithBalance]);

  const filterOptions = useCallback(
    (_: never, state: FilterOptionsState<string>) => {
      const value = state.inputValue.toLowerCase().trim();

      return filterAccounts(value, accounts)
        .map((item) => item.address)
        .slice(0, 25);
    },
    [accounts]
  );

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<unknown>,
      address: string,
      state: AutocompleteRenderOptionState
    ) => {
      const account = accountsMap[address];

      return (
        <ListAccountItem
          account={account}
          key={address}
          containerProps={{
            ...props,
            sx: {
              alignItems: "flex-start!important",
              "& p": {
                fontSize: "12px!important",
              },
            },
            paddingY: "5px!important",
            paddingX: "10px!important",
            borderTop: state.index !== 0 ? "1px solid lightgray" : undefined,
            py: "5px",
          }}
        />
      );
    },
    [accountsMap]
  );

  const getOptionLabel = useCallback(
    (address: string) => {
      const account = accountsMap[address];

      if (!account) return "";

      const firstCharacters = address.substring(0, 4);
      const lastCharacters = address.substring(address.length - 4);

      return address
        ? `${account.name} (${firstCharacters}...${lastCharacters})`
        : "";
    },
    [accountsMap]
  );

  return (
    <Controller
      name={"from"}
      control={control}
      rules={{ required: "Required" }}
      render={({
        field: { onChange, value, ...otherProps },
        fieldState: { error },
      }) => (
        <Autocomplete
          options={accounts.map((item) => item.address)}
          filterOptions={filterOptions}
          renderOption={renderOption}
          getOptionLabel={getOptionLabel}
          onChange={(_, newValue) => onChange(newValue)}
          value={value || null}
          {...otherProps}
          sx={{
            width: 1,
          }}
          ListboxProps={{
            sx: {
              maxHeight: 225,
            },
          }}
          disabled={!!fromAddressStatus}
          renderInput={(params) => (
            <TextField
              {...params}
              label={"Account"}
              fullWidth
              autoFocus
              size={"small"}
              disabled={!!fromAddressStatus}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      )}
    />
  );
};

const mapStateToAccountProps = (state: RootState) => {
  return {
    accounts: state.vault.entities.accounts.list,
    balanceByIdMap: state.vault.entities.accounts.balances.byId,
  };
};

const AccountsAutocomplete = connect(mapStateToAccountProps)(
  AccountsAutocompleteFC
);

interface NetworkAutocompleteProps {
  networks: RootState["vault"]["entities"]["networks"]["list"];
}

const NetworkAutocompleteFC: React.FC<NetworkAutocompleteProps> = ({
  networks,
}) => {
  const { control, watch } = useFormContext<FormValues>();

  const [asset] = watch(["asset"]);

  const allowedNetworks: TNetwork = useMemo(() => {
    if (!asset) {
      return [];
    }

    return networks.filter(
      (item) =>
        item.protocol.name === asset.protocol.name &&
        item.protocol.chainID === asset.protocol.chainID
    );
  }, [networks, asset]);

  const filterOptions = useCallback(
    (options: TNetwork, state: FilterOptionsState<TNetwork[0]>) => {
      const value = state.inputValue.toLowerCase().trim();

      if (!value) return options;

      return options
        .filter((item) => {
          if (item.name.toLowerCase().includes(value)) {
            return true;
          }
        })
        .slice(0, 25);
    },
    []
  );

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<unknown>,
      option: TNetwork[0],
      state: AutocompleteRenderOptionState
    ) => {
      return (
        <Stack
          {...props}
          sx={{
            paddingY: "5px!important",
            paddingX: "10px!important",
            borderTop: state.index !== 0 ? "1px solid lightgray" : undefined,
            py: "5px",
            alignItems: "flex-start!important",
            "& p": {
              fontSize: "12px!important",
            },
          }}
          direction={"row"}
          spacing={"5px"}
        >
          <Typography fontWeight={600}>{option.rpcUrl}</Typography>
          <Typography>({option.isDefault ? "Default" : "Custom"})</Typography>
        </Stack>
      );
    },
    []
  );

  const getOptionLabel = useCallback((option: TNetwork[0]) => {
    return option ? option.rpcUrl : "";
  }, []);

  const isOptionEqualToValue = useCallback(
    (option: TNetwork[0], value: TNetwork[0]) => {
      return option.id === value.id;
    },
    []
  );

  const disabled = !asset || allowedNetworks?.length === 1;

  return (
    <Controller
      name={"network"}
      control={control}
      rules={{ required: "Required" }}
      render={({
        field: { onChange, value, ref, ...otherProps },
        fieldState: { error },
      }) => (
        <Autocomplete
          options={allowedNetworks}
          filterOptions={filterOptions}
          renderOption={renderOption}
          getOptionLabel={getOptionLabel}
          onChange={(_, newValue) => onChange(newValue)}
          isOptionEqualToValue={isOptionEqualToValue}
          value={value || null}
          {...otherProps}
          sx={{
            width: 1,
          }}
          openOnFocus
          ListboxProps={{
            sx: {
              maxHeight: 225,
            },
          }}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={ref}
              label={"RPC Endpoint"}
              fullWidth
              size={"small"}
              disabled={disabled}
              error={!!error}
              helperText={error?.message}
              sx={{
                "& input": {
                  fontSize: 14,
                },
              }}
            />
          )}
        />
      )}
    />
  );
};

const mapStateToNetworkProps = (state: RootState) => {
  return {
    networks: state.vault.entities.networks.list,
  };
};

const NetworkAutocomplete = connect(mapStateToNetworkProps)(
  NetworkAutocompleteFC
);

type TNetwork = RootState["vault"]["entities"]["networks"]["list"];

interface AccountStepProps {
  fromAddressStatus: string | null;
  fromAddress: string;
  request?: ExternalTransferRequest;
}

const AccountStep: React.FC<AccountStepProps> = ({
  fromAddressStatus,
  fromAddress,
  request,
}) => {
  const { control, watch, register, formState } = useFormContext<FormValues>();
  const [fromType, asset] = watch(["fromType", "asset"]);

  return (
    <Stack width={1} spacing={"20px"}>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        display={fromAddressStatus ? "none" : "flex"}
        width={1}
      >
        <Typography>Account from</Typography>
        <Controller
          name={"fromType"}
          control={control}
          render={({ field }) => (
            <TextField
              select
              size={"small"}
              placeholder={"Type"}
              sx={{
                "& input": {
                  fontSize: 14,
                },
                "& .MuiInputBase-root": {
                  minHeight: 30,
                  maxHeight: 30,
                  height: 30,
                },
              }}
              {...field}
            >
              <MenuItem value={"saved_account"}>Saved Account</MenuItem>
              <MenuItem value={"private_key"}>Private Key</MenuItem>
            </TextField>
          )}
        />
      </Stack>
      <Typography
        fontSize={10}
        color={"gray"}
        component={"span"}
        display={
          fromAddressStatus === "private_key_required" ? "block" : "none"
        }
      >
        Introduce the private key of the following wallet:
        <br /> <b>{fromAddress}</b>.
      </Typography>
      {fromType === "private_key" ? (
        <TextField
          label={"Private Key"}
          fullWidth
          autoFocus
          size={"small"}
          {...register("from", {
            required: "Required",
            validate: (value, formValues) => {
              if (formValues.fromType === "private_key") {
                // todo: when fromAddress presented, the private key should be the private key of fromAddress wallet
                if (!isPrivateKey(value)) {
                  return "Invalid Private Key";
                }
              }
              return true;
            },
          })}
          error={!!formState?.errors?.from}
          helperText={formState?.errors?.from?.message as string}
        />
      ) : (
        <AccountsAutocomplete fromAddressStatus={fromAddressStatus} />
      )}
      {fromType === "private_key" ? (
        <AutocompleteAsset
          control={control}
          disabled={!!request?.protocol && !!asset}
        />
      ) : (
        <TextField
          label={"Account Password"}
          fullWidth
          size={"small"}
          type={"password"}
          {...register("accountPassword", {
            required: "Required",
          })}
          error={!!formState?.errors?.accountPassword}
          helperText={formState?.errors?.accountPassword?.message as string}
        />
      )}
      <NetworkAutocomplete />
    </Stack>
  );
};

export default AccountStep;
