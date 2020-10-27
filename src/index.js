import _ from 'lodash'
import _n from 'numeral'
import { Network, DataSet } from '../node_modules/vis'
import { addInitializingLoader } from './addInitializingLoader'
import { CurrencyFilter } from './components/CurrencyFilter'
import { CurrencyFilterOption } from './components/CurrencyFilterOption'
import { DetailLevel } from './components/DetailLevel'
import { DetailLevelPopup } from './components/DetailLevelPopup'
import { addFullScreenButton } from './addFullScreenButton'
import { lightenOrDarkenColor } from './lightenOrDarkenColor'
import { addModalJS } from './addModalJS'
import { addModalGraphQL } from './addModalGraphQL'
import './style.scss'

export function query(query) {
  return {
    query: query.trim(),
    variables: {},

    data: null,
    setData: function(data, isExpand) {
      this.data = data
      this.cryptoCurrency = _.keys(data)[0]

      _.each(this.components, (component) => {
        component.render(isExpand)
      })
    },
    components: [],

		url: 'https://graphql.bitquery.io',
    request: function(variables, isExpand = false, refresh = true) {
      if (!_.isEmpty(this.variables)) {
        this.loading = true
        this.addLoader()
      }

      fetch(this.url, {
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
	
	g.JSCode = jqContainer.parents('.row')[0].outerHTML.replace(/queryWithTimeRange\(.*\)/, `query.request({})`)

  jqContainer.wrap('<div id="wrapper" class="wrapper">')
  // a trick for the icons in the graph to be loaded
  jqContainer.append(
    '<i class="fa fa-flag" style="visibility:hidden;position:absolute;"></i>'
  )
  const jqWrapper = $('#wrapper')

  g.theme = options.theme || 'light'

  if (g.theme == 'dark') {
    jqContainer
      .parents('div')
      .find('.card')
      .addClass('dark')
  }

  jqContainer
    .parents('div')
    .find('.card-header')
    .text(options.title || 'Default graph title')

  addInitializingLoader(jqWrapper, jqContainer)

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
          _.find(g.currencies, {
            token_id: value || query.variables.currency + '',
          }) ||
          g.currencies[0] || { symbol: value || query.variables.currency }
        ).symbol
      } else if (
        options.network == 'bsc' ||
        options.network == 'bsc_testnet' ||
        options.network == 'binance'
      ) {
        // Binance
        g.currency = (
          _.find(g.currencies, {
            token_id: value || query.variables.currency,
          }) || g.currencies[0]
        ).symbol
      } else if (options.network == 'eos') {
        g.currency = (
          _.find(g.currencies, {
            address: value || query.variables.currency,
          }) || g.currencies[0]
        ).symbol
      } else if (options.network == 'tron') {
        g.currency = (
          _.find(g.currencies, {
            token_id: value || query.variables.currency,
          }) ||
          _.find(g.currencies, {
            address: value || query.variables.currency,
          }) ||
          g.currencies[0]
        ).symbol
      } else {
        // Conflux, Ethereum, Libra
        g.currency = (
          _.find(g.currencies, {
            address: value || query.variables.currency,
          }) || g.currencies[0]
        ).symbol
      }
    } else {
      g.currencies = []
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
      if (node.address == '0x0000000000000000000000000000000000000000') {
        // 'coinbase'
        return {
          id: node.address,
          label: 'Coinbase',
          title: node.address,
          shape: 'icon',
          icon: {
            face: 'FontAwesome',
            code: '\uf0ac',
            weight: 900,
            size: 40,
            color: '#03a9f4',
          },
          font: {
            color: g.theme == 'dark' ? 'white' : 'black',
          },
        }
      } else if (
        node.smartContract &&
        node.smartContract.contractType == 'Generic'
      ) {
        // 'smart_contract'
        return {
          id: node.address,
          label: _.truncate(node.address, { length: 15, separator: '...' }),
          title: 'Smart Contract ' + node.address,
          shape: 'icon',
          icon: {
            face: 'FontAwesome',
            code: '\uf013',
            weight: 900,
            size: 40,
            color: '#f0a30a',
          },
          font: {
            color: g.theme == 'dark' ? 'white' : 'black',
          },
        }
      } else if (
        node.smartContract &&
        (node.smartContract.contractType == 'Token' ||
          node.smartContract.contractType == 'TokenSale')
      ) {
        // 'token'
        return {
          id: node.address,
          label:
            node.smartContract.currency.name +
            ' (' +
            node.smartContract.currency.symbol +
            ')',
          title:
            node.smartContract.currency.name +
            ' (' +
            node.smartContract.currency.symbol +
            ')' +
            ' ' +
            node.address,
          shape: 'icon',
          icon: {
            face: 'FontAwesome',
            code: '\uf51f',
            weight: 900,
            size: 40,
            color: '#ff5722',
          },
          font: {
            color: g.theme == 'dark' ? 'white' : 'black',
          },
        }
      } else if (
        node.smartContract &&
        node.smartContract.contractType == 'MarginPositionToken'
      ) {
        // 'MarginPositionToken'
        return {
          id: node.address,
          label:
            node.annotation ||
            _.truncate(node.address, { length: 15, separator: '...' }),
          title: 'MarginPositionToken ' + node.address,
          shape: 'icon',
          icon: {
            face: 'FontAwesome',
            code: '\uf1b2',
            weight: 900,
            size: 40,
            color: '#ff5722',
          },
          font: {
            color: g.theme == 'dark' ? 'white' : 'black',
          },
        }
      } else if (
        node.smartContract &&
        node.smartContract.contractType == 'Multisig'
      ) {
        return {
          // 'multisig'
          id: node.address,
          label:
            node.annotation ||
            _.truncate(node.address, { length: 15, separator: '...' }),
          title: 'MultiSig Wallet ' + node.address,
          shape: 'icon',
          icon: {
            face: 'FontAwesome',
            code: '\uf4d3',
            weight: 900,
            size: 40,
            color: '#03a9f4',
          },
          font: {
            color: g.theme == 'dark' ? 'white' : 'black',
          },
        }
      } else if (
        node.smartContract &&
        node.smartContract.contractType == 'DEX'
      ) {
        // 'dex'
        return {
          id: node.address,
          label:
            node.annotation ||
            _.truncate(node.address, { length: 15, separator: '...' }),
          title: 'DEX ' + node.address,
          shape: 'icon',
          icon: {
            face: 'FontAwesome',
            code: '\uf021',
            weight: 900,
            size: 40,
            color: '#03a9f4',
          },
          font: {
            color: g.theme == 'dark' ? 'white' : 'black',
          },
        }
      } else {
        if (node.address == '') {
          // 'coinbase'
          return {
            id: node.address,
            label: 'Coinbase',
            title: node.address,
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf0ac',
              weight: 900,
              size: 40,
              color: '#03a9f4',
            },
            font: {
              color: g.theme == 'dark' ? 'white' : 'black',
            },
          }
        } else if (node.annotation) {
          // 'annotated_address'
          return {
            id: node.address,
            label: node.annotation,
            title: node.address,
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf007',
              weight: 900,
              size: 40,
              color: g.theme == 'dark' ? '#00967b' : '#009183',
            },
            font: {
              background: g.theme == 'dark' ? '#00967b' : '#009183',
              color: '#ffffff',
            },
          }
        } else {
          // 'address'
          return {
            id: node.address,
            label: _.truncate(node.address, { length: 15, separator: '...' }),
            title: node.address,
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf007',
              weight: 900,
              size: 40,
              color: g.theme == 'dark' ? '#009b77' : '#009688',
            },
            font: {
              color: g.theme == 'dark' ? 'white' : 'black',
            },
          }
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
            strokeWidth: 4,
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
            strokeWidth: 4,
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

  g.expandNode = (address) => {
    const node = g.dataset.nodes.get(address)
    if (!node.expanded) {
      node.expanded = true
			const prevColor = node.icon.color
			node.physics = false
      node.icon = {
        color: lightenOrDarkenColor(prevColor, 20, g.theme == 'dark'),
      }
      if (g.theme == 'dark') {
        node.shadow = {
          enabled: true,
          color: prevColor,
          size: 20,
          x: 0,
          y: 0,
        }
      }

      g.dataset.nodes.update(node)
    }
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
      g.expandNode(address)
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
	
	g.editDetailLevel = (limit) => {
		$('.detail-level__input').val(limit)
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
	
	g.createBottomMenu = (buttons) => {
		const menu = $(`
			<div class="graph-bottom-menu"></div>
		`)
		jqContainer.append(menu)

		addFullScreenButton(menu)

		if (buttons && buttons.length > 0) {
			const buttonsBlock = $(`<div class="graph-bottom-menu__buttons"></div>`)
			menu.append(buttonsBlock)

			if (_.includes(buttons, 'JS')) {
				addModalJS(buttonsBlock, g.JSCode, options, query)
			}
			if (_.includes(buttons, 'GraphQL')) {
				addModalGraphQL(buttonsBlock, options, query)
			}
		}
	}

  g.initGraph = () => {
    jqWrapper.removeClass('initializing')
    g.setCurrency()
    g.setDataset()

    g.network = new Network(g.container, g.dataset, g.networkOptions)


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
		
		if (g.dataset.nodes.length == 0) return

    g.expandNode(query.variables.address)

    g.detailLevel(query.variables.limit)
    g.currencyFilter()
		g.createBottomMenu(options.buttons)
  }

  g.render = (isExpand) => {
    // plug if graph is empty
    // if (query.data[_.keys(query.data)[0]].inbound.length == 0 && query.data[_.keys(query.data)[0]].outbound.length == 0) return
    if (!g.dataset) {
      g.initGraph()
    } else if (!isExpand) {
      g.refreshCurrencyFilter()
			g.setCurrency()
			g.editDetailLevel(query.variables.limit)
      g.setDataset()
      g.expandNode(query.variables.address)
    } else {
      g.expandDataset()
    }
  }

  query.components.push(g)
  return g
}
