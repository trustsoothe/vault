import type { AutocompleteInputChangeReason } from "@mui/base/useAutocomplete/useAutocomplete";
import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
  PaperProps,
  SxProps,
  Theme,
} from "@mui/material";
import {AccountType, SerializedAccountReference} from '@poktscan/vault'
import type { AccountWithBalance } from "../../../types";
import type { FormValues } from "../index";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { styled, useTheme } from "@mui/material";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useFormContext } from "react-hook-form";
import React, { useCallback, useMemo, useState } from "react";
import { SupportedProtocols } from "@poktscan/vault";
import { isValidAddress } from "../../../utils/networkOperations";
import { useAppSelector } from "../../../hooks/redux";
import { getTruncatedText } from "../../../utils/ui";
import { accountsSelector } from "../../../redux/selectors/account";
import { contactsSelector } from "../../../redux/selectors/contact";
import {Contact} from "../../../redux/slices/app/contact";

interface ToAddressAutocompleteProps {
  disabled?: boolean;
  nameSize?: number;
  addressSize?: number;
  truncatedAddressSize?: number;
  textFieldSxProps?: SxProps;
  autocompleteSxProps?: SxProps;
}

const renderAutocompleteOption = (
  props: React.HTMLAttributes<HTMLLIElement>,
  account: AccountWithBalance,
  theme: Theme,
  nameSize = 12,
  addressSize = 12,
  truncatedAddressSize = 0
) => {
  return (
    <Stack
      component={"li"}
      {...props}
      key={account.address}
      sx={{
        paddingX: "10px!important",
        paddingY: "5px!important",
        "& p": {
          lineHeight: "20px",
        },
        "& span": {
          color: `${theme.customColors.dark100}!important`,
        },
      }}
      alignItems={"flex-start!important"}
      borderTop={`1px solid ${theme.customColors.dark15}`}
    >
      <Typography
        fontWeight={500}
        color={theme.customColors.dark100}
        fontSize={nameSize}
      >
        {account.name}
      </Typography>
      <Typography sx={{ fontSize: `${addressSize}px!important` }}>
        {truncatedAddressSize
          ? getTruncatedText(account.address, truncatedAddressSize)
          : account.address}
      </Typography>
    </Stack>
  );
};

export const filterAccounts = (
  searchText: string,
  accounts: Contact[]
) => {
  if (!searchText) {
    return accounts;
  }

  const text = searchText.trim().toLowerCase();

  return accounts.filter((account) => {
    if (account.name.toLowerCase().includes(text)) {
      return true;
    }

    return account.address.toLowerCase().includes(text);
  });
};

const StyledPaper = styled(Paper)<PaperProps>(() => ({
  "& .MuiAutocomplete-noOptions": {
    padding: 0,
  },
}));

const ToAddressAutocomplete: React.FC<ToAddressAutocompleteProps> = ({
  disabled,
  nameSize,
  addressSize,
  truncatedAddressSize,
  textFieldSxProps,
  autocompleteSxProps,
}) => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();
  const [inputValue, setInputValue] = useState("");

  const [protocol, fromAddress] = watch(["protocol", "from"]);
  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);
  const accountsWithBalance = useMemo(() => {
    const accountsWithNoSeeds = accounts.filter((item) => item.accountType !== AccountType.HDSeed)
    return [...accountsWithNoSeeds, ...contacts].filter(
      (item) => protocol === item.protocol && item.address !== fromAddress
    );
  }, [accounts, protocol, fromAddress, contacts]);

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

      const itemComponent = renderAutocompleteOption(
        props,
        account,
        theme,
        nameSize,
        addressSize,
        truncatedAddressSize
      );

      if (state.index === 0) {
        return (
          <React.Fragment key={account.address}>
            <Typography
              color={theme.customColors.dark75}
              fontSize={addressSize || 12}
              paddingLeft={1}
              paddingBottom={0.5}
            >
              Paste the address or select an internal account/contact.
            </Typography>
            {itemComponent}
          </React.Fragment>
        );
      }
      return itemComponent;
    },
    [accountsMap, theme, nameSize, addressSize, truncatedAddressSize]
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

          if (!isValidAddress(value, formValues.protocol)) {
            return "Invalid address";
          }

          return true;
        },
      }}
      render={({
        field: { onChange, value, ...otherProps },
        fieldState: { error },
      }) => {
        const invalidValue = !!value && !isValidAddress(value, protocol);
        return (
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
                    : "Paste the address or type to search between the saved accounts."}
                </Typography>
              )
            }
            clearOnBlur={true}
            onInputChange={(event, value, reason) => {
              onChangeInputValue(event, value, reason);
              if (isValidAddress(value, protocol) && reason === "input") {
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
            onBlur={() => {
              if (!isValidAddress(value, protocol)) {
                onChange(inputValue);
              }
              otherProps.onBlur();
            }}
            sx={{
              width: 1,
              marginTop:
                protocol === SupportedProtocols.Ethereum
                  ? "0px!important"
                  : "20px!important",
              order: protocol === SupportedProtocols.Ethereum ? 1 : 7,
              "& .MuiAutocomplete-endAdornment": {
                top: 6,
                right: "5px!important",
              },
              ...autocompleteSxProps,
            }}
            ListboxProps={{
              sx: {
                maxHeight: 125,
              },
            }}
            PaperComponent={StyledPaper}
            disabled={disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                label={"Recipient"}
                fullWidth
                required
                size={"small"}
                disabled={disabled}
                error={!!error || invalidValue}
                helperText={
                  error?.message || invalidValue ? "Invalid address" : undefined
                }
                sx={{
                  "& input": {
                    fontSize: "12px!important",
                  },
                  ...textFieldSxProps,
                }}
              />
            )}
          />
        );
      }}
    />
  );
};

export default ToAddressAutocomplete;
