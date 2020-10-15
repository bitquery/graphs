// import $ from 'jquery'
import _ from 'lodash'
import _n from 'numeral'
import { Network, DataSet } from 'vis-network/standalone/umd/vis-network.min'
import { LineLoader } from './components/LineLoader'
import { CurrencyFilter } from './components/CurrencyFilter'
import { CurrencyFilterOption } from './components/CurrencyFilterOption'
import { DetailLevel } from './components/DetailLevel'
import { DetailLevelPopup } from './components/DetailLevelPopup'
import { FullscreenButton } from './components/FullscreenButton'
import { getCurrencies } from './currencies'
import { darkenColor } from './darkenColor'
import './style.scss'

export function query(query) {
  return {
    query,
    initVariables: {},

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

    request: function(variables, isExpand = false) {
      if (!_.isEmpty(this.initVariables)) {
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
          variables: _.defaults(variables, this.initVariables),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (_.isEmpty(this.initVariables)) {
            this.initVariables = variables
          }
          if (this.loading) {
            this.loading = false
            this.removeLoader()
          }
          this.setData(data['data'], isExpand)
        })
    },

    addLoader: function() {
      console.log(this)
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

  // let currencies = [
  //   {
  //     address: '0x87010faf5964d67ed070bc4b8dcafa1e1adc0997',
  //     symbol: 'FC',
  //     name: 'FansCoin',
  //   },
  // ]
  // let currency = (
  //   _.find(currencies, { address: query.initVariables.currency }) ||
  //   currencies[0]
  // ).symbol
  const currencies = getCurrencies()
  let currency = (
    _.find(currencies, { address: query.initVariables.currency }) ||
    currencies[0]
  ).symbol
  // const currency = 'Ether'

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
    const rootNode = g.dataset.nodes.get(query.initVariables.address)
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
      query.request({ address: address }, true)
    }
  }

  g.detailLevel = (limit) => {
    const graphDetailLevel = $(DetailLevel(limit))
    const val = $(DetailLevelPopup(g.theme))

    jqContainer.append(graphDetailLevel)

    graphDetailLevel.find('input').val(query.initVariables.limit)

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
      _.merge(query.initVariables, variables)
      query.request(variables)
    })
  }

  g.currencyFilter = () => {
    const select = $(CurrencyFilter())
    _.each(currencies, function(c) {
      const value = c.address === '-' ? c.symbol : c.address
      select
        .find('select')
        .append(
          CurrencyFilterOption(
            value,
            query.initVariables.currency,
            c.name,
            c.symbol
          )
        )
    })
    jqContainer.append(select)

    select.find('select').on('change', function() {
      const currencyAddress = $(this).val()
      currency = (
        _.find(currencies, { address: currencyAddress }) || currencies[0]
      ).symbol
      _.merge(query.initVariables, { currency: currencyAddress })
      query.request({
        network: query.initVariables.network,
        address: query.initVariables.address,
        currency: currencyAddress,
      })
    })
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

    g.network.once('stabilized', function() {
			g.network.fit({animation: { duration: 500, easingFunction: 'easeInOutQuart' }})
      // if (g.network.getScale() > 1) {
      //   const scaleOption = {
      //     scale: 1,
      //     animation: { duration: 500, easingFunction: 'easeInOutQuart' },
      //   }
      //   g.network.moveTo(scaleOption)
      // }
    })

    g.detailLevel(query.initVariables.limit)
    g.currencyFilter()
    g.fullScreen()
    jqWrapper.removeClass('initializing')
  }

  g.render = (isExpand) => {
    if (!g.dataset) {
      g.initGraph()
    } else if (!isExpand) {
      g.setDataset()
      g.editRootNode()
    } else {
      g.expandDataset()
    }
  }

  query.components.push(g)
  return g
}
