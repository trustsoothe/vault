import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { removeRequestWithRes, secsToText } from "../../utils/ui";
import { OperationRejected } from "../../errors/communication";
import PasswordInput from "../components/PasswordInput";
import { RequestOrigin } from "../Request/RequestInfo";
import { HeaderContainer } from "../Header/Header";
import { HEIGHT, WIDTH } from "../../constants/ui";
import Logo from "../assets/logo/isologo.svg";
import {
  currentExternalRequest,
  dateUntilVaultIsLockedSelector,
  externalRequestsLengthSelector,
  vaultLockedForWrongPasswordsSelector,
} from "../../redux/selectors/session";
import { themeColors } from "../theme";

interface UnlockVaultForm {
  password: string;
}

export default function UnlockVault() {
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const methods = useForm<UnlockVaultForm>({
    defaultValues: {
      password: "",
    },
  });
  const dispatch = useAppDispatch();
  const currentRequest = useAppSelector(currentExternalRequest);
  const externalRequestsLength = useAppSelector(externalRequestsLengthSelector);
  const dateUntilVaultIsLocked = useAppSelector(dateUntilVaultIsLockedSelector);
  const lockedForWrongPasswords = useAppSelector(
    vaultLockedForWrongPasswordsSelector
  );
  const { handleSubmit, control, watch } = methods;
  const [password] = watch(["password"]);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [secsToExpire, setSecsToExpire] = useState(0);
  const isRequesting =
    window.location.search.includes("view=request") && currentRequest;

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [password]);

  useEffect(() => {
    let interval;

    const handler = () => {
      if (dateUntilVaultIsLocked && dateUntilVaultIsLocked > Date.now()) {
        setSecsToExpire((dateUntilVaultIsLocked - Date.now()) / 1000);
      } else {
        setSecsToExpire(0);
      }
    };

    handler();
    if (dateUntilVaultIsLocked) {
      interval = setInterval(handler, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dateUntilVaultIsLocked]);

  const onSubmit = (data: UnlockVaultForm) => {
    setStatus("loading");
    AppToBackground.unlockVault(data.password).then((response) => {
      if (response.error) {
        setStatus("error");
      } else {
        setStatus("normal");
        if (response?.data?.isPasswordWrong) {
          setWrongPassword(true);
        }
      }
    });
  };

  const rejectRequest = () => {
    if (currentRequest) {
      removeRequestWithRes(
        currentRequest,
        OperationRejected,
        dispatch,
        externalRequestsLength,
        true
      ).catch();
    }
  };

  let content: React.ReactElement;

  switch (status) {
    case "normal": {
      let requestDescription: string;

      if (isRequesting) {
        switch (currentRequest.type) {
          case "CONNECTION_REQUEST":
            requestDescription = "is trying to connect with your vault";
            break;
          case "TRANSFER_REQUEST":
            requestDescription = "is trying to request a new transfer";
            break;
          case "SWITCH_CHAIN_REQUEST":
            requestDescription = "is trying to change the network";
            break;

          case "SIGN_TYPED_DATA_REQUEST":
          case "PERSONAL_SIGN_REQUEST":
            requestDescription = "is trying to sign data with your account";
            break;
        }
      }

      let description: string;

      if (isRequesting) {
        if (!!secsToExpire) {
          description = `A website ${requestDescription} but your vault was locked after many failed password attempts.`;
        } else {
          description = `A website ${requestDescription}, enter your password if you want to continue.`;
        }
      } else if (!!secsToExpire || lockedForWrongPasswords) {
        description =
          "Your vault was locked after many failed password attempts.";
      } else {
        description =
          "Enter your vault’s password to access you accounts. Make sure no one’s looking when you type your password.";
      }

      content = (
        <>
          <Logo />
          <Typography variant={"h3"} textAlign={"center"} marginTop={2.7}>
            {lockedForWrongPasswords || !!secsToExpire
              ? "Vault Locked"
              : "Unlock Your Vault"}
          </Typography>
          <Typography
            paddingX={1}
            marginTop={1.4}
            textAlign={"center"}
            width={
              lockedForWrongPasswords || (!!secsToExpire && !isRequesting)
                ? 300
                : undefined
            }
          >
            {description}
          </Typography>
          {secsToExpire > 0 && (
            <Stack
              spacing={0.5}
              marginTop={2.6}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Typography
                fontSize={30}
                lineHeight={"38px"}
                color={themeColors.black}
              >
                {secsToText(secsToExpire)}
              </Typography>
              <Typography fontSize={11} lineHeight={"14px"}>
                Time Remaining
              </Typography>
            </Stack>
          )}
          <Controller
            control={control}
            name={"password"}
            render={({ field, fieldState: { error } }) => (
              <PasswordInput
                required
                autoFocus
                {...field}
                disabled={!!secsToExpire}
                InputProps={{
                  readOnly: !!secsToExpire,
                }}
                placeholder={"Vault Password"}
                error={!!error || wrongPassword}
                helperText={wrongPassword ? "Wrong password" : error?.message}
                sx={{
                  marginTop: 3.5,
                }}
              />
            )}
          />
          <Stack
            direction={"row"}
            alignItems={"center"}
            marginTop={4}
            spacing={1.2}
            width={1}
            sx={{
              button: {
                borderRadius: "8px",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            {isRequesting && (
              <Button
                fullWidth
                sx={{
                  color: themeColors.textSecondary,
                  backgroundColor: themeColors.white,
                }}
                onClick={rejectRequest}
              >
                Reject
              </Button>
            )}
            <Button
              variant={"contained"}
              fullWidth
              type={"submit"}
              disabled={!password || !!secsToExpire}
            >
              {isRequesting ? "Continue" : "Unlock Vault"}
            </Button>
          </Stack>
        </>
      );
      break;
    }

    case "loading":
      content = <p>Loading...</p>;
      break;
    case "error":
      content = (
        <>
          <p>Error!</p>
          <button type={"submit"}>retry</button>
        </>
      );
      break;
  }

  return (
    <Stack width={WIDTH} height={HEIGHT}>
      {isRequesting && (
        <HeaderContainer>
          <RequestOrigin origin={currentRequest.origin} />
        </HeaderContainer>
      )}
      <Box
        flexGrow={1}
        paddingX={2.4}
        paddingTop={4.8}
        display={"flex"}
        alignItems={"center"}
        flexDirection={"column"}
        sx={{
          "& .strength-bar": {
            marginTop: 1.3,
          },
          boxShadow: "0 1px 0 0 #eff1f4",
        }}
        component={"form"}
        onSubmit={handleSubmit(onSubmit)}
      >
        {content}
      </Box>
    </Stack>
  );
}
