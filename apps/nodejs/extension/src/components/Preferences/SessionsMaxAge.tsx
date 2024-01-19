import React, { useCallback, useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { enqueueSnackbar } from "../../utils/ui";
import { setSessionMaxAgeData } from "../../redux/slices/app";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { sessionsMaxAgeSelector } from "../../redux/selectors/preferences";

interface FormValues {
  enabled: boolean;
  maxAge: number;
}

const hourInSecs = 3600;
const SessionsMaxAge: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const sessionsMaxAge = useAppSelector(sessionsMaxAgeSelector);
  const { control, reset, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      enabled: sessionsMaxAge.enabled,
      maxAge: sessionsMaxAge.maxAgeInSecs / hourInSecs,
    },
  });

  useEffect(() => {
    reset({
      enabled: sessionsMaxAge.enabled,
      maxAge: sessionsMaxAge.maxAgeInSecs / hourInSecs,
    });
  }, [sessionsMaxAge]);

  const [enabled, maxAge] = watch(["enabled", "maxAge"]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      setLoading(true);
      dispatch(
        setSessionMaxAgeData({
          maxAgeInSecs: data.maxAge * hourInSecs,
          enabled: data.enabled,
        })
      )
        .then(() => {
          enqueueSnackbar({
            variant: "success",
            message: "Changes applied successfully!",
          });
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
  );

  const showButtons =
    enabled !== sessionsMaxAge.enabled ||
    (enabled && sessionsMaxAge.maxAgeInSecs !== maxAge * hourInSecs);

  return (
    <Stack spacing={0.5} component={"form"} onSubmit={handleSubmit(onSubmit)}>
      <Typography fontSize={14} fontWeight={500}>
        Sessions Max Age
      </Typography>
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={1.5}
        marginTop={"10px!important"}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
          <Typography fontSize={12}>Enabled:</Typography>
          <Controller
            control={control}
            name={"enabled"}
            render={({ field }) => (
              <Switch size={"small"} {...field} checked={field.value} />
            )}
          />
        </Stack>
        <Controller
          name={"maxAge"}
          control={control}
          rules={{
            validate: (value) => {
              const num = Number(value);

              if (isNaN(num)) {
                return "Invalid number";
              }

              // equals to 15 minutes
              if (num < 0.25) {
                return "Min amount allowed is 0.25";
              }

              // equals to 1 year
              if (num > 8760) {
                return "Max amount allowed is 8760";
              }

              return true;
            },
            required: "Required",
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              fullWidth
              label={"Amount (hours)"}
              sx={{
                height: 30,
                marginBottom: !!error?.message ? 0.5 : undefined,
                "& .MuiFormLabel-root": {
                  top: -4,
                },
                "& .MuiInputBase-root": {
                  height: 30,
                },
                "& input": {
                  height: "20px!important",
                  fontSize: "13px!important",
                },
              }}
              {...field}
              disabled={!enabled}
              error={!!error?.message}
              helperText={error?.message}
            />
          )}
        />
      </Stack>
      <Typography fontSize={10} color={theme.customColors.dark75}>
        When enabled the vault and websites will keep their sessions open for
        the hours you specify.
      </Typography>
      <Collapse in={showButtons}>
        <Stack
          direction={"row"}
          spacing={2}
          width={1}
          paddingX={4}
          boxSizing={"border-box"}
          marginTop={"10px!important"}
          marginBottom={"5px!important"}
        >
          <Button
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark25,
              height: 24,
              borderWidth: 1.5,
              fontSize: 12,
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 24,
              fontSize: 12,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Collapse>
    </Stack>
  );
};

export default SessionsMaxAge;
