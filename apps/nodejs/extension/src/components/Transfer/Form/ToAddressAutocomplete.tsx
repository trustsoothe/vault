import type { AutocompleteInputChangeReason } from "@mui/base/useAutocomplete/useAutocomplete";
import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
  PaperProps,
} from "@mui/material";
import type { SerializedAccountReference } from "@poktscan/keyring";
import type { AccountWithBalance } from "../../../types";
import type { RootState } from "../../../redux/store";
import type { FormValues } from "../index";
import { connect } from "react-redux";
import orderBy from "lodash/orderBy";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { styled, useTheme } from "@mui/material";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useFormContext } from "react-hook-form";
import React, { useCallback, useMemo, useState } from "react";
import { protocolsAreEquals } from "../../../utils/networkOperations";
import { renderAutocompleteOption } from "../../Account/Autocomplete";
import { filterAccounts } from "../../Account/List";
import { isAddress } from "../../../utils";

interface ToAddressAutocompleteProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
  assets: RootState["vault"]["entities"]["assets"]["list"];
  balanceByIdMap: RootState["vault"]["entities"]["accounts"]["balances"]["byId"];
  balancesAreLoading: boolean;
  disabled?: boolean;
}

const StyledPaper = styled(Paper)<PaperProps>(() => ({
  "& .MuiAutocomplete-noOptions": {
    padding: 0,
  },
}));

const ToAddressAutocomplete: React.FC<ToAddressAutocompleteProps> = ({
  accounts,
  assets,
  disabled,
  balanceByIdMap,
  balancesAreLoading,
}) => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();
  const [inputValue, setInputValue] = useState("");

  const asset = watch("asset");

  const accountsWithBalance: AccountWithBalance[] = useMemo(() => {
    return !asset
      ? []
      : orderBy(
          accounts
            .filter((item) => protocolsAreEquals(asset.protocol, item.protocol))
            .map((item) => ({
              ...item,
              balance: balanceByIdMap[item.id]?.amount || 0,
            })),
          ["balance"],
          ["desc"]
        );
  }, [accounts, balanceByIdMap, asset]);

  const accountsMap: Record<string, SerializedAccountReference> =
    useMemo(() => {
      return accountsWithBalance.reduce(
        (acc, item) => ({ ...acc, [item.address]: item }),
        {}
      );
    }, [accountsWithBalance]);

  const onChangeInputValue = useCallback(
    (
      event: React.SyntheticEvent,
      value: string,
      _: AutocompleteInputChangeReason
    ) => {
      setInputValue(value);
    },
    []
  );

  const filterOptions = useCallback(
    (_: never, state: FilterOptionsState<string>) => {
      const value = state.inputValue.toLowerCase().trim();

      if (!value) {
        return [];
      }

      return filterAccounts(value, accountsWithBalance)
        .map((item) => item.address)
        .slice(0, 25);
    },
    [accountsWithBalance]
  );

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<unknown>,
      address: string,
      state: AutocompleteRenderOptionState
    ) => {
      const account = accountsMap[address];

      if (!account) {
        return (
          <Stack
            component={"li"}
            sx={{
              alignItems: "flex-start!important",
              paddingY: "5px!important",
              paddingX: "10px!important",
            }}
            {...props}
          >
            <Typography fontSize={12}>{address}</Typography>
          </Stack>
        );
      }

      return renderAutocompleteOption(
        props,
        account,
        state,
        assets,
        theme,
        balancesAreLoading
      );
    },
    [accountsMap, assets]
  );

  const getOptionLabel = useCallback(
    (address: string) => {
      const account = accountsMap[address];

      if (!account) return address;

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
      name={"toAddress"}
      control={control}
      rules={{
        required: "Required",
        validate: (value, formValues) => {
          if (value && value === formValues.from) {
            return "Should be different than From account";
          }
          return true;
        },
      }}
      render={({
        field: { onChange, value, ...otherProps },
        fieldState: { error },
      }) => (
        <Autocomplete
          options={accountsWithBalance.map((item) => item.address)}
          filterOptions={filterOptions}
          noOptionsText={
            inputValue === value && !!value ? null : (
              <Typography
                fontSize={14}
                color={theme.customColors.dark75}
                paddingY={1.4}
                paddingX={1.6}
              >
                {inputValue
                  ? "No options found / not valid address."
                  : "Paste the address or type to search between the internal accounts."}
              </Typography>
            )
          }
          clearOnBlur={true}
          onInputChange={(event, value, reason) => {
            onChangeInputValue(event, value, reason);
            if (isAddress(value) && reason === "input") {
              onChange(value);
              otherProps.onBlur();
            }
          }}
          selectOnFocus={true}
          renderOption={renderOption}
          getOptionLabel={getOptionLabel}
          popupIcon={null}
          onChange={(_, newValue) => onChange(newValue)}
          value={value || null}
          {...otherProps}
          sx={{
            marginTop: "5px!important",
            width: 1,
            order: 7,
            "& .MuiAutocomplete-endAdornment": {
              top: 6,
              right: "5px!important",
            },
          }}
          ListboxProps={{
            sx: {
              maxHeight: 122,
            },
          }}
          PaperComponent={StyledPaper}
          disabled={!asset || disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label={"To Address"}
              fullWidth
              size={"small"}
              disabled={!asset || disabled}
              error={!!error}
              helperText={error?.message}
              sx={{
                "& input": {
                  fontSize: "12px!important",
                },
              }}
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
    assets: state.vault.entities.assets.list,
    balanceByIdMap: state.vault.entities.accounts.balances.byId,
    balancesAreLoading: state.vault.entities.accounts.balances.loading,
  };
};

export default connect(mapStateToAccountProps)(ToAddressAutocomplete);
