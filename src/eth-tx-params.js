import React from 'react';
import PropTypes from 'prop-types';
import * as Codec from '@truffle/codec';
import inspect from 'browser-util-inspect';
import './eth-tx-params.css';
import { Jazzicon } from '@ukstv/jazzicon-react';

const EthTxParams = ({
  decoding,
}) => {
  console.dir(decoding); 
  switch (decoding.kind) {
    case 'function':

      const { arguments: args, abi: { name } } = decoding;
      return (
        <div className="eth-tx-params">
          <h2>{ name }</h2>
          <ol>
            { args.map((argument, index) => {
              return renderNamedItem(argument?.name, argument.value, index)
            })}
          </ol>
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
      <summary>{name}</summary>
      <ol>
        {
          item.value.map(({ name, value: item }, index) => {
            return <li>
              {renderNamedItem(name, item, index)}
            </li>
          })
        }
      </ol>      
    </details>);
  }

  return (<div key={index} className="solidity-named-item solidity-item">
    <span className='param-name'>{ name }</span>
    { renderItem(item) }
  </div>)
}

function renderUnnamedItem (item, index) {
  return (<div key={index} className="solidity-unnamed-item solidity-item">
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
          return (<span className="solidity-uint">
            {item.value.asBN.toString()}
          </span>)

        case 'bytes':
          return (<span className="solidity-bytes">
            {item.value.asHex}
          </span>)

        case 'address':
          return (<span className="solidity-address">
            <Jazzicon address={item.value.asAddress}/>
          </span>) 

        default:
          console.log('item: %o', item)
          return (<pre className="solidity-raw">
            { inspect(new Codec.Format.Utils.Inspect.ResultInspector(item)) }
          </pre>)
      }
  }
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