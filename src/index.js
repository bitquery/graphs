import _ from 'lodash'
import _n from 'numeral'
import { setNumeralLocale } from './util/setNumeralLocale'

import { Network, DataSet, nl_NL } from '../node_modules/vis'
import { addInitializingLoader } from './addInitializingLoader'
import { CurrencyFilter } from './components/CurrencyFilter'
import { CurrencyFilterOption } from './components/CurrencyFilterOption'
import { DetailLevel } from './components/DetailLevel'
import { DetailLevelPopup } from './components/DetailLevelPopup'
import { DepthLevel } from './components/DepthLevel'
import { addFullScreenButton } from './addFullScreenButton'
import { lightenOrDarkenColor } from './util/lightenOrDarkenColor'
import { addModalJS } from './addModalJS'
import { addModalGraphQL } from './addModalGraphQL'

import * as d3 from 'd3'
// import * as d3Sankey from 'd3-sankey-circular'
import * as d3Sankey from '../../d3-sankey-circular/dist/d3-sankey-circular'
import * as d3PathArrows from 'd3-path-arrows'
import uid from './util/uid'

import './style.scss'
import { path } from 'd3'

setNumeralLocale(_n)

export function query(query) {
  return {
    query: query.trim(),
    variables: {},

    data: null,
    setData: function(data, isExpand) {
      this.data = data
      this.cryptoCurrency = _.keys(data)[0]

      _.each(this.controls, (controls) => {
        controls.refresh()
      })
      _.each(this.components, (component) => {
        component.g.render(isExpand)
      })
    },
    components: [],
    controls: [],

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
            this.currency = variables.currency || variables.network
          }
          this.currencyType = typeof variables.currency
          this.currentAddress = variables.address
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
        $(component.g.container)
          .parent()
          .prepend(`<div class="request-loader"></div>`)
        $(component.g.container).addClass('loading')
      })
    },

    removeLoader: function() {
      _.each(this.components, (component) => {
        $('.request-loader').remove()
        $(component.g.container).removeClass('loading')
      })
    },
  }
}

export function address_graph(selector, query, options) {
  const g = {}

  g.container = document.querySelector(selector)
  const jqContainer = $(g.container)

  query.JSCode
    ? null
    : (query.JSCode = jqContainer
        .parents('.row')[0]
        .outerHTML.replace(/queryWithTimeRange\(.*\)/, `query.request({})`)
        .replace(
          /<script>/,
          `  <link rel="stylesheet" media="all" href="https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.css">
  <script src="https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.js"></script>
  <script>`
        ))

  jqContainer.addClass('graph')
  jqContainer.wrap('<div class="wrapper">')
  const jqWrapper = jqContainer.parent('.wrapper')

  // a trick for the icons in the graph to be loaded
  jqContainer.append(
    '<i class="fa fa-flag" style="visibility:hidden;position:absolute;"></i>'
  )

  g.theme = options.theme || 'light'

  if (g.theme == 'dark') {
    jqContainer.parents('.card').addClass('dark')
  }

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
    interaction: {
      hover: true,
      hoverConnectedEdges: false,
    },
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
      let currency_name = query.currency
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

  g.initGraph = () => {
    jqWrapper.removeClass('initializing')
    g.setDataset()

    g.network = new Network(g.container, g.dataset, g.networkOptions)

    g.network.on('dragStart', function(params) {
      if (params.nodes.length != 0) {
        g.network.canvas.body.container.style.cursor = 'grabbing'
      } else {
        g.network.canvas.body.container.style.cursor = 'move'
      }
    })

    g.network.on('dragEnd', (params) => {
      if (params.nodes.length != 0) {
        g.network.canvas.body.container.style.cursor = 'grab'
      } else {
        g.network.canvas.body.container.style.cursor = 'default'
      }
      const nodeId = params.nodes[0]
      const clickedNode = g.dataset.nodes.get(nodeId)
      clickedNode.physics = false
      g.dataset.nodes.update(clickedNode)
    })

    g.network.on('hold', function(params) {
      if (params.nodes.length != 0) {
        g.network.canvas.body.container.style.cursor = 'grabbing'
      } else {
        g.network.canvas.body.container.style.cursor = 'move'
      }
    })

    g.network.on('release', function(params) {
      if (params.nodes.length != 0) {
        g.network.canvas.body.container.style.cursor = 'grabbing'
      } else {
        g.network.canvas.body.container.style.cursor = 'default'
      }
    })

    g.network.on('hoverNode', function(params) {
      g.network.canvas.body.container.style.cursor = 'grab'
    })

    g.network.on('blurNode', function(params) {
      g.network.canvas.body.container.style.cursor = 'default'
    })

    g.network.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        g.network.canvas.body.container.style.cursor = 'grab'
        g.expand(params.nodes[0])
      }
    })

    g.network.on('oncontext', function(params) {
      event.preventDefault()
      let nodeId = g.network.getNodeAt(params.pointer.DOM)
      if (nodeId) {
        let node = g.dataset.nodes.get(nodeId)
        const pathname = window.location.pathname.slice(1)
        window.open(
          `${window.location.origin}/${pathname.slice(
            0,
            pathname.indexOf('/')
          )}/address/${node.id}`,
          '_blank'
        )
      }
    })

    if (g.dataset.nodes.length == 0) return

    g.expandNode(query.variables.address)

    // g.detailLevel(query.variables.limit)
    // g.currencyFilter()
    // g.createBottomMenu(options.buttons)
  }

  g.render = (isExpand) => {
    // plug if graph is empty
    // if (query.data[_.keys(query.data)[0]].inbound.length == 0 && query.data[_.keys(query.data)[0]].outbound.length == 0) return
    if (!g.dataset) {
      g.initGraph()
    } else if (!isExpand) {
      g.setDataset()
      g.expandNode(query.variables.address)
    } else {
      g.expandDataset()
    }
  }

  query.components.push({
    id: selector,
    g,
  })
  return g
}

export function address_sankey(selector, query, options) {
  const g = {}

  g.container = document.querySelector(selector)
  const jqContainer = $(g.container)

  query.JSCode
    ? null
    : (query.JSCode = jqContainer
        .parents('.row')[0]
        .outerHTML.replace(/queryWithTimeRange\(.*\)/, `query.request({})`)
        .replace(
          /<script>/,
          `  <link rel="stylesheet" media="all" href="https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.css">
  <script src="https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.js"></script>
  <script>`
        ))

  jqContainer.addClass('graph')
  jqContainer.wrap('<div class="wrapper">')
  const jqWrapper = jqContainer.parent('.wrapper')

  g.theme = options.theme || 'light'

  if (g.theme == 'dark') {
    jqContainer.parents('.card').addClass('dark')
  }

  addInitializingLoader(jqWrapper, jqContainer)

  g.render = () => {
    jqWrapper.removeClass('initializing')

    const width = $(selector)
      .parent()
      .parent()
      .parent()
      .width()
    const height = $(selector)
      .parent()
      .height()
    const edgeColor = 'path'
    const textColor = options.theme == 'dark' ? 'white' : 'black'
    const strokeColor = options.theme == 'dark' ? 'white' : 'black'
    const linkOpacity = options.theme == 'dark' ? 1 : 0.85
    const fontSize = 12

    const svg = d3
      .select(selector)
      .append('svg')
      // .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')

		// Exit if data is empty
    if (
      !query.data[query.cryptoCurrency].inbound &&
      !query.data[query.cryptoCurrency].outbound
    ) {
      jqContainer.html(svg.node())
      return
    }

    const prepareData = (data) => {
      const getLabel = (node) => {
        if (node.address == '0x0000000000000000000000000000000000000000') {
          // 'coinbase'
          return 'Coinbase'
        } else if (
          node.smartContract &&
          node.smartContract.contractType == 'Generic'
        ) {
          // 'smart_contract'
          return node.address
        } else if (
          node.smartContract &&
          (node.smartContract.contractType == 'Token' ||
            node.smartContract.contractType == 'TokenSale')
        ) {
          // 'token'
          return (
            node.smartContract.currency.name +
            ' (' +
            node.smartContract.currency.symbol +
            ')'
          )
        } else if (
          node.smartContract &&
          node.smartContract.contractType == 'MarginPositionToken'
        ) {
          // 'MarginPositionToken'
          return node.annotation || node.address
        } else if (
          node.smartContract &&
          node.smartContract.contractType == 'Multisig'
        ) {
          // 'multisig'
          return node.annotation || node.address
        } else if (
          node.smartContract &&
          node.smartContract.contractType == 'DEX'
        ) {
          // 'dex'
          return node.annotation || node.address
        } else {
          if (node.address == '') {
            // 'coinbase'
            return 'Coinbase'
          } else if (node.annotation) {
            // 'annotated_address'
            return node.annotation
          } else {
            // 'address'
            return node.address
          }
        }
      }

      let links = []
      let nodes = []

      _.each(data[query.cryptoCurrency].inbound, (item) => {
        links.push({
          source: item.sender.address,
          target: item.receiver.address,
          amount: item.amount,
					value: item.amount,
					countOfTransfers: item.count,
        })
        nodes.push({
          id: item.sender.address,
          label: getLabel(item.sender),
          depthLevel:
            item.sender.address == query.variables.address ? 0 : -item.depth,
          valueFromOneLink: item.amount,
        })
        nodes.push({
          id: item.receiver.address,
          label: getLabel(item.receiver),
          depthLevel:
            item.receiver.address == query.variables.address
              ? 0
              : -item.depth + 1,
          valueFromOneLink: item.amount,
        })
      })

      _.each(data[query.cryptoCurrency].outbound, (item) => {
        links.push({
          source: item.sender.address,
          target: item.receiver.address,
          amount: item.amount,
					value: item.amount,
					countOfTransfers: item.count,
        })
        nodes.push({
          id: item.sender.address,
          label: getLabel(item.sender),
          depthLevel:
            item.sender.address == query.variables.address ? 0 : item.depth - 1,
          valueFromOneLink: item.amount,
        })
        nodes.push({
          id: item.receiver.address,
          label: getLabel(item.receiver),
          depthLevel:
            item.receiver.address == query.variables.address ? 0 : item.depth,
          valueFromOneLink: item.amount,
        })
      })

      nodes = _.uniqBy(
        _.sortBy(nodes, [(n) => -n.valueFromOneLink, (n) => n.depthLevel ** 2]),
        'id'
      )
      // nodes = _.uniqBy(_.sortBy(nodes, (n) => n.valueFromOneLink), 'id')
      // nodes = _.uniqBy(_.sortBy(nodes, (n) => n.depthLevel * n.depthLevel).reverse(), 'id')
      // nodes = _.uniqBy(nodes, 'id')

      return {
        links,
        nodes,
        units: query.currency,
      }
    }

    const data = prepareData(query.data)
    // const data = {
    //   nodes: [
    //     { id: 'a', column: 0},
    //     { id: 'b',  column: 0 },
    //     { id: 'c',  column: 0 },
    //     { id: 'd',  column: 1 },
    //     { id: 'e', column: 1 },
    //     { id: 'f', column: 2 },
    //     { id: 'g', column: 2 },
    //     { id: 'h', column: 2 },
    //     { id: 'k', column: 3 },
    //   ],
    //   links: [
    // 		{ source: 'a', target: 'e', value: 500 },
    // 		{ source: 'b', target: 'e', value: 3000 },
    // 		{ source: 'c', target: 'e', value: 10000 },
    // 		{ source: 'd', target: 'e', value: 100000 },
    // 		{ source: 'e', target: 'f', value: 30 },
    // 		{ source: 'e', target: 'g', value: 2500000 },
    // 		{ source: 'e', target: 'h', value: 10 },
    // 		{ source: 'e', target: 'd', value: 700000000 },
    // 		{ source: 'e', target: 'b', value: 20 },
    // 		{ source: 'e', target: 'a', value: 20 },
    // 		{ source: 'e', target: 'k', value: 4000000000 },
    // 		{ source: 'h', target: 'e', value: 20 },
    // 		{ source: 'k', target: 'e', value: 30 },
    // 		{ source: 'e', target: 'c', value: 30 },
    // 	],
    // 	units: 'ZZZ'
    // }

    const colorSchemaOdd = d3.scaleOrdinal(d3.schemeCategory10.slice(5))
    const colorSchemaEven = d3.scaleOrdinal(d3.schemeCategory10.slice(0, 5))
    const color = (d) => {
      return d.column % 2 == 0
        ? colorSchemaOdd(d.category === undefined ? d.id : d.category)
        : colorSchemaEven(d.category === undefined ? d.id : d.category)
    }

    const format = data.units
      ? (d) => `${_n(d).format('0.0000a')} ${data.units}`
      : (d) => `${_n(d).format('0.0000a')}`

    const sankey = d3Sankey
      .sankeyCircular()
      .nodeId((d) => d.id)
      .nodeAlign(d3Sankey.sankeyFixed)
      .nodeWidth(50)
      // .nodePadding(400)
      .nodePaddingRatio(0.7)
      .circularLinkGap(15)
      // .extent([
      //   [(width - 60) * 0.05, (height - 60) * 0.1],
      //   [(width - 60) * 0.95, (height - 60) * 0.9],
      // ])
      .size([3200, 1800])

    g.sankey = sankey

    const graph = sankey(data)
    const rootNode = _.find(graph.nodes, { id: query.variables.address })
    console.log(graph)

    function getAllPaths(graph) {
      const rootNode = _.find(graph.nodes, { id: query.variables.address })
      // const rootNode = _.find(graph.nodes, { id: 'e' })

      // const paths = []
      // function addSourceNodeToPath(node, path) {
      //   path.push(node.id)
      //   if (node.id == rootNode.id || node.sourceLinks.length == 0) {
      //     paths.push(path)
      //   } else {
      //     _.forEach(node.sourceLinks, (l) => {
      //       const pathCopy = [...path]
      //       if (l.target.id == rootNode.id || !_.includes(path, l.target.id)) {
      //         addSourceNodeToPath(l.target, pathCopy)
      //       } else {
      //         paths.push(path)
      //       }
      //     })
      //   }
      // }

      // _.forEach(rootNode.sourceLinks, (l) => {
      //   const path = [rootNode.id]
      //   addSourceNodeToPath(l.target, path)
      // })

      // const pathsToRootNode = []
      // function addTargetNodeToPath(node, path) {
      //   path.push(node.id)
      //   if (node.id == rootNode.id) {
      //     return
      //   } else if (node.targetLinks.length == 0) {
      //     pathsToRootNode.push(path.reverse())
      //   } else {
      //     _.forEach(node.targetLinks, (l) => {
      //       const pathCopy = [...path]
      //       if (!_.includes(path, l.source.id)) {
      //         addTargetNodeToPath(l.source, pathCopy)
      //       } else {
      // 				return
      //       }
      //     })
      //   }
      // }

      // _.forEach(rootNode.targetLinks, (l) => {
      //   const path = [rootNode.id]
      //   addTargetNodeToPath(l.source, path)
      // })

      // return _.concat(paths, pathsToRootNode)

      const pathsFromRootToNodes = []
      function addSourceNodeToPath(node, path) {
        if (node.id == rootNode.id || _.includes(path, node.id)) {
          if (!isDuplicate(pathsFromRootToNodes, path)) {
            pathsFromRootToNodes.push([...path])
          }
        } else if (node.sourceLinks.length == 0) {
          path.push(node.id)
          if (!isDuplicate(pathsFromRootToNodes, path)) {
            pathsFromRootToNodes.push([...path])
          }
        } else {
          path.push(node.id)
          if (!isDuplicate(pathsFromRootToNodes, path)) {
            pathsFromRootToNodes.push([...path])
          }
          _.forEach(node.sourceLinks, (l) => {
            addSourceNodeToPath(l.target, [...path])
          })
        }
      }

      _.forEach(rootNode.sourceLinks, (l) => {
        const path = [rootNode.id]
        addSourceNodeToPath(l.target, path)
      })

      const pathsFromNodesToRoot = []
      function addTargetNodeToPath(node, path) {
        if (node.id == rootNode.id || _.includes(path, node.id)) {
          if (!isDuplicate(pathsFromNodesToRoot, [...path].reverse())) {
            pathsFromNodesToRoot.push([...path].reverse())
          }
        } else if (node.targetLinks.length == 0) {
          path.push(node.id)
          if (!isDuplicate(pathsFromNodesToRoot, [...path].reverse())) {
            pathsFromNodesToRoot.push([...path].reverse())
          }
        } else {
          path.push(node.id)
          if (!isDuplicate(pathsFromNodesToRoot, [...path].reverse())) {
            pathsFromNodesToRoot.push([...path].reverse())
          }
          _.forEach(node.targetLinks, (l) => {
            const pathCopy = [...path]
            addTargetNodeToPath(l.source, pathCopy)
          })
        }
      }

      _.forEach(rootNode.targetLinks, (l) => {
        const path = [rootNode.id]
        addTargetNodeToPath(l.source, path)
      })

      return _.concat(pathsFromRootToNodes, pathsFromNodesToRoot)
    }

    const allPaths = getAllPaths(graph)
    console.log(allPaths)

    function isDuplicate(arrays, arr) {
      return _.some(arrays, (a) => {
        return _.isEqual(arr, a)
      })
    }

    function getPaths(nodeId, allPaths, toNode = true) {
      const paths = []
      _.forEach(allPaths, (p) => {
        const direction = toNode ? p.length - 1 : 0
        if (_.indexOf(p, nodeId) == direction) {
          paths.push(p)
        }
      })
      return paths
    }

    function getDataToHighlight(nodes, allPaths) {
      const dataToHighlight = {}

      _.forEach(nodes, (n) => {
        // что подсвечивать: от рутового или до или все вместе
        const paths = _.concat(
          getPaths(n.id, allPaths),
          getPaths(n.id, allPaths, false)
        )

        const nodesToHighlight = _.uniq(_.flattenDeep(paths))
        const linksToHighlight = []
        _.forEach(paths, (p) => {
          for (let i = 0; i < p.length - 1; i++) {
            const couple = [p[i], p[i + 1]]
            if (!isDuplicate(linksToHighlight, couple)) {
              linksToHighlight.push(couple)
            }
          }
        })
        dataToHighlight[n.id] = { nodesToHighlight, linksToHighlight }
      })
      return dataToHighlight
    }

    const dataToHighlight = getDataToHighlight(graph.nodes, allPaths)

    const rootG = svg.append('g')

    rootG
      .append('rect')
      .attr('class', 'divider')
      .attr('x', rootNode.x0)
      .attr('y', -10000)
      .attr('height', 20000)
      .attr('width', rootNode.x1 - rootNode.x0)
      .attr('fill', 'silver')
      .attr('opacity', 0.5)

    const linkG = rootG
      .append('g')
      .attr('class', 'links')
      .attr('fill', 'none')
      .attr('stroke-opacity', linkOpacity)
      .selectAll('path')

    const nodeG = rootG
      .append('g')
      .attr('class', 'nodes')
      .attr('font-family', 'sans-serif')
      .attr('font-size', fontSize)
      .selectAll('g')

    const node = nodeG
      .data(graph.nodes)
      .enter()
      .append('g')

    const tooltip = d3.select('.tooltip').empty()
      ? d3
          .select('body')
          .append('div')
          .attr(
            'class',
            options.theme == 'dark' ? 'tooltip tooltip--dark' : 'tooltip'
          )
      : d3.select('.tooltip')

    node
      .append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => (d.y1 - d.y0 < 1 ? d.y0 - 0.5 : d.y0))
      // .attr('y', (d) => d.y0)
      .attr('height', (d) => (d.y1 - d.y0 < 1 ? 1 : d.y1 - d.y0))
      // .attr('height', (d) => d.y1 - d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('fill', color)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1)
      .on('mouseover', nodeMouseOver)
      .on('mousemove', nodeMouseMove)
      .on('mouseout', nodeMouseOut)
      .on('contextmenu', nodeContextMenu)

    node
      .append('text')
      .attr('x', (d) => (d.x0 + d.x1) / 2)
      .attr('y', (d) => d.y0 - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .text((d) =>
        _.startsWith(d.label, '0x') || _.indexOf(d.label, ' ') == -1
          ? _.truncate(d.label, { length: 15, separator: '...' })
          : d.label
      )
      .on('mouseover', nodeMouseOver)
      .on('mousemove', nodeMouseMove)
      .on('mouseout', nodeMouseOut)
      .on('contextmenu', nodeContextMenu)

    const link = linkG
      .data(graph.links)
      .enter()
      .append('g')

    if (edgeColor === 'path') {
      const gradient = link
        .append('linearGradient')
        .attr('id', (d) => (d.uid = uid('link')).id)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', (d) => d.source.x1)
        .attr('x2', (d) => d.target.x0)

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', (d) => color(d.source))

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', (d) => color(d.target))
    }

    link
      .append('path')
      .attr('class', 'sankey-link')
      .attr('d', function(link) {
        return link.path
      })
      .attr('stroke', (d) =>
        edgeColor === 'none'
          ? '#aaa'
          : edgeColor === 'path'
          ? d.uid
          : edgeColor === 'input'
          ? color(d.source)
          : color(d.target)
      )
      .attr('stroke-width', (d) => Math.max(1, d.width))
      .attr('opacity', 1)
      .on('mouseover', linkMouseOver)
      .on('mousemove', linkMouseMove)
      .on('mouseout', linkMouseOut)

    let arrows = d3PathArrows
      .pathArrows()
      .arrowLength(10)
      .gapLength(150)
      .arrowHeadSize(4)
      .path(function(link) {
        return link.path
      })

    const arrowsG = linkG
      .data(graph.links)
      .enter()
      .append('g')
      .attr('class', 'g-arrow')
      .call(arrows)

    arrowsG.select('path').style('stroke', strokeColor)

    arrowsG.selectAll('.arrow-head').style('fill', strokeColor)

    // function highlightNodes(node, id) {
    //   let opacity = 0.3

    //   if (node.id == id) {
    //     opacity = 1
    //   }
    //   node.sourceLinks.forEach(function(link) {
    //     if (link.target.id == id) {
    //       opacity = 1
    //     }
    //   })
    //   node.targetLinks.forEach(function(link) {
    //     if (link.source.id == id) {
    //       opacity = 1
    //     }
    //   })

    //   return opacity
    // }
    function highlightNodes(node, id) {
      let opacity = 0.3

      if (_.includes(dataToHighlight[id].nodesToHighlight, node.id)) {
        opacity = 1
      }

      return opacity
    }

    function highlightLinks(link, id) {
      const highlight = _.some(
        dataToHighlight[id].linksToHighlight,
        (couple) => {
          return link.source.id == couple[0] && link.target.id == couple[1]
        }
      )
      return highlight ? 1 : 0.3
    }

    // function nodeMouseOver(e, d) {
    //   let thisId = d.id

    //   node.selectAll('rect').style('opacity', (d) => highlightNodes(d, thisId))

    //   d3.selectAll('.sankey-link').style('opacity', (l) =>
    //     l.source.id == thisId || l.target.id == thisId ? 1 : 0.3
    //   )

    //   node.selectAll('text').style('opacity', (d) => highlightNodes(d, thisId))

    //   let income = 0
    //   _.each(d.targetLinks, (l) => {
    //     income += l.amount
    //   })
    //   let outcome = 0
    //   _.each(d.sourceLinks, (l) => {
    //     outcome += l.amount
    //   })

    //   tooltip.style('visibility', 'visible').html(
    //     `<ul>
    // 			${income != 0 ? `<li>Income: ${format(income)}</li>` : ''}
    // 			${outcome != 0 ? `<li>Outcome: ${format(outcome)}</li>` : ''}
    // 			<li>${d.label}</li>
    // 		</ul>`
    //   )
    // }
    function nodeMouseOver(e, d) {
      let thisId = d.id

      node.selectAll('rect').style('opacity', (d) => highlightNodes(d, thisId))

      d3.selectAll('.sankey-link').style('opacity', (l) =>
        highlightLinks(l, thisId)
      )

      node.selectAll('text').style('opacity', (d) => highlightNodes(d, thisId))

      let income = 0
      _.each(d.targetLinks, (l) => {
        income += l.amount
      })
      let outcome = 0
      _.each(d.sourceLinks, (l) => {
        outcome += l.amount
      })

      tooltip.style('visibility', 'visible').html(
        `<ul>
					${income != 0 ? `<li>Income: ${format(income)}</li>` : ''}
					${outcome != 0 ? `<li>Outcome: ${format(outcome)}</li>` : ''}
					<li>${d.label}</li>
				</ul>`
      )
    }

    function nodeMouseMove(e, d) {
      const bodyWidth = d3
        .select('body')
        .style('width')
        .slice(0, -2)
      const tooltipheight = e.pageY - tooltip.style('height').slice(0, -2) - 10
      const tooltipWidth = tooltip.style('width').slice(0, -2)
      const tooltipX =
        e.pageX < tooltipWidth / 2
          ? 0
          : e.pageX + tooltipWidth / 2 > bodyWidth
          ? bodyWidth - tooltipWidth
          : e.pageX - tooltipWidth / 2

      tooltip.style('top', tooltipheight + 'px').style('left', tooltipX + 'px')
    }

    function nodeMouseOut(e, d) {
      node.selectAll('rect').style('opacity', 1)
      link.selectAll('.sankey-link').style('opacity', linkOpacity)
      node.selectAll('text').style('opacity', 1)
      tooltip.style('visibility', 'hidden')
    }

    function nodeContextMenu(e, d) {
      e.preventDefault()
      const pathname = window.location.pathname.slice(1)
      window.open(
        `${window.location.origin}/${pathname.slice(
          0,
          pathname.indexOf('/')
        )}/address/${d.id}`,
        '_blank'
      )
    }

    function linkMouseOver(e, l) {
      let source = l.source.id
      let target = l.target.id

      link
        .selectAll('.sankey-link')
        .style('opacity', (l) =>
          l.source.id == source && l.target.id == target ? 1 : 0.3
        )

      node.selectAll('rect').style('opacity', (d) => {
        return d.id == source || d.id == target ? 1 : 0.3
      })

      node.selectAll('text').style('opacity', (d) => {
        return d.id == source || d.id == target ? 1 : 0.3
      })

      tooltip.style('visibility', 'visible').html(
        `<ul>
					<li>Amount: ${format(l.amount)}</li>
					<li>From:</li>
					<li>${l.source.label}</li>
					<li>To:</li>
					<li>${l.target.label}</li>
					<li>Count of transfers: ${l.countOfTransfers}</li>
				</ul>`
      )
    }

    function linkMouseMove(e, l) {
      const bodyWidth = d3
        .select('body')
        .style('width')
        .slice(0, -2)
      const tooltipheight = e.pageY - tooltip.style('height').slice(0, -2) - 10
      const tooltipWidth = tooltip.style('width').slice(0, -2)
      const tooltipX =
        e.pageX < tooltipWidth / 2
          ? 0
          : e.pageX + tooltipWidth / 2 > bodyWidth
          ? bodyWidth - tooltipWidth
          : e.pageX - tooltipWidth / 2

      tooltip.style('top', tooltipheight + 'px').style('left', tooltipX + 'px')
    }

    function linkMouseOut(e, l) {
      node.selectAll('rect').style('opacity', 1)
      link.selectAll('.sankey-link').style('opacity', 1)
      node.selectAll('text').style('opacity', 1)
      tooltip.style('visibility', 'hidden')
    }

    const zoom = d3
      .zoom()
      .on('zoom', function(e) {
        rootG.select('.nodes').attr('font-size', fontSize / e.transform.k)
        rootG
          .select('.divider')
          .attr('y', (d) => -10000 / e.transform.k)
          .attr('height', 20000 / e.transform.k)
        rootG.attr('transform', e.transform)
      })
      .on('start', function(e) {
        if (e.sourceEvent && e.sourceEvent.type == 'mousedown') {
          svg.attr('cursor', 'move')
          // tooltip.style('visibility', 'hidden')
        }
      })
      .on('end', function(e) {
        if (e.sourceEvent && e.sourceEvent.type == 'mouseup') {
          svg.attr('cursor', 'default')
        }
      })

    svg
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(200, 80).scale(0.25))
      .on('dblclick.zoom', null)

    const chart = svg.node()
    $(selector).html(chart)
  }

  // window.onresize = g.render
  query.components.push({
    id: selector,
    g,
  })
  return g
}

export function addControls(selector, query, options) {
  const controls = {}
  const jqContainer = $(selector)
  const jqWrapper = jqContainer.parent('.wrapper')

  controls.currencies = options.currencies
  controls.theme = options.theme

  controls.setCurrency = () => {
    query.currency = (
      _.find(controls.currencies, {
        search: query.variables.currency,
      }) || controls.currencies[0]
    ).symbol
  }

  controls.detailLevel = () => {
    const graphDetailLevel = $(DetailLevel(query.variables.limit))
    const val = $(DetailLevelPopup(controls.theme))

    jqWrapper.append(graphDetailLevel)

    graphDetailLevel.find('input').val(query.variables.limit)

    graphDetailLevel
      .find('input')
      .on('input', function(e) {
        val.html($(this).val())
      })
      .on('mousedown', function(e) {
        $('body').append(val)
        val.html($(this).val())
        val.css({ left: e.pageX - 20, top: e.pageY - 40 })
        $(this).on('mousemove', function(e) {
          val.css({ left: e.pageX - 20 })
        })
      })
      .on('mouseup', function(e) {
        val.remove()
        $(this).off('mousemove')
      })
      .on('change', function(e) {
        const variables = {
          limit: parseInt($(this).val()),
        }
        query.request(variables)
      })
  }

  controls.editDetailLevel = () => {
    // jqContainer.find('.detail-level__input').val(query.variables.limit)
    jqWrapper.find('.detail-level__input').val(query.variables.limit)
  }

  controls.currencyFilter = () => {
    if (controls.currencies.length == 0) return
    const select = $(CurrencyFilter())
    // currnecy value for search in graphql
    _.each(controls.currencies, function(c) {
      let value = c.search
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
    // jqContainer.append(select)
    jqWrapper.append(select)

    select.find('select').on('change', function() {
      let currencyAddress = $(this).val()

      if (query.currencyType == 'number') {
        currencyAddress = parseInt(currencyAddress)
      }

      query.request({
        network: query.variables.network,
        address: query.variables.address,
        currency: currencyAddress,
      })
    })
  }

  controls.refreshCurrencyFilter = () => {
    // jqContainer.find('.currency-filter').remove()
    jqWrapper.find('.currency-filter').remove()
    controls.currencyFilter()
  }

  controls.depthLevel = () => {
    const graphDepthLevel = $(
      DepthLevel(query.variables.inboundDepth, query.variables.outboundDepth)
    )

    jqWrapper.append(graphDepthLevel)

    graphDepthLevel.find('input').on('change', function(e) {
      const value = parseInt($(this).val())
      const variables =
        e.target.id == 'inbound-level'
          ? { inboundDepth: value }
          : { outboundDepth: value }
      query.request(variables)
    })
  }

  controls.refreshDepthLevel = () => {
    jqWrapper.find('.depth-level').remove()
    controls.depthLevel()
  }

  controls.createBottomMenu = () => {
    const menu = $(`<div class="graph-bottom-menu"></div>`)
    // jqContainer.append(menu)
    jqWrapper.append(menu)

    addFullScreenButton(menu, jqWrapper)

    const buttonsBlock = $(`<div class="graph-bottom-menu__buttons"></div>`)
    menu.append(buttonsBlock)

    addModalJS(buttonsBlock, query.JSCode, options, query)
    addModalGraphQL(buttonsBlock, options, query)
  }

  controls.refresh = () => {
    controls.setCurrency()
    controls.editDetailLevel()
    controls.refreshCurrencyFilter()
    controls.refreshDepthLevel()
  }

  $('body').on('DOMSubtreeModified', selector, function render() {
    controls.setCurrency()
    controls.detailLevel()
    controls.currencyFilter()
    controls.depthLevel()
    controls.createBottomMenu()
    $('body').off('DOMSubtreeModified', render)
  })

  query.controls.push(controls)
  return controls
}
