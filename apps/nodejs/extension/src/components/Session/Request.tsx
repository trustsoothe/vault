import type { ExternalConnectionRequest } from "../../types/communication";
import type { RootState } from "../../redux/store";
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
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface PermissionItemProps {
  checked: boolean;
  toggleValue: () => void;
  title: string;
  description: string;
  showBorderTop?: boolean;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  checked,
  toggleValue,
  title,
  description,
  showBorderTop,
}) => {
  return (
    <Stack
      padding={"5px"}
      spacing={"10px"}
      direction={"row"}
      alignItems={"center"}
      height={50}
      width={1}
      boxSizing={"border-box"}
      borderTop={showBorderTop ? "1px solid lightgray" : undefined}
    >
      <Checkbox
        size={"small"}
        sx={{ paddingX: 0 }}
        checked={checked}
        onClick={toggleValue}
      />
      <Stack width={1}>
        <Typography fontWeight={600}>{title}</Typography>
        <Typography
          sx={{ fontSize: "10px!important" }}
          component={"span"}
          color={"dimgrey"}
        >
          {description}
        </Typography>
      </Stack>
    </Stack>
  );
};

const Request: React.FC = () => {
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
          canListAccounts: allowListAccounts && accepted,
          canCreateAccounts: allowCreateAccounts && accepted,
          canSuggestTransfers: allowSuggestTransfers && accepted,
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
    <Stack spacing={"10px"} height={1} flexGrow={1} justifyContent={"center"}>
      <Typography fontSize={20} textAlign={"center"}>
        Connection Request from:
      </Typography>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={"10px"}
        width={1}
      >
        <img
          width={24}
          height={24}
          alt={"favicon-ico"}
          src={currentRequest.faviconUrl}
        />
        <Typography
          fontSize={16}
          fontWeight={500}
          textOverflow={"ellipsis"}
          whiteSpace={"nowrap"}
          overflow={"hidden"}
          maxWidth={300}
          sx={{ textDecoration: "underline" }}
        >
          {currentRequest.origin}
        </Typography>
      </Stack>
      <Typography
        fontSize={14}
        marginTop={"15px!important"}
        textAlign={"center"}
      >
        Select the permissions you want to grant this site with.
      </Typography>
      <Stack direction={"row"} alignItems={"center"} height={18} mt={"10px"}>
        <Checkbox
          size={"small"}
          checked={isAllSelected}
          onClick={toggleSelectAll}
        />
        <Typography fontSize={12} fontWeight={600}>
          Select All
        </Typography>
      </Stack>
      <Stack
        border={"1px solid lightgray"}
        overflow={"auto"}
        padding={"5px"}
        mb={"10px"}
        mt={"5px"}
        borderRadius={"6px"}
        boxSizing={"border-box"}
        sx={{
          "& p": {
            fontSize: "12px!important",
          },
        }}
      >
        {permissionItems.map((props, index) => (
          <PermissionItem key={index} showBorderTop={index !== 0} {...props} />
        ))}
      </Stack>
      <Typography fontSize={10}>
        This site will be grant with the permissions you select. Before doing
        any operation, you will need to confirm it.
      </Typography>
      <Stack direction={"row"} spacing={"15px"} marginTop={"20px!important"}>
        <Button
          fullWidth
          variant={"outlined"}
          sx={{
            textTransform: "none",
            fontWeight: 600,
          }}
          onClick={() => sendResponse(false)}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          disabled={!isSomethingSelected}
          variant={"contained"}
          sx={{
            textTransform: "none",
            backgroundColor: "rgb(29, 138, 237)",
            fontWeight: 600,
          }}
          onClick={() => {
            sendResponse(true);
          }}
        >
          Accept
        </Button>
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    accounts: state.vault.entities.accounts.list,
  };
};

export default connect(mapStateToProps)(Request);
