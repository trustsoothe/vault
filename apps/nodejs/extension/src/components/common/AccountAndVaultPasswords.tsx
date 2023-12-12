import type { StackProps } from "@mui/material/Stack";
import React from "react";
import { useTheme } from "@mui/material";
import Divider, { type DividerProps } from "@mui/material/Divider";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import Password from "./Password";

interface AccountAndVaultPasswordsProps {
  introduceVaultPassword?: boolean;
  vaultPasswordTitle?: string;
  vaultTitleProps?: TypographyProps;
  vaultPasswordLabel?: string;
  vaultPasswordName?: string;
  vaultPasswordIsWrong?: boolean;
  accountRandomKey?: string;
  dividerProps?: DividerProps;
  passwordContainerProps?: StackProps;
  showAll?: boolean;
  requireVaultPassword?: boolean;
}

const AccountAndVaultPasswords: React.FC<AccountAndVaultPasswordsProps> = ({
  introduceVaultPassword,
  vaultPasswordTitle = "To continue, introduce the vault's password:",
  vaultPasswordLabel = "Vault Password",
  vaultPasswordName = "vault_password",
  vaultPasswordIsWrong = false,
  requireVaultPassword = true,
  accountRandomKey,
  vaultTitleProps,
  dividerProps,
  passwordContainerProps,
  showAll,
}) => {
  const theme = useTheme();
  const accountPass = (
    <>
      <Password
        passwordName={"account_password"}
        labelPassword={"Account Password"}
        confirmPasswordName={"confirm_account_password"}
        containerProps={{
          width: 1,
          marginTop: "10px!important",
          spacing: 0.5,
          ...passwordContainerProps,
        }}
        inputsContainerProps={{
          spacing: "18px",
        }}
        randomKey={accountRandomKey}
      />
      <Typography
        fontSize={10}
        color={theme.customColors.dark75}
        marginTop={"10px!important"}
      >
        Be sure to have saved the account password before proceed. You won't be
        able to get the private key of the account if you don't know the
        password.
      </Typography>
    </>
  );

  const vaultPass = requireVaultPassword ? (
    <>
      <Typography
        marginTop={"15px!important"}
        fontSize={13}
        letterSpacing={"0.5px"}
        fontWeight={500}
        {...vaultTitleProps}
      >
        {vaultPasswordTitle}
      </Typography>
      <Password
        passwordName={vaultPasswordName}
        canGenerateRandom={false}
        justRequire={true}
        canShowPassword={true}
        labelPassword={vaultPasswordLabel}
        hidePasswordStrong={true}
        errorPassword={vaultPasswordIsWrong ? "Wrong password" : undefined}
        containerProps={{
          marginTop: "10px!important",
          spacing: 0.5,
          ...passwordContainerProps,
        }}
      />
    </>
  ) : null;

  let component: React.ReactNode;

  if (showAll) {
    component = (
      <>
        {accountPass}
        {vaultPass}
      </>
    );
  } else if (introduceVaultPassword) {
    component = vaultPass;
  } else {
    component = accountPass;
  }

  return (
    <>
      <Divider
        {...dividerProps}
        sx={{ borderColor: theme.customColors.dark25, ...dividerProps?.sx }}
      />
      {component}
    </>
  );
};

export default AccountAndVaultPasswords;
