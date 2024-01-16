import { FormProvider, useForm } from "react-hook-form";
import React, { useCallback, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import Button, { ButtonProps } from "@mui/material/Button";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import AppToBackground from "../controllers/communication/AppToBackground";
import RememberPasswordCheckbox from "./common/RememberPassword";
import SootheLogoHeader from "./common/SootheLogoHeader";
import CircularLoading from "./common/CircularLoading";
import OperationFailed from "./common/OperationFailed";
import ImportModal from "./Vault/ImportModal";
import Password from "./common/Password";

interface InfoViewProps {
  onBack: () => void;
  show: boolean;
  children: React.ReactNode;
  title: string;
  submitButtonText: string;
  submitButtonProps?: ButtonProps;
}

const InfoView: React.FC<InfoViewProps> = ({
  onBack,
  show,
  children,
  title,
  submitButtonText,
  submitButtonProps,
}) => {
  const theme = useTheme();
  const [hasReachBottom, setHasReachBottom] = useState(false);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const isInBottom =
      event.currentTarget.clientHeight + event.currentTarget.scrollTop + 1 >=
      event.currentTarget.scrollHeight;

    if (isInBottom) {
      setHasReachBottom(true);
    }
  }, []);

  return (
    <Fade
      in={show}
      style={{
        position: "absolute",
        top: 101,
        left: 0,
        zIndex: 100,
        backgroundColor: theme.customColors.white,
      }}
    >
      <Stack flexGrow={1} width={1}>
        <Typography
          marginTop={2}
          marginLeft={2}
          fontSize={18}
          fontWeight={700}
          lineHeight={"30px"}
          color={theme.customColors.primary999}
          sx={{
            userSelect: "none",
          }}
        >
          {title}
        </Typography>
        <Stack
          flexGrow={1}
          height={350}
          marginTop={1}
          paddingLeft={2}
          paddingRight={1}
          width={353}
          overflow={"auto"}
          sx={{
            "*": { color: theme.customColors.dark100, lineHeight: "19px" },
          }}
          onScroll={onScroll}
        >
          {children}
        </Stack>
        <Stack
          height={75}
          padding={2}
          spacing={1.5}
          direction={"row"}
          alignItems={"center"}
          boxSizing={"border-box"}
        >
          <Button
            variant={"outlined"}
            fullWidth
            sx={{
              height: 35,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              fontSize: 16,
              fontWeight: 700,
              marginTop: 0.3,
            }}
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            variant={"contained"}
            fullWidth
            disabled={!hasReachBottom}
            type={"submit"}
            {...submitButtonProps}
            sx={{
              height: 35,
              backgroundColor: theme.customColors.primary500,
              fontSize: 16,
              fontWeight: 700,
              marginTop: 0.3,
              ...submitButtonProps?.sx,
            }}
          >
            {submitButtonText}
          </Button>
        </Stack>
      </Stack>
    </Fade>
  );
};

type SavePasswordViewProps = Omit<
  InfoViewProps,
  "children" | "title" | "submitButtonText"
>;

const SecurityAndPrivacyView: React.FC<SavePasswordViewProps> = (infoProps) => {
  return (
    <InfoView
      {...infoProps}
      title={"Security & Privacy"}
      submitButtonText={"Accept"}
    >
      <Typography fontSize={14} fontWeight={500}>
        About this policy
      </Typography>
      <Typography fontSize={13}>
        Lorem ipsum dolor sit amet consectetur. Amet amet ipsum a et. In
        faucibus at amet id ultrices in amet elit ut. Est vitae velit et
        vulputate elementum gravida. Morbi mauris nibh pharetra viverra amet.
        Volutpat nunc habitant at commodo non. Lobortis convallis vitae
        pellentesque sollicitudin. Magna diam odio auctor mauris nulla in.
        Sociis augue tincidunt urna lectus vulputate sem. Interdum morbi sed
        ullamcorper ultricies in consequat nec. Varius volutpat nisi integer
        netus nisl at. Diam morbi et viverra venenatis velit dignissim at. Morbi
        sed turpis consectetur eros volutpat eu enim sit.
      </Typography>
      <br />
      <br />
      <Typography fontSize={14} fontWeight={500}>
        Keeping your information secure
      </Typography>
      <Typography fontSize={13}>
        Cursus elementum facilisis accumsan ridiculus sit amet imperdiet. Nunc
        malesuada nisl ipsum risus ut. Condimentum tellus dignissim vestibulum
        erat dictumst velit pretium. Donec augue volutpat congue feugiat Varius
        volutpat nisi integer netus nisl at. Diam morbi et viverra venenatis
        velit dignissim at. Morbi sed turpis consectetur.
      </Typography>
    </InfoView>
  );
};

const SavePasswordView: React.FC<SavePasswordViewProps> = (infoProps) => {
  return (
    <InfoView
      {...infoProps}
      title={"SAVE YOUR PASSWORDS!"}
      submitButtonText={"Next"}
    >
      <Typography fontSize={13}>
        Your vault and every account have a password. If you do not save or
        remember it, we are unable to restore your vault or account.
        <br />
        <br />
        Make sure you saved or remember the vault password you just introduce,
        because it is the entry point to access your accounts and if you are not
        able to introduce the correct vault password you would lose all your
        accounts.
      </Typography>
      <br />
      <br />
      <Typography fontSize={14} fontWeight={500}>
        Save the private key of your accounts
      </Typography>
      <Typography fontSize={13}>
        We encourage you to save your accounts passwords, its private keys and
        portable wallets (PPK file). With that, you wont lose your accounts
        (wallets) if you forget the vault and/or account password.
      </Typography>
      <br />
      <br />
      <Typography fontSize={14} fontWeight={500}>
        Your vault is saved only in your PC
      </Typography>
      <Typography fontSize={13}>
        If you can't access your PC, you won't be able to access your vault. For
        that reason, we encourage you again to save the accounts private keys
        and portable wallet (PPK file).
      </Typography>
    </InfoView>
  );
};

interface FormValues {
  password: string;
  confirmPassword: string;
}

const InitializeVault: React.FC = () => {
  const theme = useTheme();
  const [status, setStatus] = useState<
    | "normal"
    | "sec_and_priv"
    | "loading"
    | "error"
    | "sec_and_priv_to_submit"
    | "passwords_warning"
  >("normal");
  const [showImportModal, setShowImportModal] = useState(false);
  const [rememberPass, setRememberPass] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const { handleSubmit } = methods;

  const onShowSecurityAndPrivacy = useCallback(() => {
    setStatus("sec_and_priv");
  }, []);

  const closeSecurityAndPrivacy = useCallback(() => {
    setStatus("normal");
  }, []);

  const onSubmit = useCallback(
    (data: FormValues) => {
      if (status === "sec_and_priv_to_submit") {
        setStatus("loading");
        AppToBackground.initializeVault(data.password, rememberPass).then(
          (result) => setStatus(result.error ? "error" : "normal")
        );
      } else if (status === "normal") {
        setStatus("passwords_warning");
      } else if (status === "passwords_warning") {
        setStatus("sec_and_priv_to_submit");
      } else if (status === "sec_and_priv") {
        setStatus("normal");
      }
    },
    [rememberPass, status]
  );

  const onChangeRemember = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRememberPass(event.target.checked);
    },
    []
  );

  const onBack = useCallback(() => {
    setStatus((prevState) => {
      if (prevState === "sec_and_priv_to_submit") {
        return "passwords_warning";
      } else {
        return "normal";
      }
    });
  }, []);

  const toggleShowImportDialog = useCallback(
    () => setShowImportModal((prevState) => !prevState),
    []
  );

  const formContent = useMemo(() => {
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
      <Stack
        flexGrow={1}
        width={1}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Stack flexGrow={1} width={1} alignItems={"center"}>
          <Stack
            height={150}
            width={350}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Typography
              color={theme.customColors.primary999}
              fontSize={18}
              fontWeight={700}
              lineHeight={"40px"}
            >{`Let's Get Started`}</Typography>
            <Typography
              fontSize={14}
              lineHeight={"20px"}
              color={theme.customColors.dark100}
              textAlign={"center"}
            >
              To begin you need to initialize your vault by setting your
              password. Keep in mind that the password cannot be recovered.
            </Typography>
          </Stack>
          <FormProvider {...methods}>
            <Password
              autofocusPassword={true}
              passwordName={"password"}
              confirmPasswordName={"confirmPassword"}
              containerProps={{
                width: 360,
                spacing: "5px",
              }}
            />
          </FormProvider>
          <RememberPasswordCheckbox
            checked={rememberPass}
            onChange={onChangeRemember}
            containerProps={{
              marginTop: 0.5,
            }}
          />
        </Stack>
        <Stack spacing={1.5}>
          <Button
            sx={{
              marginX: "20px!important",
              marginTop: "30px!important",
              fontWeight: 700,
              width: 340,
              height: 50,
              fontSize: 20,
              borderRadius: "25px",
              backgroundColor: theme.customColors.primary500,
            }}
            variant={"contained"}
            type={"submit"}
            disabled={status !== "normal"}
          >
            Initialize Vault
          </Button>
          <Typography
            color={theme.customColors.primary500}
            lineHeight={"20px"}
            fontSize={13}
            fontWeight={500}
            textAlign={"center"}
            onClick={toggleShowImportDialog}
            sx={{
              textDecoration: "underline",
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            Import Vault
          </Typography>
          <Typography
            color={theme.customColors.primary500}
            lineHeight={"20px"}
            fontSize={13}
            fontWeight={500}
            textAlign={"center"}
            onClick={onShowSecurityAndPrivacy}
            sx={{
              textDecoration: "underline",
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            Security & Privacy
          </Typography>
        </Stack>
      </Stack>
    );
  }, [
    status,
    onChangeRemember,
    rememberPass,
    theme,
    closeSecurityAndPrivacy,
    onShowSecurityAndPrivacy,
    toggleShowImportDialog,
  ]);

  return (
    <>
      <Stack
        spacing={"10px"}
        alignItems={"center"}
        component={"form"}
        flexGrow={1}
        onSubmit={handleSubmit(onSubmit)}
        position={"relative"}
      >
        <SootheLogoHeader
          compact={false}
          containerProps={{
            display: "flex",
          }}
        />
        <SecurityAndPrivacyView
          show={
            status === "sec_and_priv_to_submit" || status === "sec_and_priv"
          }
          submitButtonProps={{
            sx: {
              display: status === "sec_and_priv_to_submit" ? undefined : "none",
            },
          }}
          onBack={onBack}
        />
        <SavePasswordView
          show={status === "passwords_warning"}
          onBack={onBack}
        />
        {formContent}
      </Stack>
      {showImportModal && (
        <ImportModal onClose={toggleShowImportDialog} open={showImportModal} />
      )}
    </>
  );
};

export default InitializeVault;
