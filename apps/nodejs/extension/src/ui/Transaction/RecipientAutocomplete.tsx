import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
  TextFieldProps,
} from "@mui/material";
import type { AutocompleteInputChangeReason } from "@mui/base/useAutocomplete/useAutocomplete";
import type { TransactionFormValues } from "./BaseTransaction";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import React, { useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { AccountType, SupportedProtocols } from "@soothe/vault";
import AccountInfo, { AccountAvatar } from "../components/AccountInfo";
import TextFieldWithPaste from "../components/TextFieldWithPaste";
import { contactsSelector } from "../../redux/selectors/contact";
import { accountsSelector } from "../../redux/selectors/account";
import {
  isValidAddress,
  isValidPublicKey,
} from "../../utils/networkOperations";
import { Controller, useFormContext } from "react-hook-form";
import { useAppSelector } from "../hooks/redux";
import { themeColors } from "../theme";

const filterAccounts = (
  searchText: string,
  accounts: { name: string; address: string }[]
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

interface RecipientAutocompleteProps {
  marginTop?: number;
  label?: string;
  fieldName?: string;
  required?: boolean;
  canSelectContact?: boolean;
  canSelectFrom?: boolean;
  acceptPublicKey?: boolean;
  textFieldProps?: Partial<Omit<TextFieldProps, "onPaste">>;
  smallPasteButton?: boolean;
  shouldBeDifferentFrom?: boolean;
  customValidation?: (value: string) => true | string | Promise<true | string>;
  protocol?: SupportedProtocols;
  canTypeNotSavedAddress?: boolean;
  canPaste?: boolean;
}

export default function RecipientAutocomplete({
  marginTop = 0,
  label = "Public Address",
  canSelectContact = true,
  acceptPublicKey = false,
  canSelectFrom = false,
  textFieldProps,
  smallPasteButton = false,
  fieldName = "recipientAddress",
  customValidation,
  required = true,
  shouldBeDifferentFrom = true,
  canTypeNotSavedAddress = true,
  canPaste = true,
  protocol: protocolFromProps,
}: RecipientAutocompleteProps) {
  const { control, watch } = useFormContext<TransactionFormValues>();
  const [txProtocol, fromAddress, recipientProtocol, selectedAddress] = watch([
    "protocol",
    "fromAddress",
    "recipientProtocol",
    "recipientAddress",
  ]);
  const protocol = protocolFromProps || recipientProtocol || txProtocol;

  const [inputValue, setInputValue] = useState("");

  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);

  const savedAddresses = useMemo(() => {
    return [...accounts, ...contacts]
      .filter((item) => item.protocol === protocol)
      .map((item) => item.address);
  }, [accounts, contacts]);

  const options = useMemo(() => {
    return (canSelectContact ? contacts : [])
      .filter((contact) => contact.protocol === protocol)
      .map((contact) => ({
        address: contact.address,
        name: contact.name,
        type: "contact",
      }))
      .concat(
        accounts
          .filter(
            (account) =>
              account.protocol === protocol &&
              account.accountType !== AccountType.HDSeed &&
              (account.address !== fromAddress || canSelectFrom)
          )
          .map((account) => ({
            address: account.address,
            name: account.name,
            type: "account",
          }))
      );
  }, [
    accounts,
    contacts,
    protocol,
    fromAddress,
    canSelectContact,
    canSelectFrom,
  ]);

  const optionsMap = useMemo(
    () => options.reduce((acc, item) => ({ ...acc, [item.address]: item }), {}),
    [options]
  );

  const onChangeInputValue = (
    event: React.SyntheticEvent,
    value: string,
    _: AutocompleteInputChangeReason
  ) => {
    setInputValue(value);
  };

  const filterOptions = (_: never, state: FilterOptionsState<string>) => {
    const value = state.inputValue.toLowerCase().trim();

    return filterAccounts(value, options)
      .map((item) => item.address)
      .slice(0, 25);
  };
  const renderOption = (
    props: React.HTMLAttributes<unknown>,
    address: string,
    state: AutocompleteRenderOptionState
  ) => {
    const option = optionsMap[address];

    return (
      <Stack
        height={40}
        borderRadius={"8px"}
        component={"li"}
        {...props}
        className={
          option?.type ? props.className + " " + option.type : props.className
        }
        sx={{
          justifyContent: "center!important",
          alignItems: "flex-start!important",
          marginX: 0.6,
          paddingX: "14px!important",
          paddingY: "6px!important",
          p: {
            color: themeColors.black,
          },
        }}
      >
        <AccountInfo
          address={address}
          name={option?.name}
          type={option?.type}
        />
      </Stack>
    );
  };

  const getOptionLabel = (address: string) => {
    const option = optionsMap[address];

    return option?.name || address;
  };

  const isValid = (value: string) => {
    if (protocol === SupportedProtocols.Pocket && acceptPublicKey) {
      return isValidPublicKey(value) || savedAddresses.includes(value);
    }

    return isValidAddress(value, protocol);
  };

  const invalidValue =
    !!inputValue &&
    optionsMap[selectedAddress]?.name !== inputValue &&
    !isValid(inputValue);

  return (
    <Controller
      name={fieldName as any}
      control={control}
      rules={{
        required: required ? "Required" : undefined,
        validate: (value, formValues) => {
          if (!required && !value) {
            return true;
          }

          if (
            value &&
            value === formValues.fromAddress &&
            shouldBeDifferentFrom
          ) {
            return "Should be different than From account";
          }

          if (!isValid(value)) {
            return "Invalid address";
          }

          if (customValidation) {
            return customValidation(value);
          }

          return true;
        },
      }}
      render={({
        field: { onChange, value, ...otherProps },
        fieldState: { error },
      }) => {
        const optionSelected = optionsMap[value];

        return (
          <Autocomplete
            options={options.map((item) => item.address)}
            filterOptions={filterOptions}
            clearOnBlur={true}
            onInputChange={(event, value, reason) => {
              onChangeInputValue(event, value, reason);
              if (
                canTypeNotSavedAddress &&
                isValid(value) &&
                reason === "input"
              ) {
                onChange(value);
                otherProps.onBlur();
              }
            }}
            slotProps={{
              paper: {
                sx: {
                  marginTop: 0.8,
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.16)",
                  "& .contact + .account": {
                    marginTop: 1.3,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      borderTop: `1px solid ${themeColors.borderLightGray}`,
                      height: 0,
                      width: 1,
                      left: 0,
                      marginTop: -6.2,
                    },
                  },
                },
              },
            }}
            selectOnFocus={true}
            renderOption={renderOption}
            getOptionLabel={getOptionLabel}
            popupIcon={null}
            onChange={(_, newValue) => onChange(newValue)}
            value={value || null}
            {...otherProps}
            inputValue={inputValue}
            onBlur={() => {
              if (!isValid(value)) {
                onChange(inputValue);
              }
              otherProps.onBlur();
            }}
            sx={{
              marginTop,
              "& .MuiAutocomplete-endAdornment": {
                top: 1,
                height: 30,
                "& .MuiAutocomplete-clearIndicator": {
                  visibility: "visible",
                },
              },
              // ...autocompleteSxProps,
            }}
            ListboxProps={{
              sx: {
                maxHeight: 250,
                marginY: 0.6,
                padding: 0,
              },
            }}
            clearIcon={
              <Button
                onClick={() => {
                  setInputValue("");
                }}
                sx={{
                  height: 28,
                  minWidth: 60,
                  width: 60,
                  marginTop: "-1px!important",
                  marginRight: -0.6,
                }}
              >
                Clear
              </Button>
            }
            // disabled={disabled}
            renderInput={(params) => (
              <TextFieldWithPaste
                //@ts-ignore
                variant={textFieldProps?.variant}
                {...params}
                smallButton={smallPasteButton}
                InputProps={{
                  ...params.InputProps,
                  ...(!!inputValue &&
                    !value && {
                      endAdornment: (
                        <Button
                          onClick={() => {
                            setInputValue("");
                          }}
                          sx={{
                            height: 28,
                            minWidth: 60,
                            width: 60,
                            marginRight: -3,
                          }}
                        >
                          Clear
                        </Button>
                      ),
                    }),
                  startAdornment:
                    optionSelected && optionSelected.name === inputValue ? (
                      <Stack
                        width={15}
                        height={15}
                        minWidth={15}
                        minHeight={15}
                        marginLeft={0.9}
                      >
                        <AccountAvatar
                          address={value}
                          type={optionSelected.type}
                          name={optionSelected.name}
                        />
                      </Stack>
                    ) : undefined,
                }}
                overrideEndAdornment={!!value || !!inputValue || !canPaste}
                placeholder={label}
                fullWidth
                required={required}
                onPaste={(address) => {
                  onChange(address);
                }}
                size={"small"}
                // disabled={disabled}
                error={!!error || invalidValue}
                helperText={
                  error?.message || invalidValue
                    ? error?.message || "Invalid address"
                    : undefined
                }
                sx={{
                  "& .MuiInputBase-root": {
                    paddingRight:
                      value || inputValue ? "35px!important" : "15px!important",
                  },
                  "& input": {
                    fontSize: "12px!important",
                    paddingRight: "24px!important",
                  },
                  "& .MuiButton-textPrimary": {
                    marginTop: -0.2,
                  },
                  ...(invalidValue && {
                    "& fieldset": {
                      borderColor: themeColors.red + "!important",
                    },
                  }),
                  ...(!invalidValue &&
                    inputValue && {
                      "& fieldset": {
                        borderColor: themeColors.success + "!important",
                      },
                    }),
                  ...textFieldProps?.sx,
                }}
              />
            )}
          />
        );
      }}
    />
  );
}
