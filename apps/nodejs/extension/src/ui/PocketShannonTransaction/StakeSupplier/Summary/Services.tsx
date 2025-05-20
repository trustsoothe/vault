import {
  ConfigOptions,
  RPCType,
  SupplierServiceConfig,
} from "../../BaseTransaction";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import Button from "@mui/material/Button";
import { themeColors } from "../../../theme";
import ExpandIcon from "../../../assets/img/expand_select_icon.svg";
import { AccountInfoFromAddress } from "../../../components/AccountInfo";
import { SupportedProtocols } from "@soothe/vault";

function getRpcLabel(rpcType: RPCType) {
  switch (rpcType) {
    case RPCType.GRPC:
      return "gRPC";
    case RPCType.WEBSOCKET:
      return "WebSocket";
    case RPCType.JSON_RPC:
      return "JSON-RPC";
    case RPCType.REST:
      return "REST";
    default:
      return "Unknown";
  }
}

function getConfigLabel(config: ConfigOptions) {
  switch (config) {
    case ConfigOptions.TIMEOUT:
      return "Timeout";
    default:
      return "Unknown";
  }
}

interface SupplierServiceItemProps {
  service: SupplierServiceConfig;
  index: number;
}

function SupplierServiceItem({ service, index }: SupplierServiceItemProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Stack
      paddingY={0.5}
      borderTop={index > 0 ? `1px solid ${themeColors.light_gray1}` : undefined}
      sx={{
        paddingX: 0.8,
      }}
    >
      <Button
        disableRipple={true}
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          height: 24,
          gap: 0.5,
          alignItems: "center",
          justifyContent: "space-between",
          padding: 0,
          color: themeColors.black,
          "& path": {
            fill: themeColors.black,
          },
          "& svg": {
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.1s ease-in-out",
          },
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      >
        <span>{service.serviceId}</span>
        <ExpandIcon />
      </Button>
      {expanded && (
        <Stack padding={0} borderRadius={1} marginTop={0.4}>
          <Typography fontSize={11} marginBottom={0.8}>
            Endpoints
          </Typography>
          <Stack
            margin={0}
            component={"ul"}
            paddingLeft={0}
            border={`1px solid ${themeColors.light_gray1}`}
            borderRadius={"6px"}
          >
            {service.endpoints.map((endpoint, index) => (
              <Stack
                margin={0}
                component={"li"}
                key={endpoint.url}
                paddingX={1}
                paddingY={0.4}
                borderTop={
                  index > 0
                    ? `1px solid ${themeColors.borderLightGray}`
                    : undefined
                }
                bgcolor={
                  index % 2 === 0 ? themeColors.bgLightGray2 : themeColors.white
                }
              >
                <Stack
                  width={1}
                  direction={"row"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                  spacing={0.6}
                >
                  <Typography fontSize={11} noWrap={true}>
                    {endpoint.url}
                  </Typography>
                  <Stack
                    paddingX={0.4}
                    paddingY={0.2}
                    border={`1px solid ${themeColors.light_gray}`}
                    borderRadius={"4px"}
                  >
                    <Typography fontSize={9} whiteSpace={"nowrap"}>
                      {getRpcLabel(endpoint.rpcType)}
                    </Typography>
                  </Stack>
                </Stack>
                {endpoint.configs.length > 0 && (
                  <>
                    <Stack component={"ul"} margin={0} paddingLeft={0.4}>
                      {endpoint.configs.map((config) => (
                        <Stack margin={0} component={"li"} key={config.key}>
                          <Stack
                            direction={"row"}
                            alignItems={"center"}
                            spacing={0.6}
                            width={1}
                          >
                            <Typography>-</Typography>
                            <Stack
                              width={1}
                              spacing={0.6}
                              direction={"row"}
                              alignItems={"center"}
                            >
                              <Typography fontSize={10}>
                                {getConfigLabel(config.key)}:
                              </Typography>
                              <Typography fontSize={10} noWrap={true}>
                                {config.value}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            ))}
          </Stack>
          {service.revShare.length > 0 && (
            <>
              <Typography fontSize={11} marginTop={0.8} marginBottom={0.4}>
                Rev Share
              </Typography>
              <Stack component={"ul"} margin={0} paddingLeft={0}>
                {service.revShare.map((revShare) => (
                  <Stack
                    margin={0}
                    component={"li"}
                    key={revShare.address}
                    paddingX={0.6}
                    marginBottom={"6px!important"}
                  >
                    <Stack
                      sx={{
                        transform: "scale(0.9)",
                        marginLeft: "-16px!important",
                      }}
                    >
                      <AccountInfoFromAddress
                        address={revShare.address}
                        protocol={SupportedProtocols.Cosmos}
                      />
                    </Stack>
                    <Stack
                      direction={"row"}
                      alignItems={"center"}
                      spacing={0.6}
                      width={1}
                    >
                      <Stack
                        width={1}
                        height={8}
                        borderRadius={"8px"}
                        bgcolor={themeColors.light_gray1}
                      >
                        <Stack
                          width={`${revShare.revSharePercentage}%`}
                          bgcolor={themeColors.black}
                          height={1}
                          sx={{
                            borderTopLeftRadius: "8px",
                            borderBottomLeftRadius: "8px",
                          }}
                        />
                      </Stack>
                      <Typography fontSize={11} whiteSpace={"nowrap"}>
                        {revShare.revSharePercentage}%
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}

interface SupplierServicesSummaryProps {
  services: Array<SupplierServiceConfig>;
}

export default function SupplierServicesSummary({
  services,
}: SupplierServicesSummaryProps) {
  return (
    <Stack
      width={1}
      marginLeft={-9}
      marginTop={2.8}
      borderRadius={"6px"}
      bgcolor={themeColors.white}
      border={`1px solid ${themeColors.light_gray1}`}
    >
      {services.map((service, index) => (
        <SupplierServiceItem
          key={service.serviceId}
          service={service}
          index={index}
        />
      ))}
    </Stack>
  );
}
