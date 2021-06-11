import React from 'react';
import PropTypes from 'prop-types';
import * as Codec from '@truffle/codec';
import inspect from 'browser-util-inspect';
import './eth-tx-params.css';
import { Jazzicon } from '@ukstv/jazzicon-react';

const EthTxParams = ({
  decoding,
  definitions,
}) => {
  switch (decoding.kind) {
    case 'function':

      const {arguments: args, abi: { name } } = decoding;
      return (
        <div className="eth-tx-params">
          <div className="solidity-func-name">{ deCamelCase(name).toUpperCase() }</div>
          <ol>
            { args.map((argument, index) => {
              return renderNamedItem(argument?.name, argument.value, index)
            })}
          </ol>
          <footer>Powered by <a href="https://www.trufflesuite.com/docs/truffle/codec/index.html">Truffle Codec</a></footer>
        </div>
      )

    case 'constructor':
    default:
      return 'Unable to render function data';
  }
};

function renderNamedItem (name, item, index) {

  if (item.type.typeClass === 'struct') {
    return (<details key={index} open>
      <summary>{deCamelCase(name)}:</summary>
      <ol>
        {
          item.value.map(({ name, value: item }, index) => {
            return <li className="solidity-value" key={index}>
              {renderNamedItem(name, item, index)}
            </li>
          })
        }
      </ol>      
    </details>);
  }

  return (<div key={index} className="solidity-named-item solidity-item">
    <span className='param-name'>{ deCamelCase(name) }:</span>
    { renderItem(item) }
  </div>)
}

// Result can be a value or an error
// Result { type:SolidityVariableType , kind: ResultKindString }
function renderItem(item) {
  // Two discriminators: value or error
  switch (item.kind) {
    case "error":
      return "Malformed data";

    default:

      switch (item.type.typeClass) {

        case 'uint':
          return (<span className="sol-item solidity-uint">
            {item.value.asBN.toString()}
          </span>)

        case 'bytes':
          return (<span className="sol-item solidity-bytes">
            {item.value.asHex}
          </span>)

        case 'address':
          return (<span className="sol-item solidity-address">
            <Jazzicon address={item.value.asAddress}/>
            <span>{item.value.asAddress}</span>
          </span>) 

        default:
          console.log('item: %o', item)
          return (<pre className="sol-item solidity-raw">
            { inspect(new Codec.Format.Utils.Inspect.ResultInspector(item)) }
          </pre>)
      }
  }
}

function deCamelCase (label) {
  return label.replace(/([A-Z])/g, ",$1").toLowerCase().split(',').join(' ');
}

EthTxParams.propTypes = {
  name: PropTypes.string,
  args: PropTypes.arrayOf(),
  large: PropTypes.bool,
  rounded: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  icon: PropTypes.node,
};
           
export default EthTxParams;