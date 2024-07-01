import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import browser from "webextension-polyfill";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import { FormProvider, useForm } from "react-hook-form";
import React, { useEffect, useRef, useState } from "react";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { enqueueErrorSnackbar, enqueueSnackbar } from "../../utils/ui";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import ImportVaultModal from "./ImportVaultModal";
import Logo from "../assets/logo/isologo.svg";
import useIsPopup from "../hooks/useIsPopup";
import InitializeVaultForm from "./Form";

export interface InitializeVaultFormValues {
  password: string;
  confirmPassword: string;
  keepSessionActive: boolean;
}

export default function InitializeVault() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const isPopup = useIsPopup();
  const [showImportModal, setShowImportModal] = useState(false);
  const [status, setStatus] = useState<"normal" | "loading">("normal");

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    const openImportVault = location.hash === "#/?openImportVault=true";

    if (openImportVault) {
      location.hash = "#/";

      setShowImportModal(true);

      enqueueSnackbar({
        variant: "info",
        message:
          "This page was open because you cannot import files in the popup.",
      });
    }

    return closeSnackbars;
  }, []);

  const methods = useForm<InitializeVaultFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
      keepSessionActive: true,
    },
  });
  const { handleSubmit } = methods;

  const openImportModal = () => {
    if (isPopup) {
      browser.tabs.create({
        active: true,
        url: `home.html#${ACCOUNTS_PAGE}?openImportVault=true`,
      });
    } else {
      setShowImportModal(true);
    }
  };

  const closeImportModal = () => setShowImportModal(false);

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
      <ImportVaultModal open={showImportModal} onClose={closeImportModal} />
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
          <Button onClick={openImportModal} disabled={isLoading}>
            Import
          </Button>
        </Box>
      </Box>
    </>
  );
}
