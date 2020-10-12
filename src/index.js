// import $ from 'jquery'
import _ from 'lodash'
import _n from 'numeral'
import { Network, DataSet } from 'vis-network/standalone/umd/vis-network.min'
import { getCurrencies } from './currencies'
import './style.scss'

export function query(query) {
  return {
    query,
    variables: null,

    data: null,
    setData: function(data, expand = false) {
      if (expand) {
        //
      } else {
        this.data = data
      }

      //notify components
      _.each(this.components, (component) => {
        component.drawGraph()
      })
    },
    components: [],

    request: function(variables) {
      fetch('https://graphql.bitquery.io', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: this.query,
          variables,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          this.variables = variables
          this.setData(data['data'])
        })
    },
  }
}

export function address_graph(selector, query, options) {
  const container = document.querySelector(selector)
  $(container)
    .parent()
    .parent()
    .find('.card-header')
    .text(options.title || 'Default graph title')

  const networkOptions = {
    height: '600px',
    physics: {
      stabilization: {
        enabled: false,
        iterations: 10,
        onlyDynamicEdges: true,
      },
      barnesHut: {
        damping: 0.4,
        avoidOverlap: 0.1,
        springConstant: 0.09,
      },
    },
    groups: {
      smart_contract: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf013',
          weight: 900,
          size: 40,
          color: '#f0a30a',
        },
        font: {
          color: 'white',
        },
      },
      multisig: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf4d3',
          weight: 900,
          size: 40,
          color: '#03a9f4',
        },
        font: {
          color: 'white',
        },
      },
      address: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf007',
          weight: 900,
          size: 40,
          color: '#00dbb7',
        },
        font: {
          color: 'white',
        },
      },
      annotated_address: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf007',
          weight: 900,
          size: 40,
          color: '#00967b',
        },
        font: {
          background: '#00967b',
          color: 'white',
        },
      },
      token: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf51f',
          weight: 900,
          size: 40,
          color: '#ff5722',
        },
        font: {
          color: 'white',
        },
      },
      dex: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf021',
          weight: 900,
          size: 40,
          color: '#03a9f4',
        },
        font: {
          color: 'white',
        },
      },
      MarginPositionToken: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf1b2',
          weight: 900,
          size: 40,
          color: '#ff5722',
        },
        font: {
          color: 'white',
        },
      },
      coinbase: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf0ac',
          weight: 900,
          size: 40,
          color: '#03a9f4',
        },
        font: {
          color: 'white',
        },
      },
    },
  }

  const network = new Network(container, {}, networkOptions)

  // network.on('dragEnd', function(t) {
  //   _.each(t.nodes, function(node, i) {
  //     g.dataset.nodes.update({ id: node, physics: false })
  //   })
  // })

  function drawGraph() {
    const currencies = getCurrencies()
    const currency = (
      _.find(currencies, { address: query.variables.currency }) || currencies[0]
    ).symbol
    // const currency = 'Ether'

    function hashCode(data) {
      var string = JSON.stringify(data)
      if (Array.prototype.reduce) {
        return string.split('').reduce(function(a, b) {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0)
      }
      var hash = 0
      if (string.length === 0) return hash
      for (var i = 0; i < string.length; i++) {
        var character = string.charCodeAt(i)
        hash = (hash << 5) - hash + character
        hash = hash & hash
      }
      return hash
    }

    function prepareNodes(nodes) {
      function prepareNode(node) {
        if (node.address == '0x0000000000000000000000000000000000000000') {
          return {
            id: node.address,
            label: 'Coinbase',
            group: 'coinbase',
            title: node.address,
          }
        } else if (node.smartContract.contractType == 'Generic') {
          return {
            id: node.address,
            label: _.truncate(node.address, { length: 15, separator: '...' }),
            group: 'smart_contract',
            title: 'Smart Contract ' + node.address,
          }
        } else if (
          node.smartContract.contractType == 'Token' ||
          node.smartContract.contractType == 'TokenSale'
        ) {
          return {
            id: node.address,
            label:
              node.smartContract.currency.name +
              ' (' +
              node.smartContract.currency.symbol +
              ')',
            group: 'token',
            title:
              node.smartContract.currency.name +
              ' (' +
              node.smartContract.currency.symbol +
              ')' +
              ' ' +
              node.address,
          }
        } else if (node.smartContract.contractType == 'MarginPositionToken') {
          return {
            id: node.address,
            label:
              node.annotation ||
              _.truncate(node.address, { length: 15, separator: '...' }),
            group: 'MarginPositionToken',
            title: 'MarginPositionToken ' + node.address,
          }
        } else if (node.smartContract.contractType == 'Multisig') {
          return {
            id: node.address,
            label:
              node.annotation ||
              _.truncate(node.address, { length: 15, separator: '...' }),
            group: 'multisig',
            title: 'MultiSig Wallet ' + node.address,
          }
        } else if (node.smartContract.contractType == 'DEX') {
          return {
            id: node.address,
            label:
              node.annotation ||
              _.truncate(node.address, { length: 15, separator: '...' }),
            group: 'dex',
            title: 'DEX ' + node.address,
          }
        } else {
          return {
            id: node.address,
            label:
              node.annotation ||
              _.truncate(node.address, { length: 15, separator: '...' }),
            group: node.annotation ? 'annotated_address' : 'address',
            title: node.address,
          }
        }
      }

      let prepared = []
      _.each(nodes, function(node) {
        prepared.push(prepareNode(node.receiver))
        prepared.push(prepareNode(node.sender))
      })
      return prepared
    }

    function prepareEdges(edges, receiver = true) {
      function prepareEdge(edge) {
        let currency_name = currency
        let width = edge.amount > 1 ? 1.5 * Math.log10(edge.amount) + 1 : 1
        let value =
          parseFloat(edge.amount) <= 1e-6
            ? edge.amount
            : _n(edge.amount).format('0.0000a')

        let label = value + ' ' + currency_name

        if (receiver) {
          return {
            from: edge.sender.address,
            to: edge.receiver.address,
            arrows: 'to',
            label: label,
            color: { color: 'silver', highlight: '#ff5722' },
            font: {
              align: 'middle',
              multi: true,
              color: 'white',
              size: 8,
              strokeWidth: 2,
              strokeColor: 'black',
            },
            smooth: true,
            width: width,
            select_type: 'select_transfers',
            hidden: false,
            id: hashCode([
              'select_transfers',
              edge.sender.address,
              edge.receiver.address,
              label,
            ]),
          }
        } else {
          return {
            from: edge.sender.address,
            to: edge.receiver.address,
            arrows: 'to',
            label: label,
            color: { color: 'white', highlight: '#ff5722' },
            font: {
              align: 'middle',
              multi: true,
              color: 'white',
              size: 8,
              strokeWidth: 2,
              strokeColor: 'black',
            },
            smooth: true,
            width: width,
            select_type: 'select_transfers',
            hidden: false,
            id: hashCode([
              'select_transfers',
              edge.sender.address,
              edge.receiver.address,
              label,
            ]),
          }
        }
      }
      let prepared = []
      _.each(edges, function(edge) {
        prepared.push(prepareEdge(edge))
      })
      return prepared
    }

    const dataset = {
      nodes: new DataSet(
        _.uniqBy(
          prepareNodes(query.data.ethereum.inbound).concat(
            prepareNodes(query.data.ethereum.outbound)
          ),
          'id'
        )
      ),
      edges: new DataSet(
        _.uniqBy(
          prepareEdges(query.data.ethereum.inbound).concat(
            prepareEdges(query.data.ethereum.outbound, false)
          ),
          'id'
        )
      ),
    }

    network.setData(dataset)
  }

  if (query.data) {
    drawGraph()
  }

  const graph = {
    network,
    drawGraph: drawGraph,
    //
  }

  query.components.push(graph)
}
