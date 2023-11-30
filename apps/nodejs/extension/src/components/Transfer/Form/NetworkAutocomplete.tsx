import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
} from "@mui/material";
import type { FormValues } from "../index";
import type { NetworkForOperations } from "../../../utils/networkOperations";
import { useTheme } from "@mui/material";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useCallback, useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useFormContext } from "react-hook-form";
import { useAppSelector } from "../../../hooks/redux";
import {
  customRpcsSelector,
  networksSelector,
} from "../../../redux/selectors/network";

const NetworkAutocomplete: React.FC = () => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();

  const [protocol, chainId, rpcUrl] = watch(["protocol", "chainId", "rpcUrl"]);
  const networks = useAppSelector(networksSelector);
  const customRpcs = useAppSelector(customRpcsSelector);

  const allowedNetworks = useMemo(() => {
    const allRpcs = [
      ...networks.map(
        (network) =>
          ({
            protocol: network.protocol,
            id: network.id,
            chainID: network.chainId,
            isDefault: true,
            isPreferred: false,
            rpcUrl: network.rpcUrl,
          } as NetworkForOperations)
      ),
      ...customRpcs.map(
        (rpc) =>
          ({
            protocol: rpc.protocol,
            id: rpc.id,
            chainID: rpc.chainId,
            isDefault: false,
            isPreferred: rpc.isPreferred,
            rpcUrl: rpc.url,
          } as NetworkForOperations)
      ),
    ];

    return orderBy(
      allRpcs
        .filter(
          (item) => item.protocol === protocol && item.chainID === chainId
        )
        .map((item) => ({
          ...item,
          rank: item.isPreferred ? 1 : item.isDefault ? 2 : 3,
        })),
      ["rank"],
      ["asc"]
    );
  }, [networks, protocol, chainId, customRpcs]);

  const selectedNetwork = useMemo(() => {
    return allowedNetworks.find(
      (item) =>
        item.rpcUrl === rpcUrl &&
        item.chainID === chainId &&
        item.protocol === protocol
    );
  }, [allowedNetworks, rpcUrl, chainId, protocol]);

  const filterOptions = useCallback(
    (
      options: NetworkForOperations[],
      state: FilterOptionsState<NetworkForOperations>
    ) => {
      const value = state.inputValue.toLowerCase().trim();

      return options
        .filter((item) => {
          if ((value && item.rpcUrl.toLowerCase().includes(value)) || !value) {
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
      option: NetworkForOperations,
      state: AutocompleteRenderOptionState
    ) => {
      return (
        <Stack
          {...props}
          sx={{
            paddingX: "10px!important",
            borderTop:
              state.index !== 0
                ? `1px solid ${theme.customColors.dark15}`
                : undefined,
            alignItems: "flex-start!important",
            "& p": {
              fontSize: "12px!important",
            },
          }}
          direction={"row"}
          spacing={"5px"}
        >
          <Typography
            fontWeight={500}
            textOverflow={"ellipsis"}
            whiteSpace={"nowrap"}
            overflow={"hidden"}
          >
            {option.rpcUrl}
          </Typography>
          <Typography color={theme.customColors.dark90}>
            {option.isDefault
              ? "(Default)"
              : option.isPreferred
              ? "(Preferred)"
              : ""}
          </Typography>
        </Stack>
      );
    },
    [theme]
  );

  const getOptionLabel = useCallback((option: NetworkForOperations) => {
    return option ? option.rpcUrl : "";
  }, []);

  const isOptionEqualToValue = useCallback(
    (option: NetworkForOperations, value: NetworkForOperations) => {
      return option.id === value.id;
    },
    []
  );

  const disabled = allowedNetworks?.length === 1;

  return (
    <Controller
      name={"rpcUrl"}
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
          onChange={(_, newValue) => onChange(newValue.rpcUrl)}
          isOptionEqualToValue={isOptionEqualToValue}
          value={selectedNetwork || null}
          clearIcon={null}
          {...otherProps}
          sx={{
            width: 1,
            order: 2,
            marginTop: 2,
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
                "& label:not(.MuiInputLabel-shrink)": {
                  fontSize: 12,
                  top: 3,
                },
                "& input": {
                  fontSize: "12px!important",
                  color: theme.customColors.dark90,
                },
              }}
            />
          )}
        />
      )}
    />
  );
};

export default NetworkAutocomplete;
