import { FormProvider, useForm } from "react-hook-form";
import React, { useCallback, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import AppToBackground from "../controllers/communication/AppToBackground";
import RememberPasswordCheckbox from "./common/RememberPassword";
import SootheLogoHeader from "./common/SootheLogoHeader";
import CircularLoading from "./common/CircularLoading";
import OperationFailed from "./common/OperationFailed";
import Password from "./common/Password";

interface FormValues {
  password: string;
  confirmPassword: string;
}

const InitializeVault: React.FC = () => {
  const theme = useTheme();
  const [status, setStatus] = useState<
    "normal" | "sec_and_priv" | "loading" | "error" | "sec_and_priv_to_submit"
  >("normal");
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
      } else {
        setStatus("sec_and_priv_to_submit");
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

  const securityAndPrivacyComponent = useMemo(() => {
    return (
      <Fade
        in={status === "sec_and_priv" || status === "sec_and_priv_to_submit"}
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
            Security & Privacy
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
          >
            <Typography fontSize={14} fontWeight={500}>
              About this policy
            </Typography>
            <Typography fontSize={13}>
              Lorem ipsum dolor sit amet consectetur. Amet amet ipsum a et. In
              faucibus at amet id ultrices in amet elit ut. Est vitae velit et
              vulputate elementum gravida. Morbi mauris nibh pharetra viverra
              amet. Volutpat nunc habitant at commodo non. Lobortis convallis
              vitae pellentesque sollicitudin. Magna diam odio auctor mauris
              nulla in. Sociis augue tincidunt urna lectus vulputate sem.
              Interdum morbi sed ullamcorper ultricies in consequat nec. Varius
              volutpat nisi integer netus nisl at. Diam morbi et viverra
              venenatis velit dignissim at. Morbi sed turpis consectetur eros
              volutpat eu enim sit.
            </Typography>
            <br />
            <br />
            <Typography fontSize={14} fontWeight={500}>
              Keeping your information secure
            </Typography>
            <Typography fontSize={13}>
              Cursus elementum facilisis accumsan ridiculus sit amet imperdiet.
              Nunc malesuada nisl ipsum risus ut. Condimentum tellus dignissim
              vestibulum erat dictumst velit pretium. Donec augue volutpat
              congue feugiat Varius volutpat nisi integer netus nisl at. Diam
              morbi et viverra venenatis velit dignissim at. Morbi sed turpis
              consectetur.
            </Typography>
          </Stack>
          <Stack
            height={75}
            padding={2}
            alignItems={"flex-end"}
            boxSizing={"border-box"}
          >
            <Button
              variant={"contained"}
              sx={{
                height: 35,
                backgroundColor: theme.customColors.primary500,
                fontSize: 16,
                fontWeight: 700,
                width: 170,
                marginTop: 0.3,
              }}
              onClick={closeSecurityAndPrivacy}
              {...(status === "sec_and_priv_to_submit" && {
                type: "submit",
                onClick: undefined,
              })}
            >
              {status === "sec_and_priv_to_submit" ? "Accept" : "Close"}
            </Button>
          </Stack>
        </Stack>
      </Fade>
    );
  }, [theme, closeSecurityAndPrivacy, status]);

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
          >
            Initialize Vault
          </Button>
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
  ]);

  return (
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
          display:
            status === "normal" ||
            status === "sec_and_priv" ||
            status === "sec_and_priv_to_submit"
              ? "flex"
              : "none",
        }}
      />
      {securityAndPrivacyComponent}
      {content}
    </Stack>
  );
};

export default InitializeVault;
