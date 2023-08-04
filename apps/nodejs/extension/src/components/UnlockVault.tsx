import type { RootState } from "../redux/store";
import type { RequestsType } from "../redux/slices/app";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import { FormProvider, useForm } from "react-hook-form";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import RequestFrom from "./common/RequestFrom";
import AppToBackground from "../controllers/communication/AppToBackground";
import CircularLoading from "./common/CircularLoading";
import OperationFailed from "./common/OperationFailed";
import Password from "./common/Password";

interface UnlockVaultProps {
  currentRequest?: RequestsType;
}

const UnlockVault: React.FC<UnlockVaultProps> = ({ currentRequest }) => {
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const methods = useForm({
    defaultValues: {
      password: "",
    },
  });
  const { handleSubmit, watch } = methods;
  const [password] = watch(["password"]);
  const [rememberPass, setRememberPass] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);

  useEffect(() => {
    setIsRequesting(window.location.search.includes("view=request"));
  }, []);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [password]);

  const onChangeRemember = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRememberPass(event.target.checked);
    },
    []
  );

  const onSubmit = useCallback(
    (data) => {
      setStatus("loading");
      AppToBackground.unlockVault(data.password, rememberPass).then(
        (response) => {
          if (response.error) {
            setStatus("error");
          } else {
            setStatus("normal");
            if (response?.data?.isPasswordWrong) {
              setWrongPassword(true);
            }
          }
        }
      );
    },
    [rememberPass]
  );

  const requestComponent = useMemo(() => {
    if (!isRequesting || !currentRequest) {
      return null;
    }

    let description: string;

    switch (currentRequest.type) {
      case "CONNECTION_REQUEST":
        description = "Is trying to connect with your vault.";
        break;
      case "NEW_ACCOUNT_REQUEST":
        description = "Is trying to create a new account.";
        break;
      case "TRANSFER_REQUEST":
        description = "Is trying to request a new transfer.";
        break;
    }

    return (
      <RequestFrom
        description={description || ""}
        origin={currentRequest.origin}
        faviconUrl={currentRequest.faviconUrl}
        containerProps={{
          alignItems: "center",
          marginTop: "25px",
        }}
        containerMetaProps={{
          sx: {
            width: "auto",
            minWidth: "250px",
            border: `1px solid lightgray`,
            paddingY: "7px",
            borderRadius: "20px",
          },
        }}
      />
    );
  }, [isRequesting, currentRequest]);

  if (status === "loading") {
    return <CircularLoading />;
  }

  if (status === "error") {
    return (
      <OperationFailed text={"There was an error trying unlock the vault."} />
    );
  }

  return (
    <Stack flexGrow={1} component={"form"} onSubmit={handleSubmit(onSubmit)}>
      <Typography variant={"h5"}>Unlock Vault</Typography>
      <Typography fontSize={14} marginY={"10px"}>
        Make sure no one is looking when you type your password.
      </Typography>
      {requestComponent}
      <FormProvider {...methods}>
        <Password
          passwordName={"password"}
          canGenerateRandom={false}
          hidePasswordStrong={true}
          labelPassword={"Password"}
          justRequire={true}
          containerProps={{
            spacing: "10px",
          }}
          errorPassword={wrongPassword ? "Wrong password" : undefined}
        />
      </FormProvider>
      <FormControlLabel
        sx={{
          userSelect: "none",
          alignSelf: "flex-start",
          mt: "10px!important",
          ml: "10px!important",
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
          height: 45,
          fontSize: 16,
          borderRadius: "100px",
        }}
        variant={"contained"}
        type={"submit"}
      >
        Unlock Vault
      </Button>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  const requests = state.app.externalRequests;
  const currentRequest = requests.length ? requests[0] : null;

  return {
    currentRequest,
  };
};

export default connect(mapStateToProps)(UnlockVault);
