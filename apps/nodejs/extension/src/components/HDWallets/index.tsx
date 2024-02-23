import React, { useMemo } from "react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AccountType, SerializedAccountReference } from "@poktscan/keyring";
import { labelByProtocolMap } from "../../constants/protocols";
import ExpandIcon from "../../assets/img/expand_icon.svg";
import {
  CREATE_NEW_HD_WALLETS_PAGE,
  IMPORT_HD_WALLET_PAGE,
} from "../../constants/routes";
import { useAppSelector } from "../../hooks/redux";
import { accountsSelector } from "../../redux/selectors/account";

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

const HDWallets: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
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

  const accountIdFromParams = searchParams.get("account");
  return (
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
          overflow={"auto"}
          borderBottom={`1px solid ${theme.customColors.dark15}`}
        >
          {seedsAndChild.map(({ seed, child }) => {
            const { name, protocol, id } = seed;
            return (
              <Stack position={"relative"}>
                <Accordion
                  key={`${name}-${protocol}`}
                  defaultExpanded={accountIdFromParams === id}
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
                            // backgroundColor: theme.customColors.primary500,
                            height: 22,
                            fontWeight: 600,
                            fontSize: 12,
                            paddingX: 0.8,
                          }}
                        >
                          Add new
                        </Button>
                      </Stack>

                      {child.map((child) => (
                        <Stack
                          paddingLeft={1}
                          direction={"row"}
                          alignItems={"center"}
                          spacing={0.5}
                          key={`${name}-${protocol}-${child.name}`}
                        >
                          <Typography
                            fontSize={12}
                            marginRight={"3px!important"}
                            color={theme.customColors.primary500}
                            sx={{
                              textDecoration: "underline",
                              cursor: "pointer",
                            }}
                          >
                            {child.name}
                          </Typography>
                          <Tooltip title={"Rename Account"}>
                            <IconButton>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={"Remove Account"}>
                            <IconButton>
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
                <Stack
                  direction={"row"}
                  alignItems={"center"}
                  spacing={0.5}
                  position={"absolute"}
                  zIndex={10}
                  top={13}
                  right={10}
                >
                  <Tooltip title={"Rename Account"}>
                    <IconButton>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={"Remove Account"}>
                    <IconButton>
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}

      <Stack direction={"row"} spacing={2} width={1} height={35} marginTop={2}>
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
  );
};

export default HDWallets;
