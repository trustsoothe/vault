import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useGetChainsMapQuery } from "../../redux/slices/pokt";
import ExpandIcon from "../assets/img/expand_select_icon.svg";
import Summary from "../components/Summary";
import { themeColors } from "../theme";

const CHAINS_IMAGES_URL = process.env.CHAIN_IMAGES_CDN_URL;

interface ChainsSummaryProps {
  chains: string[];
  chainId: string;
}

export default function ChainsSummary({ chains, chainId }: ChainsSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: chainsMap } = useGetChainsMapQuery(chainId);

  return (
    <>
      <Summary
        containerProps={{
          borderRadius: 0,
          paddingTop: 0,
          marginTop: -0.5,
        }}
        rows={[
          {
            type: "row",
            label: "Chains",
            value: (
              <Stack>
                <Button
                  disableRipple={true}
                  onClick={() => setExpanded((prev) => !prev)}
                  sx={{
                    gap: 0.5,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    color: themeColors.black,
                    height: 19.5,
                    paddingY: 0,
                    marginTop: -0.2,
                    marginRight: -0.4,
                    paddingX: 0.4,
                    "& path": {
                      fill: themeColors.black,
                    },
                    "& svg": {
                      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease-in-out",
                    },
                    "&:hover": {
                      backgroundColor: themeColors.bgLightGray,
                    },
                  }}
                >
                  {chains.length} chains
                  <ExpandIcon />
                </Button>
                {expanded ? (
                  chainsMap ? (
                    <Stack gap={0.4} marginTop={1}>
                      {chains.map((chain) => (
                        <Stack
                          key={chain}
                          spacing={0.6}
                          direction={"row"}
                          alignItems={"center"}
                          justifyContent={"flex-end"}
                        >
                          {CHAINS_IMAGES_URL && (
                            <img
                              width={15}
                              height={15}
                              src={`${CHAINS_IMAGES_URL}/${
                                chainsMap[chain]?.image ||
                                chainsMap.default?.image
                              }`}
                              alt={`${chainsMap[chain]?.label || chain}-img`}
                            />
                          )}

                          <Typography variant={"subtitle2"}>
                            {chainsMap[chain]?.label || chain}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      marginTop={0.7}
                      whiteSpace={"pre"}
                      textAlign={"right"}
                      variant={"subtitle2"}
                    >
                      {chains.join("\n")}
                    </Typography>
                  )
                ) : null}
              </Stack>
            ),
            containerProps: {
              sx: {
                alignItems: "flex-start",
                "& h6": {
                  whiteSpace: "pre",
                },
              },
            },
          },
        ]}
      />
    </>
  );
}
