import React, { useCallback, useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { setRequirePasswordSensitiveOpts } from "../../redux/slices/app";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";

const PasswordForSensitiveOpts: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const requirePasswordForSensitiveOpts = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );

  const [loading, setLoading] = useState(false);

  const onChangeValue = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;

      dispatch(setRequirePasswordSensitiveOpts(newValue)).finally(() =>
        setLoading(false)
      );
    },
    [dispatch]
  );

  return (
    <Stack>
      <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
        <Typography fontSize={12}>
          Ask for password on sensitive operations:{" "}
        </Typography>
        <Switch
          size={"small"}
          checked={requirePasswordForSensitiveOpts}
          onChange={onChangeValue}
          disabled={loading}
        />
      </Stack>
      <Typography fontSize={10} color={theme.customColors.dark75}>
        When this is enabled you will be required to insert the vault password
        for the following operations: transactions, reveal private key and
        remove account.
      </Typography>
    </Stack>
  );
};

export default PasswordForSensitiveOpts;
