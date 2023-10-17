import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import Password from "../common/Password";
import { useAppDispatch } from "../../hooks/redux";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { enqueueSnackbar } from "../../utils/ui";
import AccountsAutocomplete from "./Autocomplete";

interface FormValues {
  vault_password: string;
}

interface RemoveAccountProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

const RemoveAccount: React.FC<RemoveAccountProps> = ({ accounts }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [account, setAccount] = useState<SerializedAccountReference>(null);
  const [wrongPassword, setWrongPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const methods = useForm<FormValues>({
    defaultValues: {
      vault_password: "",
    },
  });
  const { handleSubmit, watch, reset } = methods;
  const pass = watch("vault_password");

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [pass]);

  const onChangeAccount = useCallback(
    (newAccount: SerializedAccountReference) => {
      setAccount(newAccount);
      setStatus("normal");
      setWrongPassword(false);
      reset({
        vault_password: "",
      });
      setSearchParams((prev) => {
        prev.set("id", newAccount.id);
        return prev;
      });
    },
    [reset]
  );

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(ACCOUNTS_PAGE);
    }
  }, [navigate, location, account]);

  useEffect(() => {
    const id = searchParams.get("id");
    const accountFromStore = accounts.find((item) => item.id === id);
    if (accountFromStore && account?.id !== id) {
      setAccount(accountFromStore);
      return;
    }

    if (!accountFromStore) {
      navigate(ACCOUNTS_PAGE);
    }
  }, [searchParams, accounts]);

  const removeAccount = useCallback(
    (data: FormValues) => {
      setStatus("loading");
      AppToBackground.removeAccount({
        serializedAccount: account,
        vaultPassword: data.vault_password,
      }).then((response) => {
        if (response.error) {
          setStatus("error");
        } else {
          if (response.data.isPasswordWrong) {
            setStatus("normal");
            setWrongPassword(true);
          } else {
            navigate(ACCOUNTS_PAGE);
            enqueueSnackbar({
              message: `Account removed successfully.`,
              variant: "success",
            });
          }
        }
      });
    },
    [navigate, dispatch, account]
  );

  return useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error removing the account."}
          onCancel={onCancel}
        />
      );
    }

    return (
      <Stack
        flexGrow={1}
        marginTop={3.5}
        component={"form"}
        onSubmit={handleSubmit(removeAccount)}
        justifyContent={"space-between"}
      >
        <Stack flexGrow={1}>
          <Typography
            fontSize={18}
            width={1}
            marginBottom={"30px!important"}
            textAlign={"center"}
            fontWeight={700}
            lineHeight={"28px"}
            color={theme.customColors.primary999}
          >
            Are you sure you want to remove the following account?
          </Typography>
          <AccountsAutocomplete
            selectedAccount={account}
            onChangeSelectedAccount={onChangeAccount}
          />
          <Divider
            sx={{ borderColor: theme.customColors.dark25, marginY: 3 }}
          />
          <Typography
            fontSize={14}
            width={1}
            fontWeight={500}
            lineHeight={"30px"}
            marginTop={"0!important"}
            sx={{ userSelect: "none" }}
          >
            To continue, introduce the vault's password:
          </Typography>
          <FormProvider {...methods}>
            <Password
              passwordName={"vault_password"}
              labelPassword={"Vault Password"}
              canGenerateRandom={false}
              justRequire={true}
              hidePasswordStrong={true}
              containerProps={{
                marginTop: "15px!important",
                spacing: 0.5,
              }}
              errorPassword={wrongPassword ? "Wrong password" : undefined}
            />
          </FormProvider>
        </Stack>

        <Stack direction={"row"} spacing={2} width={1} marginTop={2.5}>
          <Button
            onClick={onCancel}
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
            Cancel
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
            Remove
          </Button>
        </Stack>
      </Stack>
    );
  }, [
    status,
    removeAccount,
    handleSubmit,
    methods,
    account,
    onCancel,
    wrongPassword,
  ]);
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(RemoveAccount);
