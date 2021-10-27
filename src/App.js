import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import "./App.css";
import EthTxParams from "./eth-tx-params";
import { forAddress } from "@truffle/decoder";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";

import Web3HttpProvider from "web3-providers-http";

// import { JsonRpcSigner, JsonRpcProvider } from "@ethersproject/providers";

import * as Codec from "@truffle/codec";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import LoadingButton from "@mui/lab/LoadingButton";
import Alert from "@mui/material/Alert";

import SwipeableViews from "react-swipeable-views";
import { useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

import {
  txs,
  getDecoding,
  fetchProjectInfo,
  gatherDefinitions,
} from "./generate-decodings";

// adding support for Kovan and Mainnet
export const injected = new InjectedConnector({
  supportedChainIds: [1, 42],
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const App = () => {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setTemplate(-1);
  };

  const handleChangeIndex = (index) => {
    setValue(index);
  };

  const { chainId, account, activate, deactivate, active, library } =
    useWeb3React();

  // input data
  const [txTargetAddress, setTxTargetAddress] = useState("");
  const [txData, setTxData] = useState("");

  const [template, setTemplate] = useState(-1);
  const [definitions, setDefintions] = useState({});
  const [data, setData] = useState({});

  //boolean flags to mange UI state
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showDecodingResults, setShowDecodingResults] = useState(false);

  useEffect(() => {
    (async () => {
      if (template > -1 && txs[template]?.to) {
        const txParams = txs[template];
        value === 0 ? await decodeTx(txParams) : await decodeTxClient(txParams);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // decode TX (server side) - DEPRECATED
  const decodeTx = async (txParams) => {
    setData({});
    setDefintions({});
    setLoading(true);
    const { decoding, definitions } = await getDecoding(txParams, chainId);
    setDefintions(definitions);
    const data = deserializeCalldataDecoding(decoding);
    setData(data);
    setLoading(false);
  };

  // decode TX (client side)
  const decodeTxClient = async (txParams) => {
    const { to, data } = txParams;

    setData({});
    setDefintions({});
    setLoading(true);

    // fetching project info from backend service, chainId already injested through MM
    const projectInfo = await fetchProjectInfo(to, chainId);

    // NOT WORKING :(
    // const decoder = await forAddress(to, {
    //   provider: library.provider,
    //   projectInfo,
    // });

    // NOT WORKING :(
    // const decoder = await forAddress(to, {
    //   provider: new JsonRpcProvider("https://mainnet.infura.io/v3/e24b1e96c17e4aa995ad8c0ee861667c"),
    //   projectInfo,
    // });

    // WORKING :)
    const decoder = await forAddress(to, {
      provider: new Web3HttpProvider(
        `https://${mapNetworkToChainid(
          chainId
        )}.infura.io/v3/e24b1e96c17e4aa995ad8c0ee861667c`
      ),
      projectInfo,
    });

    // build the strucutre of the tx
    const tx = {
      from: account,
      to,
      input: data,
      blockNumber: null,
    };

    // build defintions
    const definitions = await gatherDefinitions({
      compilations: projectInfo?.compilations,
      referenceDeclarations: decoder?.projectDecoder?.referenceDeclarations,
    });
    setDefintions(definitions);

    // build decoding
    const decoding = deserializeCalldataDecoding(
      await decoder.decodeTransaction(tx)
    );
    setData(decoding);

    setLoading(false);
  };

  const handleWalletConnect = () => {
    try {
      setConnecting(true);
      activate(injected, (error) => setConnecting(false));
      setConnecting(false);
    } catch (error) {
      setConnecting(false);
    }
  };

  const handleWalletDisconnect = () => {
    try {
      setConnecting(true);
      deactivate();
      setConnecting(false);
    } catch (error) {
      setConnecting(false);
    }
  };

  const mapNetworkToChainid = (chainId) => {
    switch (chainId) {
      case 1:
        return "mainnet";
      case 42:
        return "kovan";
      default:
        return "unknown!";
    }
  };

  const handleTxDecoding = useCallback(() => {
    (async () => {
      const txParams = {
        desc: "Generic tx decoding",
        from: account,
        to: txTargetAddress,
        data: txData,
      };
      value === 0 ? await decodeTx(txParams) : await decodeTxClient(txParams);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txTargetAddress, txData, account]);

  const deserializeCalldataDecoding = (decoding) => {
    switch (decoding.kind) {
      case "function": {
        return {
          ...decoding,
          class: Codec.Format.Utils.Serial.deserializeType(decoding.class),
          arguments: decoding.arguments.map(({ name, value }) => ({
            name,
            value: Codec.Format.Utils.Serial.deserializeResult(value),
          })),
        };
      }
      case "constructor": {
        return {
          ...decoding,
          class: Codec.Format.Utils.Serial.deserializeType(decoding.class),
          arguments: decoding.arguments.map(({ name, value }) => ({
            name,
            value: Codec.Format.Utils.Serial.deserializeResult(value),
          })),
        };
      }
      case "message": {
        return {
          ...decoding,
          class: Codec.Format.Utils.Serial.deserializeType(decoding.class),
        };
      }
      case "unknown":
      case "create":
      default:
        return decoding;
    }
  };

  return (
    <div className="App">
      <section className="App-wallet">
        <LoadingButton
          loading={connecting}
          variant="contained"
          size="large"
          onClick={() =>
            active ? handleWalletDisconnect() : handleWalletConnect()
          }
        >
          {active
            ? "Disconnect"
            : connecting
            ? "Connecting..."
            : "Connect wallet"}
        </LoadingButton>
        {active && chainId && account ? (
          <Stack spacing={1} direction="row">
            <Chip label={mapNetworkToChainid(chainId)} />
            <Chip label={account} variant="outlined" />
            <Chip
              label="Fork on GitHub"
              variant="outlined"
              onClick={() =>
                (window.location.href =
                  "https://github.com/danfinlay/react-eth-tx-params")
              }
            ></Chip>
          </Stack>
        ) : null}
      </section>
      <header className="App-header">
        <h1>Tx Param Component</h1>
      </header>

      <main>
        {active ? (
          <Box sx={{ bgcolor: "background.paper", width: 700 }}>
            <AppBar position="static">
              <Tabs
                value={value}
                onChange={handleChange}
                indicatorColor="secondary"
                textColor="inherit"
                variant="fullWidth"
                aria-label="full width tabs example"
              >
                <Tab label="Server" />
                <Tab label="Client" />
              </Tabs>
            </AppBar>
            <SwipeableViews
              axis={theme.direction === "rtl" ? "x-reverse" : "x"}
              index={value}
              onChangeIndex={handleChangeIndex}
            >
              <TabPanel value={value} index={0} dir={theme.direction}>
                <Stack spacing={1} direction="row">
                  <ButtonGroup disableElevation variant="contained">
                    {txs.map((decoding, i) => {
                      return (
                        <Button
                          variant="contained"
                          size="small"
                          key={i}
                          disabled={!active}
                          onClick={() => {
                            setTemplate(i);
                          }}
                        >
                          {txs[i].desc}
                        </Button>
                      );
                    })}
                  </ButtonGroup>

                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    key={5}
                    disabled={!active}
                    onClick={() => {
                      setTemplate(5);
                      setShowDecodingResults(false);
                    }}
                  >
                    Custom Tx
                  </Button>
                </Stack>
              </TabPanel>
              <TabPanel value={value} index={1} dir={theme.direction}>
                <Stack spacing={1} direction="row">
                  <ButtonGroup disableElevation variant="contained">
                    {txs.map((decoding, i) => {
                      return (
                        <Button
                          variant="contained"
                          size="small"
                          key={i}
                          disabled={!active}
                          onClick={() => {
                            setTemplate(i);
                          }}
                        >
                          {txs[i].desc}
                        </Button>
                      );
                    })}
                  </ButtonGroup>

                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    key={5}
                    disabled={!active}
                    onClick={() => {
                      setTemplate(5);
                      setShowDecodingResults(false);
                    }}
                  >
                    Custom Tx
                  </Button>
                </Stack>
              </TabPanel>
            </SwipeableViews>
          </Box>
        ) : null}
      </main>

      <main>
        {active ? (
          template === 5 ? (
            <Stack spacing={1} direction="row">
              <Stack
                spacing={2}
                style={{
                  backgroundColor: "#fff",
                  padding: "2em",
                  width: "400px",
                }}
              >
                <TextField
                  style={{ width: "100%" }}
                  id="outlined-target-address"
                  label="Contract Address"
                  disabled={loading}
                  onChange={({ target }) => setTxTargetAddress(target.value)}
                />

                <TextField
                  style={{ width: "100%" }}
                  id="outlined-multiline-flexible"
                  label="Tx Data"
                  disabled={loading}
                  multiline
                  maxRows={8}
                  rows={8}
                  onChange={({ target }) => setTxData(target.value)}
                />

                <LoadingButton
                  disabled={!txTargetAddress || !txData}
                  loading={loading}
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setShowDecodingResults(true);
                    handleTxDecoding();
                  }}
                >
                  Decode Tx Data
                </LoadingButton>
              </Stack>

              {loading ? (
                <CircularProgress />
              ) : showDecodingResults ? (
                <EthTxParams
                  decoding={data}
                  definitions={definitions}
                ></EthTxParams>
              ) : null}
            </Stack>
          ) : loading ? (
            <CircularProgress />
          ) : template > -1 ? (
            <EthTxParams
              decoding={data}
              definitions={definitions}
            ></EthTxParams>
          ) : null
        ) : (
          <Alert severity="info">Please connect your wallet to start!</Alert>
        )}
      </main>
    </div>
  );
};

export default App;
