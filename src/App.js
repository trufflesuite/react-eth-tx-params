import React, { useState, useEffect } from "react";
import { css } from "@emotion/react";
import "./App.css";
import EthTxParams from "./eth-tx-params";

// import { Web3ReactProvider } from "@web3-react/core";
// import { Web3Provider } from "@ethersproject/providers";
// import { useWeb3React } from "@web3-react/core";

// import decodings from "./decodings";
import * as Codec from "@truffle/codec";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { txs, getDecoding } from "./generate-decodings";

// const getLibrary = (provider: any): Web3Provider => {
//   const library = new Web3Provider(provider);
//   library.pollingInterval = 12000;
//   return library;
// };

const App = () => {
  // const { connector, library, chainId, account, activate, deactivate, active } =
  //   useWeb3React();

  const [template, setTemplate] = useState(-1);
  const [txParams, setTxParams] = useState({});
  const [loading, setLoading] = useState(false);

  const [definitions, setDefintions] = useState({});
  const [data, setData] = useState({});

  // make sure we have a template selection
  useEffect(() => {
    if (template >= 0) {
      setTxParams(txs[template]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

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
      {/* <Web3ReactProvider getLibrary={getLibrary}> */}
      <header className="App-header">
        <h1>Tx Param Component</h1>

        <Button
          variant="contained"
          size="large"
          style={{ marginBottom: "1rem" }}
        >
          Connect wallet
        </Button>

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
      {/* </Web3ReactProvider> */}
    </div>
  );
};

export default App;
