import type { RootState } from "../redux/store";
import type { RequestsType } from "../redux/slices/app";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import { useTheme } from "@mui/material";
import AppToBackground from "../controllers/communication/AppToBackground";
import CircularLoading from "./common/CircularLoading";
import OperationFailed from "./common/OperationFailed";
import Password from "./common/Password";
import SootheLogoHeader from "./common/SootheLogoHeader";
import RememberPasswordCheckbox from "./common/RememberPassword";
import { OperationRejected } from "../errors/communication";
import { removeRequestWithRes } from "../utils/ui";
import { useAppDispatch } from "../hooks/redux";
import Requester from "./common/Requester";

interface UnlockVaultProps {
  currentRequest?: RequestsType;
  lockedForWrongPasswords: boolean;
  externalRequestsLength: number;
}

const UnlockVault: React.FC<UnlockVaultProps> = ({
  currentRequest,
  lockedForWrongPasswords,
  externalRequestsLength,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
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

  const onClickReject = useCallback(() => {
    if (currentRequest) {
      removeRequestWithRes(
        currentRequest,
        OperationRejected,
        dispatch,
        externalRequestsLength,
        true
      ).catch();
    }
  }, [currentRequest, externalRequestsLength, dispatch]);

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
      <>
        <Requester request={currentRequest} text={description} />
        <Typography
          marginTop={3.5}
          marginBottom={1.5}
          fontSize={14}
          letterSpacing={"0.5px"}
          fontWeight={500}
        >
          To continue, introduce the vault’s password:
        </Typography>
      </>
    );
  }, [isRequesting, currentRequest]);

  const buttonsComponent = useMemo(() => {
    if (currentRequest && isRequesting) {
      return (
        <Stack direction={"row"} spacing={2} alignItems={"center"} paddingX={2}>
          <Button
            onClick={onClickReject}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            variant={"outlined"}
            fullWidth
          >
            Reject
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
          >
            Unlock Vault
          </Button>
        </Stack>
      );
    }

    return (
      <Button
        sx={{
          marginX: "30px!important",
          marginTop: "30px!important",
          textTransform: "none",
          fontWeight: 700,
          width: 340,
          height: 50,
          fontSize: 20,
          borderRadius: "25px",
          backgroundColor: theme.customColors.primary500,
          marginBottom: 1,
          boxShadow: "none",
        }}
        variant={"contained"}
        type={"submit"}
      >
        Unlock Vault
      </Button>
    );
  }, [currentRequest, theme, isRequesting, onClickReject]);

  if (status === "loading") {
    return <CircularLoading />;
  }

  if (status === "error") {
    return (
      <OperationFailed text={"There was an error trying unlock the vault."} />
    );
  }

  return (
    <Stack
      flexGrow={1}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
      justifyContent={"space-between"}
    >
      <Stack>
        <SootheLogoHeader />
        <Stack flexGrow={1} paddingX={2}>
          <Typography
            fontSize={18}
            marginTop={isRequesting ? 2.5 : 3}
            fontWeight={700}
            lineHeight={"40px"}
            textAlign={"center"}
            sx={{ userSelect: "none" }}
            color={theme.customColors.primary999}
          >
            {lockedForWrongPasswords
              ? "Vault Locked"
              : "Unlock Vault to Continue"}
          </Typography>
          <Typography
            height={50}
            paddingX={6}
            fontSize={14}
            marginBottom={isRequesting ? 3 : 6}
            textAlign={"center"}
            lineHeight={"20px"}
            fontWeight={lockedForWrongPasswords ? 700 : 400}
            color={
              lockedForWrongPasswords
                ? theme.customColors.red100
                : theme.customColors.dark100
            }
          >
            {lockedForWrongPasswords
              ? "The vault was locked due to many wrong password."
              : "Make sure no one is looking when you type your password."}
          </Typography>
          {requestComponent}
          <FormProvider {...methods}>
            <Password
              autofocusPassword={true}
              passwordName={"password"}
              canGenerateRandom={false}
              hidePasswordStrong={true}
              labelPassword={"Vault Password"}
              justRequire={true}
              containerProps={{
                spacing: 1.7,
              }}
              errorPassword={wrongPassword ? "Wrong password" : undefined}
            />
          </FormProvider>
          <RememberPasswordCheckbox
            checked={rememberPass}
            onChange={onChangeRemember}
            containerProps={{
              marginLeft: 0,
            }}
          />
        </Stack>
      </Stack>
      <Stack>{buttonsComponent}</Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  const requests = state.app.externalRequests;
  const currentRequest = requests.length ? requests[0] : null;
  const lockedForWrongPasswords =
    state.vault.isUnlockedStatus === "locked_due_wrong_password";

  return {
    currentRequest,
    lockedForWrongPasswords,
    externalRequestsLength: requests.length,
  };
};

export default connect(mapStateToProps)(UnlockVault);
