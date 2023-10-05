import type {
  AutocompleteProps,
  AutocompleteRenderOptionState,
  FilterOptionsState,
  TextFieldProps,
} from "@mui/material";
import type { SerializedAsset } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import { connect } from "react-redux";
import React, { useCallback } from "react";
import { Controller } from "react-hook-form";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";

interface AutocompleteAssetProps {
  assets: RootState["vault"]["entities"]["assets"]["list"];
  control;
  name?: string;
  disabled?: boolean;
  textFieldProps?: TextFieldProps;
  autocompleteProps?: Partial<AutocompleteProps<any, any, any, any>>;
}

const AutocompleteAsset: React.FC<AutocompleteAssetProps> = ({
  assets,
  control,
  name = "asset",
  disabled,
  textFieldProps,
  autocompleteProps,
}) => {
  const filterOptions = useCallback(
    (
      options: SerializedAsset[],
      state: FilterOptionsState<SerializedAsset>
    ) => {
      const value = state.inputValue.toLowerCase().trim();

      if (!value) return options;

      return options.filter(
        ({ name, symbol, protocol: { name: protocolName, chainID } }) => {
          if (symbol.toLowerCase().includes(value)) {
            return true;
          }

          if (name.toLowerCase().includes(value)) {
            return true;
          }

          if (labelByProtocolMap[protocolName].toLowerCase().includes(value)) {
            return true;
          }

          if (chainID.toLowerCase().includes(value)) {
            return true;
          }

          return false;
        }
      );
    },
    []
  );

  const getOptionLabel = useCallback(
    (option: SerializedAsset) => `${option.name} - ${option.symbol}`,
    []
  );

  const isOptionEqualToValue = useCallback(
    (option: SerializedAsset, value: SerializedAsset) => option.id === value.id,
    []
  );

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<unknown>,
      asset: SerializedAsset,
      state: AutocompleteRenderOptionState
    ) => {
      return (
        <Stack
          {...props}
          key={asset.id}
          marginX={1}
          paddingY={"8px!important"}
          paddingX={"5px!important"}
          boxSizing={"border-box"}
          borderTop={state.index === 0 ? undefined : `1px solid lightgray`}
          justifyContent={"flex-start"}
        >
          <Typography fontSize={12} fontWeight={600}>
            {asset.name} ({asset.symbol})
          </Typography>
          <Stack direction={"row"} spacing={"5px"} alignItems={"center"}>
            <Typography fontSize={12}>
              Protocol: {labelByProtocolMap[asset.protocol.name]}
            </Typography>
            <Typography fontSize={12}>-</Typography>
            <Typography fontSize={12}>
              ChainID: {labelByChainID[asset.protocol.chainID]}
            </Typography>
          </Stack>
        </Stack>
      );
    },
    []
  );

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: "Required",
      }}
      render={({
        field: { onChange, value, ref, ...otherProps },
        fieldState: { error },
      }) => {
        return (
          <Autocomplete
            options={assets}
            filterOptions={filterOptions}
            disableClearable={true}
            renderOption={renderOption}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(_, newValue: SerializedAsset) => onChange(newValue)}
            value={value || null}
            {...otherProps}
            disabled={disabled}
            renderInput={(params) => {
              return (
                <TextField
                  {...params}
                  inputRef={ref}
                  fullWidth
                  label={"Account Asset"}
                  size={"small"}
                  error={!!error}
                  helperText={error?.message}
                  disabled={disabled}
                  {...textFieldProps}
                />
              );
            }}
            {...autocompleteProps}
            sx={{
              width: 1,
              ...autocompleteProps?.sx,
            }}
          />
        );
      }}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    assets: state.vault.entities.assets.list,
  };
};

export default connect(mapStateToProps)(AutocompleteAsset);
