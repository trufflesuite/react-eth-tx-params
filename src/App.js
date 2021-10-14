import React, { useState, useEffect } from "react";
import { css } from "@emotion/react";
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

import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

import { txs, getDecoding } from "./generate-decodings";

// adding support for Kovan and Mainnet
export const injected = new InjectedConnector({
  supportedChainIds: [1, 42],
});

const App = () => {
  const { chainId, account, activate, deactivate, active } = useWeb3React();

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
        setData({});
        setDefintions({});
        setLoading(true);

        const { decoding, definitions } = await getDecoding(txParams);
        setDefintions(definitions);

        const data = deserializeCalldataDecoding(decoding);

        setData(data);
        setLoading(false);
      }
    })();
  }, [template]);

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
          </Stack>
        ) : null}
      </section>
      <header className="App-header">
        <h1>Tx Param Component</h1>

        <a href="https://github.com/danfinlay/react-eth-tx-params">
          Fork on GitHub
        </a>
        <div>
          {txs.map((decoding, i) => {
            return (
              <button
                key={i}
                onClick={() => {
                  setTemplate(i);
                }}
              >
                {txs[i].desc}
              </button>
            );
          })}
          <button
            key={5}
            onClick={() => {
              setTemplate(5);
            }}
          >
            Custom Tx
          </button>
        </div>
      </header>

      <main>
        {template === 5 ? (
          <div
            style={{ backgroundColor: "#fff", padding: "2em", width: "30%" }}
          >
            <TextField
              style={{ width: "100%", padding: "1rem 0" }}
              id="outlined-target-address"
              label="Target Address"
              onChange={() => {}}
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
              onChange={() => {}}
              css={css`
                width: 100%;
              `}
            />

            <Button variant="contained" size="large">
              Decode Tx Data
            </Button>
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
        ) : (
          "Please select a tx to decode ! "
        )}
      </main>
    </div>
  );
};

export default App;
