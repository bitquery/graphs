# graphs

Graph-type widgets library

# Description

Library for graph visualization based on blockchain data

You can see how it works on [explorer.bitquery.io](https://explorer.bitquery.io)

# Installation

Clone this repo and run

```bash
npm install
```

To build app, run

```bash
npm run build
```

# Development

Here is one of the way to develop and test this project.

```bash
git clone https://github.com/bitquery/explorer
```

Change `webpack.config.json` in graphs project.

```
path: path.resolve(__dirname, '../explorer/app/javascript/packs'),
// path: path.resolve(__dirname, 'dist'),
```

```
minimize: false,
// minimize: true,
```

Open up `app/views/shared/_head.html.erb` file in explorer project
and change code to:

```
<%# <link rel="stylesheet" media="all" href="https://cdn.jsdelivr.net/gh/bitquery/graphs@v1.0.21/dist/graphs.min.css"> %>
<%# <script src="https://cdn.jsdelivr.net/gh/bitquery/graphs@v1.0.21/dist/graphs.min.js"></script> %>

<%= stylesheet_pack_tag 'graphs', media: 'all' %>
<%= javascript_pack_tag 'graphs' %>
```

Run:

```bash
npm run dev
```

# Quick start

Several quick start options are available:

- Install with npm `npm i @bitquery/graph`
- Using cdn `https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.js` `https://cdn.jsdelivr.net/gh/bitquery/graphs@1/dist/graphs.min.css`
- Clone the repo: `git clone https://github.com/bitquery/graphs.git`
- Download the latest release

# License

This project is licensed under the terms of the MIT license.
