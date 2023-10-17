import type { ExternalConnectionRequest } from "../../types/communication";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import { useLocation } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import AppToBackground from "../../controllers/communication/AppToBackground";
import Requester from "../common/Requester";
import CheckIcon from "../../assets/img/check_icon.svg";
import CheckedIcon from "../../assets/img/checked_icon.svg";

interface PermissionItemProps {
  checked: boolean;
  toggleValue: () => void;
  title: string;
  description: string;
  showBorderBottom?: boolean;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  checked,
  toggleValue,
  title,
  description,
  showBorderBottom,
}) => {
  const theme = useTheme();
  return (
    <Stack
      spacing={1.4}
      paddingX={0.5}
      direction={"row"}
      height={55}
      width={1}
      boxSizing={"border-box"}
      borderBottom={
        showBorderBottom ? `1px solid ${theme.customColors.dark15}` : undefined
      }
    >
      <Checkbox
        size={"small"}
        checked={checked}
        onClick={toggleValue}
        checkedIcon={<CheckedIcon />}
        icon={<CheckIcon />}
        component={"div"}
        sx={{
          minWidth: 19,
          width: 19,
          height: 19,
          padding: 0,
          marginTop: "5px!important",
        }}
      />

      <Stack width={1}>
        <Typography
          fontWeight={500}
          fontSize={14}
          letterSpacing={"0.5px"}
          lineHeight={"24px"}
        >
          {title}
        </Typography>
        <Typography
          sx={{ fontSize: "12px!important" }}
          lineHeight={"16px"}
          component={"span"}
          color={theme.customColors.dark75}
        >
          {description}
        </Typography>
      </Stack>
    </Stack>
  );
};

const Request: React.FC = () => {
  const theme = useTheme();
  const currentRequest: ExternalConnectionRequest = useLocation()?.state;
  const [allowCreateAccounts, setAllowCreateAccounts] = useState(false);
  const [allowListAccounts, setAllowListAccounts] = useState(false);
  const [allowSuggestTransfers, setAllowSuggestTransfers] = useState(false);
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const lastAcceptedRef = useRef<boolean>(null);

  useEffect(() => {
    if (currentRequest?.suggestedPermissions) {
      const { suggestedPermissions } = currentRequest;

      setAllowCreateAccounts(suggestedPermissions.includes("create_accounts"));
      setAllowListAccounts(suggestedPermissions.includes("list_accounts"));
      setAllowSuggestTransfers(
        suggestedPermissions.includes("suggest_transfer")
      );
    }
  }, [currentRequest]);

  const isAllSelected =
    allowCreateAccounts && allowListAccounts && allowSuggestTransfers;
  const isSomethingSelected =
    allowCreateAccounts || allowListAccounts || allowSuggestTransfers;

  const toggleSelectAll = useCallback(() => {
    setAllowCreateAccounts(!isAllSelected);
    setAllowListAccounts(!isAllSelected);
    setAllowSuggestTransfers(!isAllSelected);
  }, [isAllSelected]);

  const sendResponse = useCallback(
    async (accepted: boolean) => {
      if (currentRequest) {
        lastAcceptedRef.current = accepted;
        setStatus("loading");
        const result = await AppToBackground.answerConnection({
          accepted,
          request: currentRequest,
          selectedAccounts: [],
          // canListAccounts: allowListAccounts && accepted,
          // canCreateAccounts: allowCreateAccounts && accepted,
          // canSuggestTransfers: allowSuggestTransfers && accepted,
        });
        const isError = !!result.error;
        setStatus(isError ? "error" : "normal");

        if (!isError) {
          lastAcceptedRef.current = null;
        }
      }
    },
    [
      currentRequest,
      allowCreateAccounts,
      allowListAccounts,
      allowSuggestTransfers,
    ]
  );

  const permissionItems: PermissionItemProps[] = useMemo(() => {
    return [
      {
        title: "List Accounts",
        description: "Allow the site to list your accounts.",
        checked: allowListAccounts,
        toggleValue: () => setAllowListAccounts((prevState) => !prevState),
      },
      {
        title: "Suggest Transfers",
        description: "Allow the site to suggest transfers.",
        checked: allowSuggestTransfers,
        toggleValue: () => setAllowSuggestTransfers((prevState) => !prevState),
      },
      {
        title: "Create Accounts",
        description:
          "Allow the site to request for the creation of new accounts.",
        checked: allowCreateAccounts,
        toggleValue: () => setAllowCreateAccounts((prevState) => !prevState),
      },
    ];
  }, [allowListAccounts, allowSuggestTransfers, allowCreateAccounts]);

  if (!currentRequest) {
    return null;
  }

  if (status === "loading") {
    return <CircularLoading />;
  }

  if (status === "error") {
    return (
      <OperationFailed
        text={"There was an error trying to answer the request."}
        onCancel={() => sendResponse(false)}
        onRetry={() => {
          if (typeof lastAcceptedRef.current === "boolean") {
            sendResponse(lastAcceptedRef.current);
          }
        }}
      />
    );
  }

  return (
    <Stack alignItems={"center"} justifyContent={"space-between"} height={1}>
      <Stack width={1}>
        <Stack paddingX={2} width={1} boxSizing={"border-box"}>
          <Typography
            width={340}
            height={60}
            fontSize={18}
            marginTop={2.5}
            fontWeight={700}
            marginBottom={1.5}
            lineHeight={"28px"}
            textAlign={"center"}
            sx={{ userSelect: "none" }}
            color={theme.customColors.primary999}
          >
            Select the permissions you want to grant this site.
          </Typography>
          <Requester request={currentRequest} />
          <Stack
            direction={"row"}
            alignItems={"center"}
            height={24}
            mt={1.5}
            width={"auto"}
            spacing={1.3}
          >
            <Checkbox
              size={"small"}
              checked={isAllSelected}
              onClick={toggleSelectAll}
              checkedIcon={<CheckedIcon />}
              icon={<CheckIcon />}
              sx={{
                width: 19,
                height: 19,
                padding: 0,
                marginLeft: "5px!important",
              }}
            />
            <Typography fontSize={14} fontWeight={500} letterSpacing={"0.5px"}>
              Select All
            </Typography>
          </Stack>
          <Stack
            width={1}
            padding={1}
            height={200}
            marginTop={1}
            spacing={0.5}
            borderRadius={"4px"}
            boxSizing={"border-box"}
            border={`1px solid ${theme.customColors.primary250}`}
          >
            {permissionItems.map((props, index) => (
              <PermissionItem
                key={index}
                showBorderBottom={index !== permissionItems.length - 1}
                {...props}
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
      <Stack
        width={1}
        spacing={2}
        paddingX={2}
        direction={"row"}
        alignItems={"center"}
        boxSizing={"border-box"}
      >
        <Button
          onClick={() => {
            sendResponse(false);
          }}
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
          disabled={!isSomethingSelected}
          onClick={() => {
            sendResponse(true);
          }}
        >
          Connect
        </Button>
      </Stack>
    </Stack>
  );
};

export default Request;
