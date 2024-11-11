import { z } from "zod";
import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import ExpandIcon from "@mui/icons-material/OpenInFull";
import { Controller, useFormContext } from "react-hook-form";
import CollapseIcon from "@mui/icons-material/CloseFullscreen";
import { SupportedProtocols } from "@poktscan/vault";
import { selectedChainByProtocolSelector } from "../../../redux/selectors/network";
import { RenderMessage } from "../../Request/SignTypedData";
import CopyIcon from "../../assets/img/copy_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { getSchemaFromParamKey } from "./schemas";
import useGetAllParams from "../useGetAllParams";
import { themeColors } from "../../theme";
import MemoInput from "../MemoInput";

export default function ChangeParam() {
  const { control, watch } = useFormContext<{
    paramKey: string;
    paramValue: string;
    overrideGovParamsWhitelistValidation: boolean;
  }>();

  const chainId =
    useAppSelector(selectedChainByProtocolSelector)[
      SupportedProtocols.Pocket
    ] || "mainnet";
  const { allParams: params } = useGetAllParams(chainId);

  const paramKey = watch("paramKey");
  const [expandCurrentParamValue, setExpandCurrentParamValue] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  const allParams = [
    ...(params?.app_params || []),
    ...(params?.node_params || []),
    ...(params?.pocket_params || []),
    ...(params?.auth_params || []),
    ...(params?.gov_params || []),
  ].reduce(
    (acc, param) => ({ ...acc, [param.param_key]: param.param_value }),
    {}
  );

  const options = Object.keys(allParams).sort();

  const { schema, schemaIsSecure } = paramKey
    ? getSchemaFromParamKey(paramKey, allParams[paramKey])
    : { schema: null, schemaIsSecure: null };

  const valueIsObject = schema
    ? schema instanceof z.ZodObject || schema instanceof z.ZodArray
    : false;

  const copyCurrentParamValue = () => {
    let text = allParams[paramKey];

    if (valueIsObject) {
      text = JSON.stringify(JSON.parse(allParams[paramKey]), null, 2);
    }

    navigator.clipboard.writeText(text).then(() => {
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 1000);
    });
  };

  const copyComponent = (
    <Tooltip arrow title={"Copied"} placement={"top"} open={showCopyTooltip}>
      <IconButton
        onClick={copyCurrentParamValue}
        sx={{ transform: "scale(1.3)" }}
      >
        <CopyIcon />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      <Controller
        control={control}
        name={"paramKey"}
        render={({
          field: { onChange, value, ...otherFieldProps },
          fieldState: { error },
        }) => (
          <Autocomplete
            options={options}
            value={value}
            {...otherFieldProps}
            onChange={(_, newValue) => {
              onChange(newValue);
            }}
            ListboxProps={{
              sx: {
                maxHeight: 200,
                marginY: 0.6,
                paddingX: 1,
              },
            }}
            sx={{
              "& .MuiAutocomplete-endAdornment": {
                marginTop: paramKey ? -0.3 : 0,
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={"Param Key"}
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
      {paramKey && (
        <Stack
          bgcolor={themeColors.bgLightGray}
          spacing={0.7}
          boxSizing={"border-box"}
          borderRadius={"8px"}
          width={1}
          paddingY={1.2}
          paddingX={1.4}
          border={`1px solid ${themeColors.light_gray1}`}
          marginTop={1.6}
          maxHeight={
            valueIsObject && !expandCurrentParamValue ? 174 : undefined
          }
        >
          <Stack
            spacing={1}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography fontSize={12} variant={"subtitle2"}>
              Current Param Value
            </Typography>
            {valueIsObject && (
              <Stack direction={"row"} alignItems={"center"} spacing={1}>
                {copyComponent}
                <IconButton
                  onClick={() => setExpandCurrentParamValue((prev) => !prev)}
                >
                  {expandCurrentParamValue ? (
                    <CollapseIcon sx={{ fontSize: 18, color: "#8B93A0" }} />
                  ) : (
                    <ExpandIcon
                      sx={{ fontSize: 17, marginLeft: 0.1, color: "#8B93A0" }}
                    />
                  )}
                </IconButton>
              </Stack>
            )}
          </Stack>

          <Stack
            padding={1}
            borderRadius={"8px"}
            bgcolor={themeColors.white}
            border={`1px solid ${themeColors.light_gray1}`}
            overflow={"auto"}
          >
            {valueIsObject ? (
              <RenderMessage
                message={JSON.parse(allParams[paramKey])}
                capitalizeMessage={false}
                marginLeft={0.3}
                fontSize={11}
              />
            ) : (
              <Stack alignItems={"center"} direction={"row"} spacing={1}>
                <Typography
                  flexGrow={1}
                  fontSize={13}
                  lineHeight={"16px"}
                  variant={"subtitle2"}
                  sx={{ wordBreak: "break-word" }}
                >
                  {allParams[paramKey]}
                </Typography>
                <Stack marginTop={"2px!important"} alignSelf={"flex-start"}>
                  {copyComponent}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
      <Controller
        control={control}
        name={"paramValue"}
        rules={{
          required: "Required",
          validate: (value) => {
            try {
              if (schema) {
                schema.parse(valueIsObject ? JSON.parse(value) : value);
                return true;
              } else {
                return "";
              }
            } catch (e) {
              return "Invalid value";
            }
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            placeholder={"New Param Value"}
            disabled={!paramKey}
            {...field}
            required
            error={!!error}
            multiline={valueIsObject}
            minRows={3}
            helperText={error?.message}
            sx={{
              marginTop: 1.6,
              "& .MuiFormHelperText-root": {
                fontSize: 11,
              },
              ...(valueIsObject && {
                " &.MuiFormControl-root": {
                  height: "unset",
                },
                "& .MuiInputBase-root": {
                  height: "unset",
                },
              }),
            }}
          />
        )}
      />
      <Stack
        width={1}
        height={21}
        marginTop={1.6}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography variant={"subtitle2"} fontSize={12}>
          Override Gov Params Whitelist Validation
        </Typography>
        <Controller
          control={control}
          name={"overrideGovParamsWhitelistValidation"}
          render={({ field }) => (
            <Switch size={"small"} {...field} checked={field.value} />
          )}
        />
      </Stack>
      <MemoInput />
    </>
  );
}
