import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { sessionsMaxAgeSelector } from "../../../redux/selectors/preferences";
import { setSessionMaxAgeData } from "../../../redux/slices/app";
import DialogButtons from "../../components/DialogButtons";
import SelectedIcon from "../../assets/img/check_icon.svg";
import { enqueueErrorSnackbar } from "../../../utils/ui";
import BaseDialog from "../../components/BaseDialog";
import { themeColors } from "../../theme";

interface SessionMaxAge {
  enabled: boolean;
  maxAgeInSecs: number;
}

export function getLabelOfSetting(setting: SessionMaxAge) {
  let label: string;

  if (setting.enabled) {
    if (setting.maxAgeInSecs < 3600) {
      label = `${Math.ceil(setting.maxAgeInSecs / 60)} Minutes`;
    } else {
      const hours = Math.ceil(setting.maxAgeInSecs / 3600);
      label = `${hours} Hour${hours === 1 ? "" : "s"}`;
    }
  } else {
    label = "Never";
  }

  return label;
}

function optionIsSelected(option: SessionMaxAge, value: SessionMaxAge) {
  return (
    option.enabled === value.enabled &&
    (!value.enabled ||
      (value.maxAgeInSecs === option.maxAgeInSecs && value.enabled))
  );
}

interface SettingItem {
  setting: SessionMaxAge;
  isDefault?: boolean;
}

interface FormValues {
  setting: SessionMaxAge;
}

interface ChangeSettingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangeSettingModal({
  open,
  onClose,
}: ChangeSettingModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const sessionsMaxAge = useAppSelector(sessionsMaxAgeSelector);

  const { reset, handleSubmit, watch, control } = useForm<FormValues>({
    defaultValues: {
      setting: sessionsMaxAge,
    },
  });
  const selectedSetting = watch("setting");

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      reset({ setting: sessionsMaxAge });
    } else {
      const timeout = setTimeout(() => reset({ setting: sessionsMaxAge }), 150);
      closeSnackbars();
      return () => {
        closeSnackbars();
        clearTimeout(timeout);
      };
    }
  }, [open]);

  const items: Array<SettingItem> = [
    {
      setting: {
        enabled: false,
        maxAgeInSecs: 900,
      },
      isDefault: true,
    },
    {
      setting: {
        enabled: true,
        maxAgeInSecs: 15 * 60,
      },
    },
    {
      setting: {
        enabled: true,
        maxAgeInSecs: 30 * 60,
      },
    },
    {
      setting: {
        enabled: true,
        maxAgeInSecs: 60 * 60,
      },
    },
    {
      setting: {
        enabled: true,
        maxAgeInSecs: 2 * 60 * 60,
      },
    },
  ];

  const canSave = !optionIsSelected(selectedSetting, sessionsMaxAge);

  function onSubmit(data: FormValues) {
    if (canSave) {
      setIsLoading(true);
      dispatch(setSessionMaxAgeData(data.setting))
        .unwrap()
        .then(() => {
          closeSnackbars();
          setIsLoading(false);
          onClose();
        })
        .catch(() => {
          setIsLoading(false);
          errorSnackbarKey.current = enqueueErrorSnackbar({
            message: "Error while saving your Changes",
            onRetry: () => onSubmit(data),
          });
        });
    }
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      title={"Close Session After"}
      PaperProps={{ component: "form", onSubmit: handleSubmit(onSubmit) }}
    >
      <DialogContent
        sx={{
          rowGap: 1.2,
          paddingX: 0.8,
          display: "flex",
          flexDirection: "column",
          paddingY: "16px!important",
        }}
      >
        <Controller
          control={control}
          name={"setting"}
          render={({ field: { value, onChange } }) => {
            return (
              <>
                {items.map(({ setting, isDefault }, index) => {
                  const isSelected = optionIsSelected(setting, value);

                  return (
                    <Button
                      key={index}
                      sx={{
                        width: 1,
                        height: 46,
                        paddingY: 1.5,
                        paddingRight: 5,
                        fontWeight: 400,
                        paddingLeft: 1.6,
                        borderRadius: "8px",
                        position: "relative",
                        color: themeColors.black,
                        backgroundColor: isSelected
                          ? themeColors.bgLightGray
                          : themeColors.white,
                        justifyContent: "space-between",
                        "& svg": {
                          position: "absolute",
                          right: 20,
                        },
                      }}
                      disabled={isLoading}
                      onClick={() => {
                        if (!isSelected) {
                          onChange(setting);
                        }
                      }}
                    >
                      <span>{getLabelOfSetting(setting)}</span>
                      {isDefault && (
                        <Typography color={themeColors.textSecondary}>
                          (Default)
                        </Typography>
                      )}
                      {isSelected && <SelectedIcon />}
                    </Button>
                  );
                })}
              </>
            );
          }}
        />
      </DialogContent>
      <DialogActions sx={{ padding: 0, height: 85 }}>
        <DialogButtons
          primaryButtonProps={{
            children: "Save",
            disabled: !canSave,
            type: "submit",
            isLoading,
          }}
          secondaryButtonProps={{
            children: "Cancel",
            onClick: onClose,
            disabled: isLoading,
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
