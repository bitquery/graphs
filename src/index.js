// import $ from 'jquery'
import _ from 'lodash'
import _n from 'numeral'
import { Network, DataSet } from 'vis-network/standalone/umd/vis-network.min'
import { getCurrencies } from './currencies'
import { darkenColor } from './darkenColor'
import './style.scss'

export function query(query) {
  return {
    query,
    initVariables: {},

    data: null,
    setData: function(data, expand = false) {
      if (expand) {
        this.data.push(data)
      } else {
				this.data = [data]
				_.each(this.components, (component) => component.dataset = null)
      }

      //notify components
      _.each(this.components, (component) => {
        component.render()
      })
    },
    components: [],

    request: function(variables, expand = false) {
      fetch('https://graphql.bitquery.io', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: this.query,
          variables: _.defaults(variables, this.initVariables),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
					console.log(this.variables)
          if (data) {
            this.setData(data['data'], expand)
					}
					if (_.isEmpty(this.initVariables)) {
						this.initVariables = variables
					}
        })
    },
  }
}

export function address_graph(selector, query, options) {
  const currencies = getCurrencies()
  const currency = (
    _.find(currencies, { address: query.initVariables.currency }) || currencies[0]
  ).symbol
  // const currency = 'Ether'

  this.container = document.querySelector(selector)
  $(this.container)
    .parent()
    .parent()
    .find('.card-header')
    .text(options.title || 'Default graph title')

  this.networkOptions = {
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
          color: '#ffffff',
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
          color: '#ffffff',
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
          color: '#ffffff',
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
          color: '#ffffff',
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
          color: '#ffffff',
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
          color: '#ffffff',
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
          color: '#ffffff',
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
          color: '#ffffff',
        },
      },
    },
  }

  this.hashCode = (data) => {
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

  this.prepareNodes = (nodes) => {
    const prepareNode = (node) => {
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

    const prepared = []
    _.each(nodes, function(node) {
      prepared.push(prepareNode(node.receiver))
      prepared.push(prepareNode(node.sender))
    })
    return prepared
  }

  this.prepareEdges = (edges, receiver = true) => {
    const prepareEdge = (edge) => {
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
            color: '#ffffff',
            size: 8,
            strokeWidth: 2,
            strokeColor: 'black',
          },
          smooth: true,
          width: width,
          select_type: 'select_transfers',
          hidden: false,
          id: this.hashCode([
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
          color: { color: '#ffffff', highlight: '#ff5722' },
          font: {
            align: 'middle',
            multi: true,
            color: '#ffffff',
            size: 8,
            strokeWidth: 2,
            strokeColor: 'black',
          },
          smooth: true,
          width: width,
          select_type: 'select_transfers',
          hidden: false,
          id: this.hashCode([
            'select_transfers',
            edge.sender.address,
            edge.receiver.address,
            label,
          ]),
        }
      }
    }
    const prepared = []
    _.each(edges, function(edge) {
      prepared.push(prepareEdge(edge))
    })
    return prepared
  }

  this.setDataset = () => {
    if (!this.dataset) {
      this.dataset = {
        nodes: new DataSet(
          _.uniqBy(
            this.prepareNodes(query.data[0].ethereum.inbound).concat(
              this.prepareNodes(query.data[0].ethereum.outbound)
            ),
            'id'
          )

          // _.uniqBy(
          //   _.reduce(
          //     query.data,
          //     (sum, d) => {
          //       return sum.concat(
          //         this.prepareNodes(d.ethereum.inbound).concat(
          //           this.prepareNodes(d.ethereum.outbound)
          //         )
          //       )
          //     },
          //     []
          //   ),
          //   'id'
          // )
        ),
        edges: new DataSet(
          _.uniqBy(
            this.prepareEdges(query.data[0].ethereum.inbound).concat(
              this.prepareEdges(query.data[0].ethereum.outbound, false)
            ),
            'id'
          )

          // _.uniqBy(
          //   _.reduce(
          //     query.data,
          //     (sum, d) => {
          //       return sum.concat(
          //         this.prepareEdges(d.ethereum.inbound).concat(
          //           this.prepareEdges(d.ethereum.outbound, false)
          //         )
          //       )
          //     },
          //     []
          //   ),
          //   'id'
          // )
        ),
      }
    } else {
      _.each(
        _.uniqBy(
          this.prepareNodes(
            query.data[query.data.length - 1].ethereum.inbound
          ).concat(
            this.prepareNodes(
              query.data[query.data.length - 1].ethereum.outbound
            )
          ),
          'id'
        ),
        (node) => {
          if (!this.dataset.nodes.get(node.id)) {
            this.dataset.nodes.add(node)
          }
        }
      )
      _.each(
        _.uniqBy(
          this.prepareEdges(
            query.data[query.data.length - 1].ethereum.inbound
          ).concat(
            this.prepareEdges(
              query.data[query.data.length - 1].ethereum.outbound,
              false
            )
          ),
          'id'
        ),
        (edge) => {
          if (!this.dataset.edges.get(edge.id)) {
            this.dataset.edges.add(edge)
          }
        }
      )
    }
  }

  this.expand = (address) => {
    const node = this.dataset.nodes.get(address)
    if (!node.expanded) {
			node.expanded = true
			const group = node.group
      const prevColor = this.network.groups.groups[group].icon.color
      node.icon = {
        color: darkenColor(prevColor, 25),
      }
      this.dataset.nodes.update(node)
      query.request({ address: address }, true)
    }
  }

  this.detailLevel = (limit) => {
    const container = $(this.container)
    const graphDetailLevel = $(
      '<div><span>Detail level</span>' +
        '<div><i class="fas fa-th-large"></i> <input type="range" min="1" max="100" step="1" value="' +
        limit +
        '" title="Detail level"> <i class="fas fa-th"></i></div>' +
        '</div>'
    )
    container.append(graphDetailLevel)
    graphDetailLevel.css({
      position: 'absolute',
      top: '20px',
      right: '20px',
      maxWidth: '60%',
    })
    graphDetailLevel.find('input').val(query.initVariables.limit)

    const val = $(
      '<div style="width:40px;height:25px;position:absolute;border:1px solid black; text-align:center"></div>'
    )
    graphDetailLevel
      .find('input')
      .on('mousedown', function(e) {
        $('body').append(val)
        val.css({ left: e.pageX - 20, top: e.pageY - 40 })
        val.html($(this).val())
        $(this).on('mousemove', function(e) {
          let it = $(this)
          val.css({ left: e.pageX - 20, top: e.pageY - 40 })
          val.html($(this).val())
        })
      })
      .on('mouseup', function(e) {
        val.remove()
        $(this).off('mousemove')
      })

    graphDetailLevel.find('input').on('change', function() {
      let it = $(this)
      query.request({
        limit: parseInt(it.val()),
      })
    })
  }

  this.initGraph = () => {
    this.setDataset()

    this.network = new Network(
      this.container,
      this.dataset,
      this.networkOptions
		)
		
		const rootNode = this.dataset.nodes.get(query.initVariables.address)
		rootNode.physics = false
		rootNode.expanded = true
		this.dataset.nodes.update(rootNode)

    this.network.on('dragEnd', (params) => {
      const nodeId = params.nodes[0]
      const clickedNode = this.dataset.nodes.get(nodeId)
      clickedNode.physics = false
      this.dataset.nodes.update(clickedNode)
    })

    this.network.on('doubleClick', (params) => {
      this.expand(params.nodes[0])
      // const group = clickedNode.group
      // const prevColor = this.network.groups.groups[group].icon.color
      // clickedNode.icon = {
      //   color: darkenColor(prevColor, 25),
      // }

      // this.dataset.nodes.update(clickedNode)
      // for testing
      // window.clickedNode = clickedNode
    })

    this.detailLevel(query.initVariables.limit)
  }

  this.render = () => {
    if (!this.network) {
      this.initGraph()
    } else {
      this.setDataset()
    }
  }

  query.components.push(this)
}
