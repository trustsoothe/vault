import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import { FormProvider, useForm } from "react-hook-form";
import React, { useEffect, useRef, useState } from "react";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { enqueueErrorSnackbar } from "../../utils/ui";
import ImportVaultModal from "./ImportVaultModal";
import Logo from "../assets/logo/isologo.svg";
import InitializeVaultForm from "./Form";

export interface InitializeVaultFormValues {
  password: string;
  confirmPassword: string;
  keepSessionActive: boolean;
}

export default function InitializeVault() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const [showImportModal, setShowImportModal] = useState(false);
  const [status, setStatus] = useState<"normal" | "loading">("normal");

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => closeSnackbars, []);

  const methods = useForm<InitializeVaultFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
      keepSessionActive: true,
    },
  });
  const { handleSubmit } = methods;

  const toggleShowImportModal = () =>
    setShowImportModal((prevState) => !prevState);

  const onSubmit = (data: InitializeVaultFormValues) => {
    if (status !== "loading") {
      setStatus("loading");
      AppToBackground.initializeVault({
        password: data.password,
        sessionsMaxAge: {
          enabled: !data.keepSessionActive,
          maxAge: 3600,
        },
        requirePasswordForSensitiveOpts: false,
      }).then((result) => {
        if (result.error) {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            onRetry: () => onSubmit(data),
            message: "Initialization of Vault Failed",
          });
        } else {
          closeSnackbars();
        }
        setStatus("normal");
      });
    }
  };

  const isLoading = status === "loading";

  return (
    <>
      <ImportVaultModal
        open={showImportModal}
        onClose={toggleShowImportModal}
      />
      <Box
        height={1}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-between"}
      >
        <Box
          flexGrow={1}
          paddingX={2.4}
          paddingTop={4.8}
          display={"flex"}
          alignItems={"center"}
          flexDirection={"column"}
          sx={{
            boxShadow: "0 1px 0 0 #eff1f4",
          }}
          component={"form"}
          onSubmit={handleSubmit(onSubmit)}
        >
          <Logo />
          <Typography variant={"h3"} textAlign={"center"} marginTop={2.7}>
            Let's Get Started
          </Typography>
          <Typography marginTop={1.4} textAlign={"center"} paddingX={1}>
            To begin, you need to initialize your vault by setting your
            password. Keep in mind that this password cannot be recovered.
          </Typography>
          <FormProvider {...methods}>
            <InitializeVaultForm isLoading={isLoading} />
          </FormProvider>
        </Box>
        <Box
          height={40}
          paddingX={2.4}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          borderTop={"1px solid #eff1f4"}
          bgcolor={"#fff"}
        >
          <Typography>Have a Vault Backup?</Typography>
          <Button onClick={toggleShowImportModal} disabled={isLoading}>
            Import
          </Button>
        </Box>
      </Box>
    </>
  );
}
