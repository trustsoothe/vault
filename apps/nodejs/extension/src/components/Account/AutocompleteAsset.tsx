import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import React, { useCallback } from "react";
import { Controller } from "react-hook-form";
import {
  Autocomplete,
  AutocompleteRenderOptionState,
  FilterOptionsState,
} from "@mui/material";
import { SerializedAsset, SupportedProtocols } from "@poktscan/keyring";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const labelByProtocol: Record<SupportedProtocols, string> = {
  [SupportedProtocols.POCKET_NETWORK]: "Pocket Network",
  [SupportedProtocols.UNKNOWN]: "Unknown",
};

interface AutocompleteAssetProps {
  assets: RootState["vault"]["entities"]["assets"]["list"];
  control;
  name?: string;
}

const AutocompleteAsset: React.FC<AutocompleteAssetProps> = ({
  assets,
  control,
  name = "asset",
}) => {
  const filterOptions = useCallback(
    (
      options: SerializedAsset[],
      state: FilterOptionsState<SerializedAsset>
    ) => {
      const value = state.inputValue.toLowerCase().trim();

      if (!value) return options;

      return options.filter(
        ({ name, symbol, network: { protocol, chainId } }) => {
          if (symbol.toLowerCase().includes(value)) {
            return true;
          }

          if (name.toLowerCase().includes(value)) {
            return true;
          }

          if (protocol.toLowerCase().includes(value)) {
            return true;
          }

          if (chainId.toLowerCase().includes(value)) {
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
              Protocol: {labelByProtocol[asset.network.protocol]}
            </Typography>
            <Typography fontSize={12}>-</Typography>
            <Typography fontSize={12}>
              ChainID: {asset.network.chainId}
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
        field: { onChange, value, ...otherProps },
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
            sx={{
              width: 1,
            }}
            renderInput={(params) => {
              return (
                <TextField
                  {...params}
                  fullWidth
                  label={"Account Asset"}
                  size={"small"}
                  //{...register("account_name", { required: "Required" })}
                  error={!!error}
                  helperText={error?.message}
                />
              );
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
