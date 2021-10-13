import React, { useState, useEffect } from "react";
import "./App.css";
import EthTxParams from "./eth-tx-params";
// import decodings from "./decodings";
import * as Codec from "@truffle/codec";

import { txs, getDecoding } from "./generate-decodings";

const App = () => {
  const [template, setTemplate] = useState(-1);
  const [txParams, setTxParams] = useState({});

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
      if (txParams && txParams.to) {
        const { decoding, definitions } = await getDecoding(txParams);
        setDefintions(definitions);

        const data = deserializeCalldataDecoding(decoding);
        console.log("Decoding: %o", data);

        setData(data);
      }
    })();
  }, [template, txParams]);

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
                  console.log("trying to click", i);
                  setTemplate(i);
                }}
              >
                {txs[i].desc}
              </button>
            );
          })}
        </div>
      </header>

      <main>
        {/* {data && definitions ? (
          <EthTxParams decoding={data} definitions={definitions}></EthTxParams>
        ) : (
          "Loading ..."
        )} */}
        {template >= 0 ? (
          <EthTxParams decoding={data} definitions={definitions}></EthTxParams>
        ) : (
          "Please select a tx to decode ! "
        )}
      </main>
    </div>
  );
};

export default App;
