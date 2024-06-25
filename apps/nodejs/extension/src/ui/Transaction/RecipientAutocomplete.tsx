import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
} from "@mui/material";
import type { AutocompleteInputChangeReason } from "@mui/base/useAutocomplete/useAutocomplete";
import Stack from "@mui/material/Stack";
import React, { useMemo, useState } from "react";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import { AccountType } from "@poktscan/vault";
import { filterAccounts } from "../../components/Transfer/Form/ToAddressAutocomplete";
import AccountInfo, { AccountAvatar } from "../components/AccountInfo";
import TextFieldWithPaste from "../components/TextFieldWithPaste";
import { contactsSelector } from "../../redux/selectors/contact";
import { accountsSelector } from "../../redux/selectors/account";
import { isValidAddress } from "../../utils/networkOperations";
import { Controller, useFormContext } from "react-hook-form";
import CloseIcon from "../assets/img/rounded_close_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { themeColors } from "../theme";

export default function RecipientAutocomplete() {
  const { control, watch } = useFormContext();
  const [protocol, fromAddress] = watch(["protocol", "fromAddress"]);
  const [inputValue, setInputValue] = useState("");

  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);

  const options = useMemo(() => {
    return contacts
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
              account.address !== fromAddress
          )
          .map((account) => ({
            address: account.address,
            name: account.name,
            type: "account",
          }))
      );
  }, [accounts, contacts, protocol, fromAddress]);

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

  return (
    <Controller
      name={"recipientAddress"}
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
        const optionSelected = optionsMap[value];

        return (
          <Autocomplete
            options={options.map((item) => item.address)}
            filterOptions={filterOptions}
            clearOnBlur={true}
            onInputChange={(event, value, reason) => {
              onChangeInputValue(event, value, reason);
              if (isValidAddress(value, protocol) && reason === "input") {
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
              if (!isValidAddress(value, protocol)) {
                onChange(inputValue);
              }
              otherProps.onBlur();
            }}
            sx={{
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
            // disabled={disabled}
            renderInput={(params) => (
              <TextFieldWithPaste
                {...params}
                InputProps={{
                  ...params.InputProps,
                  ...(!!inputValue &&
                    !value && {
                      endAdornment: (
                        <IconButton
                          onClick={() => {
                            setInputValue("");
                          }}
                          sx={{
                            path: { fill: themeColors.primary },
                            marginRight: -2.2,
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
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
                overrideEndAdornment={!!value || !!inputValue}
                placeholder={"Public Address"}
                fullWidth
                required
                onPaste={(address) => {
                  onChange(address);
                }}
                size={"small"}
                // disabled={disabled}
                error={!!error || invalidValue}
                helperText={
                  error?.message || invalidValue ? "Invalid address" : undefined
                }
                sx={{
                  "& .MuiInputBase-root": {
                    paddingRight:
                      value || inputValue ? "35px!important" : "15px!important",
                  },
                  "& input": {
                    fontSize: "12px!important",
                  },
                  "& .MuiButton-textPrimary": {
                    marginTop: -0.2,
                  },
                  // ...textFieldSxProps,
                }}
              />
            )}
          />
        );
      }}
    />
  );
}
