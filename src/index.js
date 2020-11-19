import _ from 'lodash'
import _n from 'numeral'

import { Network, DataSet } from '../node_modules/vis'
import { addInitializingLoader } from './addInitializingLoader'
import { CurrencyFilter } from './components/CurrencyFilter'
import { CurrencyFilterOption } from './components/CurrencyFilterOption'
import { DetailLevel } from './components/DetailLevel'
import { DetailLevelPopup } from './components/DetailLevelPopup'
import { addFullScreenButton } from './addFullScreenButton'
import { lightenOrDarkenColor } from './util/lightenOrDarkenColor'
import { addModalJS } from './addModalJS'
import { addModalGraphQL } from './addModalGraphQL'

import * as d3 from 'd3'
import * as d3Sankey from 'd3-sankey-circular'
import * as d3PathArrows from 'd3-path-arrows'
import uid from './util/uid'

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
            this.currencyType = typeof variables.currency
          }
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
  jqContainer.addClass('graph')
  jqContainer.wrap('<div class="wrapper">')
  const jqWrapper = jqContainer.parent('.wrapper')

  g.JSCode = jqContainer
    .parents('.row')[0]
    .outerHTML.replace(/queryWithTimeRange\(.*\)/, `query.request({})`)
    .replace(
      /<script>/,
      `  <link rel="stylesheet" media="all" href="https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.css">
  <script src="https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.js"></script>
  <script>`
    )

  // a trick for the icons in the graph to be loaded
  jqContainer.append(
    '<i class="fa fa-flag" style="visibility:hidden;position:absolute;"></i>'
  )

  g.theme = options.theme || 'light'

  if (g.theme == 'dark') {
    jqContainer.parents('.card').addClass('dark')
  }

  jqContainer
    .parents('.card')
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

  g.setCurrency = () => {
    // currency value for label in graph
    if (g.currencies.length == 0) {
      query.currency = query.variables.network
      return
    }
    query.currency = (
      _.find(g.currencies, {
        search: query.variables.currency,
      }) || g.currencies[0]
    ).symbol
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
      query.request(variables)
    })
  }

  g.editDetailLevel = (limit) => {
    $('.detail-level__input').val(limit)
  }

  g.currencyFilter = () => {
    if (g.currencies.length == 0) return
    const select = $(CurrencyFilter())
    // currnecy value for search in graphql
    _.each(g.currencies, function(c) {
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
    jqContainer.append(select)

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

  g.refreshCurrencyFilter = () => {
    jqContainer.find('.currency-filter').remove()
    g.currencyFilter()
  }

  g.createBottomMenu = () => {
    const menu = $(`
			<div class="graph-bottom-menu"></div>
		`)
    jqContainer.append(menu)

    addFullScreenButton(menu, jqWrapper)

    const buttonsBlock = $(`<div class="graph-bottom-menu__buttons"></div>`)
    menu.append(buttonsBlock)

    addModalJS(buttonsBlock, g.JSCode, options, query)
    addModalGraphQL(buttonsBlock, options, query)
  }

  g.initGraph = () => {
    jqWrapper.removeClass('initializing')
    g.currencies = options.currencies
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

export function address_sankey(selector, query, options) {
  const g = {}

  g.container = document.querySelector(selector)
  const jqContainer = $(g.container)
  jqContainer.addClass('graph')
  jqContainer.wrap('<div class="wrapper">')
  const jqWrapper = jqContainer.parent('.wrapper')

  g.theme = options.theme || 'light'

  if (g.theme == 'dark') {
    jqContainer.parents('.card').addClass('dark')
  }

  addInitializingLoader(jqWrapper, jqContainer)

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
      query.request(variables)
    })
  }

  g.editDetailLevel = (limit) => {
    $('.detail-level__input').val(limit)
  }

  g.setCurrency = () => {
    // currency value for label in graph
    if (g.currencies.length == 0) {
      query.currency = query.variables.network
      return
    }
    query.currency = (
      _.find(g.currencies, {
        search: query.variables.currency,
      }) || g.currencies[0]
    ).symbol
  }

  g.currencyFilter = () => {
    if (g.currencies.length == 0) return
    const select = $(CurrencyFilter())
    // currnecy value for search in graphql
    _.each(g.currencies, function(c) {
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
    jqContainer.append(select)

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

  g.render = () => {
    options.dependent
      ? jqContainer
          .parents('.card')
          .find('.card-header')
          .text(query.currentAddress + ' money flow')
      : null

    jqWrapper.removeClass('initializing')

    g.currencies = options.currencies
    g.setCurrency()

    const topMenuMargin = 100
    const width = $(selector).width()
    const height = options.dependent ? 600 : 600 - topMenuMargin
    const edgeColor = 'path'
    const textColor = options.theme == 'dark' ? 'white' : 'black'
    const strokeColor = options.theme == 'dark' ? 'white' : 'black'
    const linkOpacity = options.theme == 'dark' ? 1 : 0.85

    const prepareData = (sampleData) => {
      const prepareLinks = (data) => {
        const links = []

        _.each(data[query.cryptoCurrency].inbound, (item) => {
          links.push({
            source: item.sender.address,
            target: item.receiver.address,
            amount: item.amount,
            value: item.amount,
          })
        })

        _.each(data[query.cryptoCurrency].outbound, (item) => {
          links.push({
            source: item.sender.address,
            target: item.receiver.address,
            amount: item.amount,
            value: item.amount,
          })
        })

        return links
      }

      const links = prepareLinks(sampleData)

      const nodes = Array.from(
        new Set(links.flatMap((l) => [l.source, l.target])),
        (name) => ({ name })
      )

      return {
        links,
        nodes,
        units: query.currency,
      }
    }

    const data = prepareData(query.data)

    const colorSchemaOdd = d3.scaleOrdinal(d3.schemeCategory10.slice(5))
    const colorSchemaEven = d3.scaleOrdinal(d3.schemeCategory10.slice(0, 5))
    const color = (d) => {
      return d.column % 2 == 0
        ? colorSchemaOdd(d.category === undefined ? d.name : d.category)
        : colorSchemaEven(d.category === undefined ? d.name : d.category)
    }

    const format = data.units
      ? (d) => `${_n(d).format('0.0000a')} ${data.units}`
      : (d) => `${_n(d).format('0.0000a')}`

    const sankey = d3Sankey
      .sankeyCircular()
      .nodeId((d) => d.name)
      .nodeAlign(d3Sankey.sankeyJustify)
      .nodeWidth(15)
      .nodePaddingRatio(0.3)
      .circularLinkGap(2)
      .extent([
        [(width - 60) * 0.05, (height - 60) * 0.1],
        [(width - 60) * 0.95, (height - 60) * 0.9],
      ])

    const graph = sankey(data)

    const svg = d3
      .select(selector)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr(
        'transform',
        `translate(0,${options.dependent ? 0 : topMenuMargin})`
      )

    const rootG = svg.append('g').attr('transform', 'translate(30, 30)')

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
      .attr('font-size', 10)
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
      .attr('height', (d) => (d.y1 - d.y0 < 1 ? 1 : d.y1 - d.y0))
      .attr('width', (d) => d.x1 - d.x0)
      .attr('fill', color)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 0.5)
      .on('mouseover', (e, d) => {
        let thisName = d.name

        node
          .selectAll('rect')
          .style('opacity', (d) => highlightNodes(d, thisName))

        d3.selectAll('.sankey-link').style('opacity', (l) =>
          l.source.name == thisName || l.target.name == thisName ? 1 : 0.3
        )

        node
          .selectAll('text')
          .style('opacity', (d) => highlightNodes(d, thisName))

        let income = 0
        _.each(d.targetLinks, (l) => {
          income += l.amount
        })
        let outcome = 0
        _.each(d.sourceLinks, (l) => {
          outcome += l.amount
        })

        const text = `<p>${d.name}\nIncome: ${format(
          income
        )}\nOutcome: ${format(outcome)}</p>`

        tooltip.style('visibility', 'visible').html(
          `<ul>
						<li>${d.name}</li>
						<li>Income: ${format(income)}</li>
						<li>Outcome: ${format(outcome)}</li>
					</ul>`
        )
      })
      .on('mousemove', (e, d) => {
        const bodyWidth = d3
          .select('body')
          .style('width')
          .slice(0, -2)
        const tooltipheight =
          e.pageY - tooltip.style('height').slice(0, -2) - 10
        const tooltipWidth = tooltip.style('width').slice(0, -2)
        const tooltipX =
          e.pageX < tooltipWidth / 2
            ? 0
            : e.pageX + tooltipWidth / 2 > bodyWidth
            ? bodyWidth - tooltipWidth
            : e.pageX - tooltipWidth / 2

        tooltip
          .style('top', tooltipheight + 'px')
          .style('left', tooltipX + 'px')
      })
      .on('mouseout', (e, d) => {
        d3.selectAll('rect').style('opacity', 1)
        d3.selectAll('.sankey-link').style('opacity', linkOpacity)
        d3.selectAll('text').style('opacity', 1)
        tooltip.style('visibility', 'hidden')
      })
      .on('contextmenu', (e, d) => {
        e.preventDefault()
        const pathname = window.location.pathname.slice(1)
        window.open(
          `${window.location.origin}/${pathname.slice(
            0,
            pathname.indexOf('/')
          )}/address/${d.name}`,
          '_blank'
        )
      })

    node
      .append('text')
      .attr('x', (d) => (d.x0 + d.x1) / 2)
      .attr('y', (d) => d.y0 - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .text((d) => d.name.slice(0, 10) + '...')

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
      // .style('mix-blend-mode', 'multiply')
      .on('mouseover', (e, l) => {
        let source = l.source.name
        let target = l.target.name

        d3.selectAll('.sankey-link').style('opacity', (l) =>
          l.source.name == source && l.target.name == target ? 1 : 0.3
        )

        node.selectAll('rect').style('opacity', (d) => {
          return d.name == source || d.name == target ? 1 : 0.3
        })

        node.selectAll('text').style('opacity', (d) => {
          return d.name == source || d.name == target ? 1 : 0.3
        })

        tooltip.style('visibility', 'visible').html(
          `<ul>
						<li>${l.source.name}</li>
						<li>-></li>
						<li>${l.target.name}</li>
						<li>Amount: ${format(l.amount)}</li>
					</ul>`
        )
      })
      .on('mousemove', (e, l) => {
        const bodyWidth = d3
          .select('body')
          .style('width')
          .slice(0, -2)
        const tooltipheight =
          e.pageY - tooltip.style('height').slice(0, -2) - 10
        const tooltipWidth = tooltip.style('width').slice(0, -2)
        const tooltipX =
          e.pageX < tooltipWidth / 2
            ? 0
            : e.pageX + tooltipWidth / 2 > bodyWidth
            ? bodyWidth - tooltipWidth
            : e.pageX - tooltipWidth / 2

        tooltip
          .style('top', tooltipheight + 'px')
          .style('left', tooltipX + 'px')
      })
      .on('mouseout', (e, l) => {
        d3.selectAll('rect').style('opacity', 1)
        d3.selectAll('.sankey-link').style('opacity', 1)
        d3.selectAll('text').style('opacity', 1)
        tooltip.style('visibility', 'hidden')
      })

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

    const pathArrowStyle = arrowsG
      .select('path')
      .attr('style')
      .replace(/stroke: black;/, `stroke: ${strokeColor};`)

    arrowsG.select('path').attr('style', pathArrowStyle)

    arrowsG.selectAll('.arrow-head').attr('style', `fill: ${strokeColor}`)

    function highlightNodes(node, name) {
      let opacity = 0.3

      if (node.name == name) {
        opacity = 1
      }
      node.sourceLinks.forEach(function(link) {
        if (link.target.name == name) {
          opacity = 1
        }
      })
      node.targetLinks.forEach(function(link) {
        if (link.source.name == name) {
          opacity = 1
        }
      })

      return opacity
    }

    const chart = svg.node()
    $(selector).html(chart)
    if (!options.dependent) {
      g.detailLevel(query.variables.limit)
      g.currencyFilter()
    }
  }

  window.onresize = g.render
  query.components.push(g)
  return g
}
