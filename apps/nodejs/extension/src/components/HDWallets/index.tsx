import React, { useCallback, useMemo, useState } from "react";
import {
  AccordionProps,
  AccordionSummaryProps,
  styled,
  useTheme,
} from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MuiAccordion from "@mui/material/Accordion";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate, useSearchParams } from "react-router-dom";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AccountType, SerializedAccountReference } from "@poktscan/vault";
import { labelByProtocolMap } from "../../constants/protocols";
import ExpandIcon from "../../assets/img/expand_icon.svg";
import {
  ACCOUNTS_PAGE,
  CREATE_NEW_HD_WALLETS_PAGE,
  EXPORT_VAULT_PAGE,
  IMPORT_HD_WALLET_PAGE,
} from "../../constants/routes";
import RenameModal from "../Account/RenameModal";
import { enqueueSnackbar } from "../../utils/ui";
import RemoveModal from "../Account/RemoveModal";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import TooltipOverflow from "../common/TooltipOverflow";
import CopyIcon from "../../assets/img/thin_copy_icon.svg";
import { accountsSelector } from "../../redux/selectors/account";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
} from "../../redux/slices/app";
import { selectedChainByProtocolSelector } from "../../redux/selectors/network";

interface ChildItemProps {
  account: SerializedAccountReference;
  onClickRename: (account: SerializedAccountReference) => void;
  onClickRemove: (account: SerializedAccountReference) => void;
}

const ChildItem: React.FC<ChildItemProps> = ({
  account,
  onClickRemove,
  onClickRename,
}) => {
  const { address, name } = account;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  const handleCopyAddress = useCallback(() => {
    navigator.clipboard.writeText(account.address).then(() => {
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 500);
    });
  }, []);

  const onClickAccount = () => {
    Promise.all([
      dispatch(
        changeSelectedNetwork({
          network: account.protocol,
          chainId: selectedChainByProtocol[account.protocol],
        })
      ).unwrap(),
      dispatch(
        changeSelectedAccountOfNetwork({
          protocol: account.protocol,
          address: account.address,
        })
      ).unwrap(),
    ])
      .then(() => {
        navigate(ACCOUNTS_PAGE);
      })
      .catch(() => {
        enqueueSnackbar({
          variant: "error",
          message: "There was an error opening the account detail.",
        });
      });
  };

  return (
    <Stack paddingLeft={1}>
      <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
        <Typography
          fontSize={12}
          marginRight={"3px!important"}
          color={theme.customColors.primary500}
          sx={{
            textDecoration: "underline",
            cursor: "pointer",
          }}
          onClick={onClickAccount}
        >
          {name}
        </Typography>
        <Tooltip title={"Rename Account"}>
          <IconButton onClick={() => onClickRename(account)}>
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={"Remove Account"}>
          <IconButton onClick={() => onClickRemove(account)}>
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
        <TooltipOverflow
          text={address}
          textProps={{ fontSize: 12 }}
          enableTextCopy={false}
          showTextOverflowTooltip={false}
          tooltipSxProps={{ display: "none" }}
        />
        <Tooltip title={"Copied"} open={showCopyTooltip}>
          <IconButton onClick={handleCopyAddress}>
            <CopyIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary expandIcon={<ExpandIcon />} {...props} />
))(({ theme }) => ({
  paddingLeft: "5px",
  paddingRight: "5px",
  minHeight: 46,
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, .05)"
      : "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper": {
    transform: "scale(0.8)",
    "&.Mui-expanded": {
      transform: "rotate(-90deg)",
    },
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: 3,
    marginTop: 7,
    marginBottom: 7,
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  paddingX: theme.spacing(2),
  paddingY: theme.spacing(1.1),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

interface HDAccountItem {
  seed: SerializedAccountReference;
  child: SerializedAccountReference[];
}

interface HDAccountItemProps {
  hdAccount: HDAccountItem;
  defaultExpanded: boolean;
  onClickRename: (account: SerializedAccountReference) => void;
  onClickRemove: (account: SerializedAccountReference) => void;
}

const maxChildRecommended = 20;

const HDAccountItem: React.FC<HDAccountItemProps> = ({
  defaultExpanded,
  hdAccount: { seed, child },
  onClickRename,
  onClickRemove,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const { name, protocol } = seed;

  const onClickAddNew = () => {
    if (child.length >= maxChildRecommended) {
      enqueueSnackbar({
        variant: "warning",
        autoHideDuration: 10000,
        message: (onClickClose) => (
          <Stack sx={{ "*": { fontSize: 11, lineHeight: "16px" } }}>
            <span>
              The recommended max amount of accounts for a HD account is{" "}
              {maxChildRecommended} and this HD account already has{" "}
              {child.length}.{" "}
              <Button
                onClick={() => {
                  addNewChildAccount();
                  onClickClose();
                }}
                sx={{
                  padding: 0,
                  minWidth: 0,
                  fontSize: 12,
                  height: 16,
                  color: theme.customColors.primary500,
                  fontWeight: 600,
                }}
              >
                Proceed anyway
              </Button>
            </span>
          </Stack>
        ),
      });
    } else {
      addNewChildAccount();
    }
  };

  const addNewChildAccount = () => {
    setIsCreatingAccount(true);

    const onError = () => {
      enqueueSnackbar({
        variant: "error",
        message: `There was an error creating a new account from ${seed.name} HD Account`,
      });
    };

    AppToBackground.createAccountFromHdSeed({
      recoveryPhraseId: seed.id,
      protocol: seed.protocol,
    })
      .then((res) => {
        if (res.error) {
          onError();
        } else {
          enqueueSnackbar({
            variant: "success",
            autoHideDuration: 10000,
            message: (onClickClose) => (
              <Stack>
                <span>Account created successfully.</span>
                <span>
                  The vault content changed.{" "}
                  <Button
                    onClick={() => {
                      navigate(EXPORT_VAULT_PAGE);
                      onClickClose();
                    }}
                    sx={{ padding: 0, minWidth: 0 }}
                  >
                    Backup now?
                  </Button>
                </span>
              </Stack>
            ),
          });
        }
      })
      .catch(onError)
      .finally(() => setIsCreatingAccount(false));
  };

  const onClickRemoveSeed = () => {
    if (child.length) {
      enqueueSnackbar({
        variant: "error",
        message: `This HD account cannot be removed because it has child accounts.`,
        key: "remove_seed_error",
        preventDuplicate: true,
      });
    } else {
      onClickRemove(seed);
    }
  };

  return (
    <Stack position={"relative"}>
      <Accordion
        key={`${name}-${protocol}`}
        defaultExpanded={defaultExpanded}
        sx={{
          position: "relative",
        }}
      >
        <AccordionSummary>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
            width={1}
            paddingRight={0.3}
          >
            <Stack direction={"row"} spacing={0.7}>
              <Typography fontSize={14} fontWeight={500}>
                {name}
              </Typography>
              <Typography
                fontSize={12}
                paddingX={0.5}
                bgcolor={theme.customColors.dark15}
                borderRadius={"4px"}
              >
                {labelByProtocolMap[protocol]}
              </Typography>
            </Stack>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Stack
              direction={"row"}
              alignItems={"center"}
              spacing={0.7}
              marginBottom={"3px!important"}
            >
              <Typography fontSize={13} fontWeight={500}>
                Accounts
              </Typography>
              <Button
                variant={"outlined"}
                sx={{
                  height: 22,
                  fontWeight: 600,
                  fontSize: 12,
                  paddingX: 0.8,
                }}
                onClick={isCreatingAccount ? undefined : onClickAddNew}
              >
                {isCreatingAccount && (
                  <CircularProgress size={12} sx={{ marginRight: 0.5 }} />
                )}
                {isCreatingAccount ? "Adding" : "Add"} new
              </Button>
            </Stack>

            {child.length === 0 ? (
              <Typography fontSize={12} paddingLeft={1}>
                None
              </Typography>
            ) : (
              child.map((child) => (
                <ChildItem
                  key={child.address}
                  account={child}
                  onClickRemove={onClickRemove}
                  onClickRename={onClickRename}
                />
              ))
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={0.5}
        position={"absolute"}
        top={13}
        right={10}
      >
        <Tooltip title={"Rename Account"}>
          <IconButton onClick={() => onClickRename(seed)}>
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={"Remove Account"}>
          <IconButton onClick={onClickRemoveSeed}>
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

const HDWallets: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [modalToShow, setModalToShow] = useState<"none" | "rename" | "remove">(
    "none"
  );
  const [accountSelected, setSelectedAccount] =
    useState<SerializedAccountReference>(null);
  const navigate = useNavigate();
  const accounts = useAppSelector(accountsSelector);
  const seedsAndChild = useMemo(() => {
    const seeds: SerializedAccountReference[] = [];
    const mapChildBySeedId: Record<string, SerializedAccountReference[]> = {};

    for (const account of accounts) {
      if (account.accountType === AccountType.HDSeed) {
        seeds.push(account);

        if (!mapChildBySeedId[account.id]) {
          mapChildBySeedId[account.id] = [];
        }
      } else if (account.accountType === AccountType.HDChild) {
        if (mapChildBySeedId[account.parentId]) {
          mapChildBySeedId[account.parentId].push(account);
        } else {
          mapChildBySeedId[account.parentId] = [account];
        }
      }
    }

    return seeds.map((account) => ({
      seed: account,
      child: mapChildBySeedId[account.id] || [],
    }));
  }, [accounts]);

  const openRenameAccount = (account: SerializedAccountReference) => {
    setSelectedAccount(account);
    setModalToShow("rename");
  };

  const openRemoveAccount = (account: SerializedAccountReference) => {
    setSelectedAccount(account);
    setModalToShow("remove");
  };

  const closeModal = () => {
    setSelectedAccount(null);
    setModalToShow("none");
  };

  const accountIdFromParams = searchParams.get("account");
  return (
    <>
      <Stack paddingTop={1.5} justifyContent={"space-between"} height={1}>
        {seedsAndChild.length === 0 ? (
          <Stack flexGrow={1} alignItems={"center"} justifyContent={"center"}>
            <Typography
              color={theme.customColors.primary999}
              fontSize={14}
              lineHeight={"20px"}
              textAlign={"center"}
            >
              You do not have any HD Wallet yet.
              <br />
              Please create new or import a HD Wallet.
            </Typography>
          </Stack>
        ) : (
          <Stack
            maxHeight={450}
            width={360}
            overflow={"auto"}
            borderBottom={`1px solid ${theme.customColors.dark15}`}
          >
            {seedsAndChild.map((item) => (
              <HDAccountItem
                key={item.seed.id}
                hdAccount={item}
                defaultExpanded={accountIdFromParams === item.seed.id}
                onClickRename={openRenameAccount}
                onClickRemove={openRemoveAccount}
              />
            ))}
          </Stack>
        )}

        <Stack
          direction={"row"}
          spacing={2}
          width={1}
          height={35}
          marginTop={2}
        >
          <Button
            variant={"contained"}
            fullWidth
            sx={{
              backgroundColor: theme.customColors.primary500,
              height: 35,
              fontWeight: 700,
              fontSize: 16,
            }}
            onClick={() => navigate(IMPORT_HD_WALLET_PAGE)}
          >
            Import
          </Button>
          <Button
            variant={"contained"}
            fullWidth
            sx={{
              backgroundColor: theme.customColors.primary500,
              height: 35,
              fontWeight: 700,
              fontSize: 16,
            }}
            onClick={() => navigate(CREATE_NEW_HD_WALLETS_PAGE)}
          >
            New
          </Button>
        </Stack>
      </Stack>
      <RenameModal
        account={modalToShow === "rename" ? accountSelected : null}
        onClose={closeModal}
        containerProps={{ top: 0 }}
      />
      <RemoveModal
        account={modalToShow === "remove" ? accountSelected : null}
        onClose={closeModal}
        containerProps={{ top: 0, left: -5 }}
      />
    </>
  );
};

export default HDWallets;
