import type { StackProps } from "@mui/material/Stack";
import React, { useMemo } from "react";
import Divider, { type DividerProps } from "@mui/material/Divider";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import Password from "./Password";

interface AccountAndVaultPasswordsProps {
  introduceVaultPassword: boolean;
  vaultPasswordTitle?: string;
  vaultTitleProps?: TypographyProps;
  vaultPasswordLabel?: string;
  vaultPasswordName?: string;
  vaultPasswordIsWrong?: boolean;
  accountRandomKey?: string;
  dividerProps?: DividerProps;
  passwordContainerProps?: StackProps;
}

const AccountAndVaultPasswords: React.FC<AccountAndVaultPasswordsProps> = ({
  introduceVaultPassword,
  vaultPasswordTitle = "To continue, introduce the vault's password:",
  vaultPasswordLabel = "Vault Password",
  vaultPasswordName = "vault_password",
  vaultPasswordIsWrong = false,
  accountRandomKey,
  vaultTitleProps,
  dividerProps,
  passwordContainerProps,
}) => {
  const content = useMemo(() => {
    return !introduceVaultPassword ? (
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
    ) : (
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
    );
  }, [
    vaultPasswordIsWrong,
    vaultPasswordName,
    vaultPasswordLabel,
    vaultPasswordTitle,
    introduceVaultPassword,
    accountRandomKey,
    vaultTitleProps,
    passwordContainerProps,
  ]);

  return (
    <>
      <Divider {...dividerProps} />
      {content}
    </>
  );
};

export default AccountAndVaultPasswords;
