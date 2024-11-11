import type { PoktTransactionFormValues } from "../BaseTransaction";
import { isInt } from "web3-validator";
import Stack from "@mui/material/Stack";
import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { roundAndSeparate } from "../../../utils/ui";
import { themeColors } from "../../theme";

export default function UpgradeForm() {
  const { control, setError, watch, getValues, getFieldState, clearErrors } =
    useFormContext<PoktTransactionFormValues>();

  const [upgradeType] = watch(["upgradeType"]);

  const { fields, replace, remove } = useFieldArray({
    control,
    name: "features",
  });

  const itemToAdd = watch("features.0");

  useEffect(() => {
    const { error: errorAddress } = getFieldState("features.0.feature");

    if (errorAddress) {
      clearErrors("features.0.feature");
    }
  }, [itemToAdd?.feature]);

  useEffect(() => {
    const { error: errorHeight } = getFieldState("features.0.height");

    if (errorHeight) {
      clearErrors("features.0.height");
    }
  }, [itemToAdd?.height]);

  const submitAddFeatureForm = async () => {
    const items = getValues("features");

    if (items.length) {
      const itemToAdd = items.at(0);
      let error = false;

      if (!itemToAdd.feature) {
        setError("features.0.feature", {
          message: "Required",
        });
        error = true;
      } else if (!/^[A-Za-z]+$/.test(itemToAdd.feature)) {
        setError("features.0.feature", {
          message: "Invalid feature",
        });
        error = true;
      } else if (
        items.slice(1).some((item) => item.feature === itemToAdd.feature)
      ) {
        setError("features.0.feature", {
          message: "Feature already added",
        });
        error = true;
      }

      if (!itemToAdd.height) {
        setError("features.0.height", {
          message: "Required",
        });
        error = true;
      } else if (Number(itemToAdd.height) < 0) {
        setError("features.0.height", {
          message: "Min is 0",
        });
        error = true;
      } else if (!isInt(Number(itemToAdd.height))) {
        setError("features.0.height", {
          message: "Only integers allowed",
        });
        error = true;
      }

      if (error) return;

      const newFields: PoktTransactionFormValues["features"] = items.map(
        (item) => ({
          feature: item.feature,
          height: item.height,
          type: "added",
        })
      );

      newFields.unshift({ feature: "", height: "", type: "adding" });

      replace(newFields);

      clearErrors("features");
    }
  };

  return (
    <>
      <Controller
        control={control}
        name={"upgradeType"}
        render={({ field, fieldState: { error } }) => (
          <TextField
            label={"Upgrade Type"}
            select
            required
            {...field}
            error={!!error}
            helperText={error?.message}
            sx={{
              "& .MuiFormHelperText-root": {
                fontSize: 11,
              },
              "& .MuiSelect-select": {
                paddingRight: "16px!important",
              },
              "& .MuiFormLabel-root": {
                marginTop: -0.7,
                display: field.value ? "none" : undefined,
              },
            }}
            InputLabelProps={{
              shrink: false,
            }}
          >
            <MenuItem value="version">Version</MenuItem>
            <MenuItem value="features">Features</MenuItem>
          </TextField>
        )}
      />
      {upgradeType === "features" && (
        <>
          <Divider sx={{ marginY: 1.2 }} />
          <Controller
            control={control}
            name={"features"}
            rules={{
              validate: (value) => {
                return value.length < 2
                  ? "Should have at least one feature"
                  : true;
              },
            }}
            render={({ fieldState: { error } }) => {
              return (
                <>
                  <Typography variant={"subtitle2"}>Features</Typography>
                  {fields[0] && (
                    <>
                      <Stack
                        key={fields[0].id}
                        width={1}
                        direction={"row"}
                        alignItems={"center"}
                        spacing={1.2}
                        sx={{
                          marginTop: 1,
                          "& .MuiAutocomplete-root": {
                            width: 1,
                          },
                          "& .MuiFormHelperText-root": {
                            fontSize: 10,
                            margin: 0,
                            marginLeft: 0.5,
                            whiteSpace: "nowrap",
                          },
                        }}
                      >
                        <Controller
                          control={control}
                          name={"features.0.feature"}
                          render={({ field, fieldState: { error } }) => (
                            <TextField
                              placeholder={"Feature"}
                              autoComplete={"off"}
                              sx={{
                                marginTop: 1.6,
                                marginBottom: error ? 1.8 : undefined,
                              }}
                              {...field}
                              error={!!error}
                              helperText={error?.message}
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name={"features.0.height"}
                          render={({ field, fieldState: { error } }) => (
                            <TextField
                              placeholder={`Height`}
                              fullWidth
                              size={"small"}
                              type={"number"}
                              sx={{
                                marginTop: 1.6,
                                marginBottom: error ? 1.8 : undefined,
                                "& input[type=number]": {
                                  "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button":
                                    {
                                      WebkitAppearance: "none",
                                      margin: 0,
                                    },
                                  MozAppearance: "textfield",
                                },
                                "& .MuiFormHelperText-root": {
                                  marginLeft: 0,
                                  fontSize: 11,
                                  marginTop: 0.1,
                                },
                              }}
                              error={!!error?.message}
                              helperText={error?.message}
                              {...field}
                            />
                          )}
                        />
                        <Button
                          onClick={submitAddFeatureForm}
                          variant={"contained"}
                          sx={{
                            minWidth: 0,
                            borderRadius: "5px",
                          }}
                        >
                          Add
                        </Button>
                      </Stack>
                    </>
                  )}
                  {fields.length > 1 && (
                    <>
                      <Divider sx={{ marginY: 1.5 }} />
                      <Stack spacing={1} overflow={"auto"} maxHeight={272}>
                        {fields.slice(1).map((item, index) => (
                          <Stack
                            key={item.id}
                            spacing={1.2}
                            direction={"row"}
                            alignItems={"center"}
                            bgcolor={themeColors.bgLightGray}
                            borderRadius={"8px"}
                            padding={1}
                          >
                            <Stack flexGrow={1} minWidth={0}>
                              <Typography
                                noWrap
                                variant={"subtitle2"}
                                fontSize={12}
                              >
                                {item.feature}
                              </Typography>
                            </Stack>

                            <Typography textAlign={"right"}>
                              {roundAndSeparate(Number(item.height), 0, "0")}
                            </Typography>
                            <Stack
                              width={48}
                              alignItems={"center"}
                              justifyContent={"center"}
                              marginRight={"-4px!important"}
                            >
                              <IconButton
                                onClick={() => {
                                  remove(index + 1);
                                }}
                                sx={{
                                  width: 20,
                                  height: 20,
                                  padding: 0,
                                  marginLeft: 0.8,
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  )}
                  {error?.root && (
                    <Typography
                      fontSize={11}
                      marginTop={0.8}
                      lineHeight={"16px"}
                      color={themeColors.red}
                    >
                      {error.root.message}
                    </Typography>
                  )}
                </>
              );
            }}
          />
        </>
      )}
      {upgradeType === "version" && (
        <>
          <Controller
            control={control}
            name={"upgradeHeight"}
            rules={{
              required: "Required",
              validate: (value) => {
                if (isNaN(Number(value)) || value.includes(".")) {
                  return "Invalid height";
                }

                if (Number(value) < 1) {
                  return "Height cannot be less than 1";
                }

                return true;
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                placeholder={`Upgrade Height`}
                required
                fullWidth
                size={"small"}
                type={"number"}
                sx={{
                  marginTop: 1.6,
                  marginBottom: error ? 1 : undefined,
                  "& input[type=number]": {
                    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button":
                      {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                    MozAppearance: "textfield",
                  },
                  "& .MuiFormHelperText-root": {
                    marginLeft: 0,
                    fontSize: 11,
                    marginTop: 0.1,
                  },
                }}
                error={!!error?.message}
                helperText={error?.message}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name={"upgradeVersion"}
            rules={{
              required: "Required",
              validate: (value) => {
                if (value.length == 0) {
                  return "Required";
                }

                return true;
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                placeholder={`Upgrade Version`}
                required
                fullWidth
                size={"small"}
                type={"text"}
                sx={{
                  marginTop: 1.6,
                  marginBottom: error ? 1 : undefined,
                }}
                error={!!error?.message}
                helperText={error?.message}
                {...field}
              />
            )}
          />
        </>
      )}
    </>
  );
}
