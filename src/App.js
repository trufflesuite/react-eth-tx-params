import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import EthTxParams from "./eth-tx-params";

import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";

// import decodings from "./decodings";
import * as Codec from "@truffle/codec";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LoadingButton from "@mui/lab/LoadingButton";
import Alert from "@mui/material/Alert";

import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

import { txs, getDecoding } from "./generate-decodings";

// adding support for Kovan and Mainnet
export const injected = new InjectedConnector({
  supportedChainIds: [1, 42],
});

const App = () => {
  const { chainId, account, activate, deactivate, active } = useWeb3React();

  // input data
  const [txTargetAddress, setTxTargetAddress] = useState("");
  const [txData, setTxData] = useState("");

  const [template, setTemplate] = useState(-1);
  const [definitions, setDefintions] = useState({});
  const [data, setData] = useState({});

  //boolean flags to mange UI state
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    (async () => {
      if (template > -1 && txs[template]?.to) {
        const txParams = txs[template];
        await decodeTx(txParams);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  const decodeTx = async (txParams) => {
    setData({});
    setDefintions({});
    setLoading(true);
    const { decoding, definitions } = await getDecoding(txParams);
    setDefintions(definitions);
    const data = deserializeCalldataDecoding(decoding);
    setData(data);
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
        return "Mainnet";
      case 42:
        return "Kovan";
      default:
        return "Unknown !";
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
      await decodeTx(txParams);
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
        <Stack spacing={1} direction="row">
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
          <Button
            variant="contained"
            size="small"
            key={5}
            disabled={!active}
            onClick={() => {
              setTemplate(5);
              setTxData("");
              setTxTargetAddress("");
            }}
          >
            Custom Tx
          </Button>
        </Stack>
      </header>

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
                  label="Target Address"
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
                  onClick={handleTxDecoding}
                >
                  Decode Tx Data
                </LoadingButton>
              </Stack>

              {loading ? (
                <CircularProgress />
              ) : (
                <EthTxParams
                  decoding={data}
                  definitions={definitions}
                ></EthTxParams>
              )}
            </Stack>
          ) : loading ? (
            <CircularProgress />
          ) : (
            <EthTxParams
              decoding={data}
              definitions={definitions}
            ></EthTxParams>
          )
        ) : (
          <Alert severity="info">Please connect your wallet to start!</Alert>
        )}
      </main>

      {/* <main>
        {active && template === 5 ? (
          <Stack
            spacing={2}
            style={{ backgroundColor: "#fff", padding: "2em", width: "30%" }}
          >
            <TextField
              style={{ width: "100%" }}
              id="outlined-target-address"
              label="Target Address"
              onChange={({ target }) => setTxTargetAddress(target.value)}
              css={css`
                width: 100%;
              `}
            />

            <TextField
              style={{ width: "100%" }}
              id="outlined-multiline-flexible"
              label="Tx Data"
              multiline
              maxRows={8}
              rows={8}
              onChange={({ target }) => setTxData(target.value)}
              css={css`
                width: 100%;
              `}
            />

            <LoadingButton
              disabled={!txTargetAddress || !txData}
              variant="contained"
              size="large"
              onClick={handleTxDecoding}
            >
              Decode Tx Data
            </LoadingButton>
          </Stack>
        ) : null}
        {active ? (
          loading ? (
            <CircularProgress />
          ) : (
            <EthTxParams
              decoding={data}
              definitions={definitions}
            ></EthTxParams>
          )
        ) : (
          <Alert severity="info">Please connect your wallet to start!</Alert>
        )}
      </main> */}

      {/* <main>
        {template === 5 ? (
          <div
            style={{ backgroundColor: "#fff", padding: "2em", width: "30%" }}
          >
            <TextField
              style={{ width: "100%", padding: "1rem 0" }}
              id="outlined-target-address"
              label="Target Address"
              onChange={({ target }) => setTxTargetAddress(target.value)}
              css={css`
                width: 100%;
              `}
            />

            <TextField
              style={{ width: "100%", padding: "1rem 0" }}
              id="outlined-multiline-flexible"
              label="Tx Data"
              multiline
              maxRows={8}
              rows={8}
              onChange={({ target }) => setTxData(target.value)}
              css={css`
                width: 100%;
              `}
            />

            <LoadingButton
              disabled={!txTargetAddress || !txData}
              variant="contained"
              size="large"
              onClick={handleTxDecoding}
            >
              Decode Tx Data
            </LoadingButton>
          </div>
        ) : template >= 0 ? (
          loading ? (
            <CircularProgress />
          ) : (
            <EthTxParams
              decoding={data}
              definitions={definitions}
            ></EthTxParams>
          )
        ) : !active ? (
          <Alert severity="info">Please connect your wallet to start!</Alert>
        ) : null}
      </main> */}
    </div>
  );
};

export default App;
