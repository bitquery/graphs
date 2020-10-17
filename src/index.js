import _ from 'lodash'
import _n from 'numeral'
import { Network, DataSet } from 'vis-network/standalone/umd/vis-network.min'
import { LineLoader } from './components/LineLoader'
import { CurrencyFilter } from './components/CurrencyFilter'
import { CurrencyFilterOption } from './components/CurrencyFilterOption'
import { DetailLevel } from './components/DetailLevel'
import { DetailLevelPopup } from './components/DetailLevelPopup'
import { FullscreenButton } from './components/FullscreenButton'
import { darkenColor } from './darkenColor'
import './style.scss'

export function query(query) {
  return {
    query,
    variables: {},

    data: null,
    setData: function(data, isExpand) {
      this.data = data
      this.cryptoCurrency = _.keys(data)[0]
      //notify components
      _.each(this.components, (component) => {
        component.render(isExpand)
      })
    },
    components: [],

    request: function(variables, isExpand = false, refresh = true) {
      if (!_.isEmpty(this.variables)) {
        this.loading = true
        this.addLoader()
      }

      fetch('https://graphql.bitquery.io', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: this.query,
          variables: _.defaults(variables, this.variables),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (_.isEmpty(this.variables)) {
            this.variables = variables
					}
					
					if (refresh) _.merge(this.variables, variables)
          if (this.loading) {
            this.loading = false
            this.removeLoader()
          }
          this.setData(data['data'], isExpand)
        })
    },

    addLoader: function() {
      _.each(this.components, (component) => {
        $(component.container)
          .parent()
          .prepend(`<div class="request-loader"></div>`)
        $(component.container).addClass('loading')
      })
    },

    removeLoader: function() {
      _.each(this.components, (component) => {
        $('.request-loader').remove()
        $(component.container).removeClass('loading')
      })
    },
  }
}

export function address_graph(selector, query, options) {
  const g = {}

  g.container = document.querySelector(selector)
  const jqContainer = $(g.container)
  jqContainer.wrap('<div id="wrapper" class="wrapper">')
  // a trick for the icons in the graph to be loaded
  jqContainer.append(
    '<i class="fa fa-flag" style="visibility:hidden;position:absolute;"></i>'
  )
  const jqWrapper = $('#wrapper')

  g.theme = options.theme || 'light'

  if (options.theme == 'dark') {
    jqContainer
      .parents('div')
      .find('.card')
      .addClass('dark')
  }

  jqContainer
    .parents('div')
    .find('.card-header')
    .text(options.title || 'Default graph title')

  {
    jqWrapper.addClass('initializing')
    const loading = $(LineLoader())
    jqContainer.append(loading)
    const line = $('.line-loader__line')
    let i = 1
    const interval = setInterval(function() {
      if (i > Math.floor(Math.random() * 15) + 84) {
        clearInterval(interval)
      }
      line.width(i + '%')
      i = i + 1
    }, 40)
  }
	
  g.networkOptions = {
    height: '100%',
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
          color: g.theme == 'dark' ? 'white' : 'black',
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
          color: g.theme == 'dark' ? 'white' : 'black',
        },
      },
      address: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf007',
          weight: 900,
          size: 40,
          color: g.theme == 'dark' ? '#00dbb7' : '#009688',
        },
        font: {
          color: g.theme == 'dark' ? 'white' : 'black',
        },
      },
      annotated_address: {
        shape: 'icon',
        icon: {
          face: '"Font Awesome 5 Free"',
          code: '\uf007',
          weight: 900,
          size: 40,
          color: g.theme == 'dark' ? '#00967b' : '#006650',
        },
        font: {
          background: g.theme == 'dark' ? '#00967b' : '#006650',
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
          color: g.theme == 'dark' ? 'white' : 'black',
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
          color: g.theme == 'dark' ? 'white' : 'black',
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
          color: g.theme == 'dark' ? 'white' : 'black',
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
          color: g.theme == 'dark' ? 'white' : 'black',
        },
      },
    },
  }

  g.setCurrency = (value) => {
    if (options.currency) {
			// Bitcoin
			g.currencies = []
      g.currency = options.currency
    } else if (options.currencies.length > 0) {
			g.currencies = options.currencies
      if (options.network == 'algorand') {
        g.currency = (
          _.find(g.currencies, { token_id: value || query.variables.currency + '' }) ||
          g.currencies[0] || { symbol: value || query.variables.currency }
        ).symbol
      } else if (
        options.network == 'bsc' ||
        options.network == 'bsc_testnet' ||
        options.network == 'binance'
      ) {
        // Binance
        g.currency = (
          _.find(g.currencies, { token_id: value || query.variables.currency }) ||
          g.currencies[0]
        ).symbol
      } else if (options.network == 'eos') {
        g.currency = (
          _.find(g.currencies, { address: value || query.variables.currency }) ||
          g.currencies[0]
        ).symbol
      } else if (options.network == 'tron') {
        g.currency = (
          _.find(g.currencies, { token_id: value || query.variables.currency }) ||
          _.find(g.currencies, { address: value || query.variables.currency }) ||
          g.currencies[0]
        ).symbol
      } else {
        // Conflux, Ethereum, Libra
        g.currency = (
          _.find(g.currencies, { address: value || query.variables.currency }) ||
          g.currencies[0]
        ).symbol
      }
    }
	}

  g.hashCode = (data) => {
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

  g.prepareNodes = (nodes) => {
    const prepareNode = (node) => {
      if (!node.smartContract) {
        if (node.address == '') {
          return {
            id: node.address,
            label: 'Coinbase',
            group: 'coinbase',
            title: node.address,
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
      } else if (node.address == '0x0000000000000000000000000000000000000000') {
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

  g.prepareEdges = (edges, receiver = true) => {
    const prepareEdge = (edge) => {
      let currency_name = g.currency
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
          color: {
            color: g.theme == 'dark' ? 'silver' : 'grey',
            highlight: '#ff5722',
          },
          font: {
            align: 'middle',
            multi: true,
            color: g.theme == 'dark' ? 'white' : 'black',
            size: 8,
            strokeWidth: 2,
            strokeColor: g.theme == 'dark' ? 'black' : 'white',
          },
          smooth: true,
          width: width,
          select_type: 'select_transfers',
          hidden: false,
          id: g.hashCode([
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
          color: {
            color: g.theme == 'dark' ? 'white' : 'black',
            highlight: '#ff5722',
          },
          font: {
            align: 'middle',
            multi: true,
            color: g.theme == 'dark' ? 'white' : 'black',
            size: 8,
            strokeWidth: 2,
            strokeColor: g.theme == 'dark' ? 'black' : 'white',
          },
          smooth: true,
          width: width,
          select_type: 'select_transfers',
          hidden: false,
          id: g.hashCode([
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

  g.setDataset = () => {
    if (!g.dataset) {
      g.dataset = {
        nodes: new DataSet(),
        edges: new DataSet(),
      }
    }
    g.dataset.nodes.clear()
    g.dataset.edges.clear()
    _.each(
      _.uniqBy(
        g
          .prepareNodes(query.data[query.cryptoCurrency].inbound)
          .concat(g.prepareNodes(query.data[query.cryptoCurrency].outbound)),
        'id'
      ),
      (node) => {
        g.dataset.nodes.add(node)
      }
    )
    _.each(
      _.uniqBy(
        g
          .prepareEdges(query.data[query.cryptoCurrency].inbound)
          .concat(
            g.prepareEdges(query.data[query.cryptoCurrency].outbound, false)
          ),
        'id'
      ),
      (edge) => {
        g.dataset.edges.add(edge)
      }
    )
  }

  g.editRootNode = () => {
    if (g.dataset.nodes.length == 0) return
    const rootNode = g.dataset.nodes.get(query.variables.address)
    rootNode.physics = false
    rootNode.expanded = true
    const rootNodeGroup = rootNode.group
    const rootNodePrevColor = g.network.groups.groups[rootNodeGroup].icon.color
    rootNode.icon = {
      color: darkenColor(rootNodePrevColor, 25),
    }
    g.dataset.nodes.update(rootNode)
  }

  g.expandDataset = () => {
    _.each(
      _.uniqBy(
        g
          .prepareNodes(query.data[query.cryptoCurrency].inbound)
          .concat(g.prepareNodes(query.data[query.cryptoCurrency].outbound)),
        'id'
      ),
      (node) => {
        if (!g.dataset.nodes.get(node.id)) {
          g.dataset.nodes.add(node)
        }
      }
    )
    _.each(
      _.uniqBy(
        g
          .prepareEdges(query.data[query.cryptoCurrency].inbound)
          .concat(
            g.prepareEdges(query.data[query.cryptoCurrency].outbound, false)
          ),
        'id'
      ),
      (edge) => {
        if (!g.dataset.edges.get(edge.id)) {
          g.dataset.edges.add(edge)
        }
      }
    )
  }

  g.expand = (address) => {
    const node = g.dataset.nodes.get(address)
    if (!node.expanded) {
      node.expanded = true
      const group = node.group
      const prevColor = g.network.groups.groups[group].icon.color
      node.icon = {
        color: darkenColor(prevColor, 25),
      }
      g.dataset.nodes.update(node)
      query.request({ address: address }, true, false)
    }
  }

  g.detailLevel = (limit) => {
    const graphDetailLevel = $(DetailLevel(limit))
    const val = $(DetailLevelPopup(g.theme))

    jqContainer.append(graphDetailLevel)

    graphDetailLevel.find('input').val(query.variables.limit)

    graphDetailLevel
      .find('input')
      .on('mousedown', function(e) {
        $('body').append(val)
        val.css({ left: e.pageX - 20, top: e.pageY - 40 })
        val.html($(this).val())
        $(this).on('mousemove', function(e) {
          val.css({ left: e.pageX - 20 })
          val.html($(this).val())
        })
      })
      .on('mouseup', function(e) {
        val.remove()
        $(this).off('mousemove')
      })

    graphDetailLevel.find('input').on('change', function(e) {
      const variables = {
        limit: parseInt($(this).val()),
      }
      // _.merge(query.variables, variables)
      query.request(variables)
    })
  }

  g.currencyFilter = () => {
    if (g.currencies.length == 0) return
    const select = $(CurrencyFilter())
    _.each(g.currencies, function(c) {
      let value
      if (options.network == 'algorand') {
        value = c.token_id
      } else if (
        options.network == 'bsc' ||
        options.network == 'bsc_testnet' ||
        options.network == 'binance'
      ) {
				// Binance
				// value = c.token_id === '-' ? c.symbol : c.token_id
        value = c.address === '-' ? c.symbol : c.token_id
      } else if (options.network == 'eos') {
        value = c.address
      } else if (options.network == 'tron') {
        if (c.token_id == '0' && c.address == '-') {
          value = c.symbol
        } else if (c.token_id == '0') {
          value = c.address
        } else {
          value = c.token_id
        }
      } else {
        // Conflux, Ethereum, Libra
        value = c.address === '-' ? c.symbol : c.address
      }
      select
        .find('select')
        .append(
          CurrencyFilterOption(
            value,
            query.variables.currency,
            c.name,
            c.symbol
          )
        )
    })
    jqContainer.append(select)

    select.find('select').on('change', function() {
      let currencyAddress = $(this).val()
			g.setCurrency(currencyAddress)
      if (options.network && options.network.toLowerCase() == 'algorand') {
        currencyAddress = parseInt(currencyAddress)
      }

      query.request({
        network: query.variables.network,
				address: query.variables.address,
				currency: currencyAddress,
      })
    })
	}
	
	g.refreshCurrencyFilter = () => {
		jqContainer.find('.currency-filter').remove()
		g.currencyFilter()
	}

  g.fullScreen = () => {
    const fullScreenButton = $(
      FullscreenButton(jqContainer.hasClass('fullscreen'))
    )
    jqContainer.append(fullScreenButton)

    fullScreenButton.find('.fullscreen-button__icon').on('click', function() {
      const icon = $(this)
      $('#wrapper').toggleClass('fullscreen')
      icon.toggleClass('fa-expand')
      icon.toggleClass('fa-compress')
    })
  }

  g.initGraph = () => {
		jqWrapper.removeClass('initializing')
		g.setCurrency()
    g.setDataset()

    g.network = new Network(g.container, g.dataset, g.networkOptions)

    g.editRootNode()

    g.network.on('dragEnd', (params) => {
      const nodeId = params.nodes[0]
      const clickedNode = g.dataset.nodes.get(nodeId)
      clickedNode.physics = false
      g.dataset.nodes.update(clickedNode)
    })

    g.network.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        g.expand(params.nodes[0])
      }
    })

    // g.network.once('stabilized', function() {
    // 	g.network.fit({animation: { duration: 500, easingFunction: 'easeInOutQuart' }})
    // })

    g.detailLevel(query.variables.limit)
    g.currencyFilter()
    g.fullScreen()
  }

  g.render = (isExpand) => {
    // plug if graph is empty
    // if (query.data[_.keys(query.data)[0]].inbound.length == 0 && query.data[_.keys(query.data)[0]].outbound.length == 0) return
    if (!g.dataset) {
      g.initGraph()
    } else if (!isExpand) {
			g.refreshCurrencyFilter()
			g.setCurrency()
      g.setDataset()
      g.editRootNode()
    } else {
      g.expandDataset()
    }
  }

  query.components.push(g)
  return g
}
