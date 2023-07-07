import React, { useCallback, useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useAppDispatch } from "../hooks/redux";
import { unlockVault } from "../redux/slices/vault";

const UnlockVault: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);

  const dispatch = useAppDispatch();

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prevState) => !prevState);
  }, []);

  const onChangePasswordText = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value);
      if (wrongPassword) {
        setWrongPassword(false);
      }
    },
    [wrongPassword]
  );

  const onClickUnlock = useCallback(() => {
    if (password) {
      dispatch(unlockVault(password)).then((response) => {
        if (response && "error" in response) {
          setWrongPassword(true);
        }
      });
    }
  }, [password, dispatch]);

  return (
    <Stack flexGrow={1}>
      <Typography variant={"h5"}>Unlock Vault</Typography>
      <Typography fontSize={14} marginY={"10px"}>
        Make sure no one is looking when you type your password.
      </Typography>
      <Button
        onClick={toggleShowPassword}
        sx={{
          fontSize: "12px",
          textTransform: "none",
          width: 50,
          minWidth: 50,
          alignSelf: "flex-end",
          marginTop: "50px",
        }}
      >
        {showPassword ? "Hide" : "Show"}
      </Button>
      <TextField
        autoFocus
        label={"Password"}
        size={"small"}
        value={password}
        onChange={onChangePasswordText}
        type={showPassword ? "text" : "password"}
        error={wrongPassword}
        helperText={wrongPassword ? "Wrong password" : undefined}
      />
      <Button
        sx={{
          marginX: "20px!important",
          marginTop: "30px!important",
          textTransform: "none",
          fontWeight: 600,
          height: 45,
          fontSize: 16,
          borderRadius: "100px",
        }}
        variant={"contained"}
        disabled={!password}
        onClick={onClickUnlock}
      >
        Unlock Vault
      </Button>
    </Stack>
  );
};

export default UnlockVault;
