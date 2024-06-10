import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import PasswordInput from "../components/PasswordInput";

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
  const { handleSubmit, control, watch } = methods;
  const [password] = watch(["password"]);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [secsToExpire, setSecsToExpire] = useState(0);
  const isRequesting = window.location.search.includes("view=request");

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [password]);

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

  // const onClickReject = () => {
  //   if (currentRequest) {
  //     removeRequestWithRes(
  //       currentRequest,
  //       OperationRejected,
  //       dispatch,
  //       externalRequestsLength,
  //       true
  //     ).catch();
  //   }
  // };

  let content: React.ReactElement;

  switch (status) {
    case "normal":
      content = (
        <>
          <Box height={46} width={46} border={"1px solid black"}>
            logo
          </Box>
          <Typography variant={"h3"} textAlign={"center"} marginTop={2.7}>
            Unlock Your Vault{" "}
          </Typography>
          <Typography
            marginTop={1.4}
            marginBottom={3.5}
            textAlign={"center"}
            paddingX={1}
          >
            Enter your vault’s password to access you accounts. Make sure no
            one’s looking when you type your password.{" "}
          </Typography>
          <Controller
            control={control}
            name={"password"}
            render={({ field, fieldState: { error } }) => (
              <PasswordInput
                required
                autoFocus
                {...field}
                placeholder={"Vault Password"}
                error={!!error || wrongPassword}
                helperText={wrongPassword ? "Wrong password" : error?.message}
              />
            )}
          />
          <Button
            variant={"contained"}
            fullWidth
            sx={{ marginTop: 4 }}
            type={"submit"}
            disabled={!password}
          >
            Unlock Vault
          </Button>
        </>
      );
      break;
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
  );
}
