import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import React, { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { IMPORT_SEEDS_PAGE, NEW_SEEDS_PAGE } from "../../constants/routes";
import MenuDivider from "../components/MenuDivider";
import MoreIcon from "../assets/img/more_icon.svg";
import NewEntitiesButtons from "./NewSeedButtons";
import { themeColors } from "../theme";

interface SeedItemProps {
  seed: {
    id: string;
    name: string;
    accounts: number;
  };
}

function SeedItem({ seed: { name, accounts } }: SeedItemProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Stack
        width={1}
        height={56}
        spacing={1.2}
        paddingX={1.6}
        paddingY={1.1}
        direction={"row"}
        borderRadius={"8px"}
        alignItems={"center"}
        boxSizing={"border-box"}
        bgcolor={themeColors.bgLightGray}
      >
        {/*todo: change for icon*/}
        <Stack
          width={15}
          height={15}
          border={"1px solid black"}
          borderRadius={"4px"}
        />
        <Stack spacing={0.4} flexGrow={1}>
          <Typography variant={"subtitle2"} lineHeight={"16px"}>
            {name}
          </Typography>
          <Typography
            variant={"body2"}
            lineHeight={"14px"}
            color={themeColors.textSecondary}
          >
            {accounts} Account{accounts === 1 ? "" : "s"}
          </Typography>
        </Stack>
        <IconButton
          sx={{ height: 25, width: 27, borderRadius: "8px" }}
          onClick={handleClick}
        >
          <MoreIcon />
        </IconButton>
      </Stack>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 190,
              marginTop: 0.8,
            },
          },
        }}
      >
        <MenuItem>Manage Accounts</MenuItem>
        <MenuItem>Rename</MenuItem>
        <MenuDivider />
        <MenuItem className={"sensitive"}>Remove Seed</MenuItem>
      </Menu>
    </>
  );
}

export default function SeedsList() {
  const navigate = useNavigate();
  const seeds = [
    {
      id: "1",
      name: "Seed For test",
      accounts: 2,
    },
    {
      id: "2",
      name: "Seed For POKt",
      accounts: 0,
    },
  ];

  return (
    <>
      <Stack
        flexGrow={1}
        spacing={1.2}
        padding={2.4}
        minHeight={0}
        flexBasis={"1px"}
        overflow={"auto"}
        bgcolor={themeColors.white}
      >
        {seeds.map((seed, i) => (
          <SeedItem key={seed.id + i} seed={seed} />
        ))}
      </Stack>
      <NewEntitiesButtons
        containerProps={{
          width: 1,
          height: 86,
          marginTop: 0,
          bgcolor: themeColors.bgLightGray,
          borderTop: `1px solid ${themeColors.borderLightGray}`,
          sx: {
            button: {
              width: 1,
            },
          },
        }}
        importProps={{
          onClick: () => navigate(IMPORT_SEEDS_PAGE),
        }}
        createProps={{
          onClick: () => navigate(NEW_SEEDS_PAGE),
        }}
      />
    </>
  );
}
