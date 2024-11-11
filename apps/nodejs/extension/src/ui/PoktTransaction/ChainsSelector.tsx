import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useFormContext } from "react-hook-form";
import { SupportedProtocols } from "@poktscan/vault";
import { ChainsMap, useGetChainsMapQuery } from "../../redux/slices/pokt";
import { themeColors } from "../theme";
import { useAppSelector } from "../hooks/redux";
import useGetAllParams from "./useGetAllParams";
import SelectedIcon from "../assets/img/check_icon.svg";
import useDidMountEffect from "../hooks/useDidMountEffect";
import { selectedChainByProtocolSelector } from "../../redux/selectors/network";

const CHAINS_IMAGES_URL = process.env.CHAIN_IMAGES_CDN_URL;

interface ChainsSelectorProps {
  type: "app" | "node";
  marginTop?: number;
}

export default function ChainsSelector({
  type,
  marginTop = 0.8,
}: ChainsSelectorProps) {
  const selectedChain =
    useAppSelector(selectedChainByProtocolSelector)[
      SupportedProtocols.Pocket
    ] || "mainnet";
  const { control, watch } = useFormContext<{ chains: Array<string> }>();
  const { data: chainsMap } = useGetChainsMapQuery(selectedChain);
  const chainId =
    useAppSelector(selectedChainByProtocolSelector)[
      SupportedProtocols.Pocket
    ] || "mainnet";
  const { allParams: params } = useGetAllParams(chainId);
  const [inputValue, setInputValue] = useState("");

  const chains = watch("chains");

  useDidMountEffect(() => {
    if (inputValue && !/^Chains \(\d+ selected\)$/.test(inputValue)) {
      return;
    }

    if (chains.length) {
      setInputValue(`Chains (${chains.length} selected)`);
    }
  }, [chains]);

  const options: Array<string> = JSON.parse(
    params?.pocket_params?.find(
      (param) => param.param_key === "pocketcore/SupportedBlockchains"
    )?.param_value || "[]"
  );

  const maxChains = Number(
    params?.[`${type}_params`]?.find(
      (param) =>
        param.param_key ===
        `${type === "app" ? "application" : "pos"}/MaximumChains`
    )?.param_value || 0
  );

  return (
    <Controller
      control={control}
      name={"chains"}
      defaultValue={[]}
      rules={{
        required: "Required",
        validate: (value) => {
          if (value.length > maxChains) {
            return `Max allowed is ${maxChains} chains`;
          }

          return true;
        },
      }}
      render={({
        field: { onChange, value, ...otherFieldProps },
        fieldState: { error },
      }) => (
        <Autocomplete
          multiple
          options={options}
          value={value || []}
          {...otherFieldProps}
          clearOnBlur={false}
          onFocus={() => {
            if (inputValue === `Chains (${chains.length} selected)`) {
              setInputValue("");
            }
          }}
          renderTags={() => null}
          popupIcon={null}
          inputValue={inputValue}
          onInputChange={(event, value, reason) => {
            if (reason !== "reset") {
              setInputValue(value);
            }
          }}
          onBlur={() => {
            if (chains.length) {
              setInputValue(`Chains (${chains.length} selected)`);
            }
            otherFieldProps.onBlur();
          }}
          disableCloseOnSelect={true}
          filterOptions={(options, state) => {
            if (/^Chains \(\d+ selected\)$/.test(state.inputValue))
              return options;

            const value = state.inputValue.toLowerCase().trim();

            return options.filter((option) => {
              if (option.toLowerCase().includes(value)) {
                return true;
              }

              const chainInfo =
                chainsMap?.[option] || ({} as ChainsMap[string]);

              return chainInfo?.label?.toLowerCase()?.includes(value);
            });
          }}
          onChange={(_, newValue) => {
            onChange(newValue);
          }}
          renderOption={(props, option, { selected }) => {
            const { ...optionProps } = props;

            const chainInfo = chainsMap?.[option] || ({} as ChainsMap[string]);

            return (
              <Stack
                component={"li"}
                direction="row"
                width={1}
                sx={{
                  height: 45,
                  padding: "15px!important",
                  fontWeight: "400",
                  borderRadius: "8px",
                  color: themeColors.black,
                  backgroundColor: selected
                    ? themeColors.bgLightGray
                    : themeColors.white,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                {...optionProps}
              >
                <Stack
                  direction={"row"}
                  alignItems={"center"}
                  spacing={1.1}
                  flexGrow={1}
                  minWidth={0}
                >
                  {(chainInfo?.image || chainsMap?.["default"]) &&
                    CHAINS_IMAGES_URL && (
                      <img
                        width={16}
                        height={16}
                        src={`${CHAINS_IMAGES_URL}/${
                          chainInfo.image || chainsMap.default?.image
                        }`}
                        alt={`${chainInfo.label || option}-img`}
                      />
                    )}

                  <Typography variant={"subtitle2"}>
                    {chainInfo?.label || option}
                  </Typography>
                </Stack>

                {selected && <SelectedIcon />}
              </Stack>
            );
          }}
          ListboxProps={{
            sx: {
              maxHeight: 200,
              marginY: 0.6,
              paddingX: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            },
          }}
          sx={{
            marginTop,
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputProps={{
                ...params.inputProps,
                value: params.inputProps.value
                  ? params.inputProps.value
                  : value?.length
                  ? `Chains (${chains.length} selected)`
                  : "",
              }}
              placeholder={
                chains?.length ? `Chains (${chains.length} selected)` : "Chains"
              }
              error={!!error}
              required
              helperText={error?.message}
              size={"small"}
              sx={{
                "& input": {
                  fontSize: "12px!important",
                },
                "& .MuiButton-textPrimary": {
                  marginTop: -0.2,
                },
                marginBottom: error ? 1 : 0,
              }}
            />
          )}
        />
      )}
    />
  );
}
