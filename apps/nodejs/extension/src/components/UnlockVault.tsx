import type { RootState } from "../redux/store";
import type { RequestsType } from "../redux/slices/app";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import RequestFrom from "./common/RequestFrom";
import AppToBackground from "../controllers/communication/AppToBackground";
import CircularLoading from "./common/CircularLoading";
import OperationFailed from "./common/OperationFailed";

interface UnlockVaultProps {
  currentRequest?: RequestsType;
}

const UnlockVault: React.FC<UnlockVaultProps> = ({ currentRequest }) => {
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);

  useEffect(() => {
    setIsRequesting(window.location.search.includes("view=request"));
  }, []);

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
      setStatus("loading");
      AppToBackground.unlockVault(password).then((response) => {
        if (response.error) {
          setStatus("error");
        } else {
          setStatus("normal");
          if (response?.data?.isPasswordWrong) {
            setWrongPassword(true);
          }
        }
      });
    }
  }, [password]);

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
      <OperationFailed
        text={"There was an error trying unlock the vault."}
        onRetry={onClickUnlock}
      />
    );
  }

  return (
    <Stack flexGrow={1}>
      <Typography variant={"h5"}>Unlock Vault</Typography>
      <Typography fontSize={14} marginY={"10px"}>
        Make sure no one is looking when you type your password.
      </Typography>
      {requestComponent}
      <Button
        onClick={toggleShowPassword}
        sx={{
          fontSize: "12px",
          textTransform: "none",
          width: 50,
          minWidth: 50,
          alignSelf: "flex-end",
          marginTop: requestComponent ? "25px" : "50px",
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

const mapStateToProps = (state: RootState) => {
  const requests = state.app.externalRequests;
  const currentRequest = requests.length ? requests[0] : null;

  return {
    currentRequest,
  };
};

export default connect(mapStateToProps)(UnlockVault);
