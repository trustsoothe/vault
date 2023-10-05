import { FormProvider, useForm } from "react-hook-form";
import React, { useCallback, useMemo, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AppToBackground from "../controllers/communication/AppToBackground";
import CircularLoading from "./common/CircularLoading";
import OperationFailed from "./common/OperationFailed";
import Password from "./common/Password";

interface FormValues {
  password: string;
  confirmPassword: string;
}

const InitializeVault: React.FC = () => {
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [rememberPass, setRememberPass] = useState(false);
  const methods = useForm<FormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const { handleSubmit } = methods;

  const onSubmit = useCallback(
    (data: FormValues) => {
      setStatus("loading");
      AppToBackground.initializeVault(data.password, rememberPass).then(
        (result) => setStatus(result.error ? "error" : "normal")
      );
    },
    [rememberPass]
  );

  const onChangeRemember = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRememberPass(event.target.checked);
    },
    []
  );

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error trying to initialize the vault."}
        />
      );
    }

    return (
      <>
        <Stack spacing={"10px"}>
          <Typography variant={"h5"}>{"Let's get started"}</Typography>
          <Typography fontSize={"14px"}>
            To begin you need to initialize your vault by setting your password.
            Keep in mind that the password cannot be recovered.
          </Typography>
          <Typography fontSize={"12px"}>
            This password will be used to unlock your vault.
          </Typography>
        </Stack>
        <FormProvider {...methods}>
          <Password
            autofocusPassword={true}
            passwordName={"password"}
            confirmPasswordName={"confirmPassword"}
            containerProps={{
              marginTop: "40px",
              width: 300,
              spacing: "15px",
            }}
          />
        </FormProvider>
        <FormControlLabel
          sx={{
            userSelect: "none",
            alignSelf: "flex-start",
            ml: "35px!important",
            "& .MuiButtonBase-root": {
              padding: 0,
            },
            "& svg": {
              fontSize: "18px!important",
            },
            "& .MuiTypography-root": {
              marginLeft: "5px",
              fontSize: "12px!important",
            },
          }}
          control={
            <Checkbox onChange={onChangeRemember} checked={rememberPass} />
          }
          label={"Remember password for session"}
        />
        <Button
          sx={{
            marginX: "20px!important",
            marginTop: "30px!important",
            textTransform: "none",
            fontWeight: 600,
            width: 300,
            height: 45,
            fontSize: 16,
            borderRadius: "100px",
          }}
          variant={"contained"}
          type={"submit"}
        >
          Initialize Vault
        </Button>
      </>
    );
  }, [status, onChangeRemember, rememberPass]);

  return (
    <Stack
      spacing={"10px"}
      alignItems={"center"}
      component={"form"}
      flexGrow={1}
      onSubmit={handleSubmit(onSubmit)}
    >
      {content}
    </Stack>
  );
};

export default InitializeVault;
