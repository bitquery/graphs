export const addModalGraphQL = (container, options, query) => {
  const original = {
    query: query.query,
		variables: JSON.stringify(query.variables),
		url: query.url
  }
  const graphiql = {
    query: '',
		variables: '',
  }

  const modalGQL = $(`
		<div>
			<a class="badge badge-secondary open-btn">GraphQL</a>
			<div class="graph-modal ${
        options.theme == 'dark' ? 'dark' : ''
      } graph-modal-gql" tabindex="-1">
					<div class="graph-modal-dialog">
							<div class="graph-modal-content">
									<div class="graph-modal-header">
											<button type="button" class="graph-modal-close close-btn" >&times;</button>
											<h4 class="graph-modal-title">Graph</h4>
									</div>
									<div class="graph-modal-url">
											<div class="row">
													<div class="col-sm-8 col-md-9 col-xl-10">
															<input type="text" value="${original.url}" disabled class="form-control form-control-sm query-url">
													</div>
													<div class="col-sm-4 col-md-3 col-xl-2">
															<a href="https://github.com/bitquery/graphql/wiki" class='float-right' target="_blank">Docs on Github</a>
													</div>
											</div>
									</div>
									<div class="graph-modal-body graph-graphiql">loading...</div>
									<div class="graph-modal-footer">
											<button type="button" class="btn btn-primary apply-btn">Apply changes</button>
											<button type="button" class="btn btn-secondary revert-btn" style="display: none;">Revert changes</button>
											<button type="button" class="btn btn-default close-btn">Close</button>
											<a href="https://github.com/graphql/graphiql" class="float-right">GraphiQL on GitHub</a>
									</div>
							</div>
					</div>
			</div>
		</div>
	`)

  container.append(modalGQL)

  function renderGraphiQL() {
		graphiql.query = query.query
		graphiql.variables = JSON.stringify(query.variables)

    function graphQLFetcher(graphQLParams) {
      return fetch(query.url, {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphQLParams),
      }).then((response) => response.json())
    }

    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        query: graphiql.query,
        variables: graphiql.variables,
        onEditQuery: function(query) {
          graphiql.query = query
        },
        onEditVariables: function(variables) {
          graphiql.variables = variables
        },
        defaultVariableEditorOpen: true,
      }),
      // document.getElementById('graph-graphiql')
      modalGQL.find('.graph-graphiql')[0]
		)
		
		const revertButton = modalGQL.find('.revert-btn')
		original.query == graphiql.query && _.isEqual(original.variables, graphiql.variables) ?
			revertButton.css({display: 'none'}) :
			revertButton.css({display: 'inline-block'})
  }

  $('head').append(
    '<link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css"/>'
  )
  $.getScript('https://unpkg.com/react@16/umd/react.development.js').done(
    function() {
      $.getScript(
        'https://unpkg.com/react-dom@16/umd/react-dom.development.js'
      ).done(function() {
        $.getScript('https://unpkg.com/graphiql/graphiql.min.js').done(
          function() {
						renderGraphiQL()
					}
        )
      })
    }
  )

  const openModal = () => {
    $('body').addClass('graph-modal-open')
		modalGQL.find('.graph-modal-gql').addClass('graph-modal-shown')

		$('.query-url').val(query.url)
    if (window.g) {
			renderGraphiQL()
			window.g.refresh()
    }
  }

  const closeModal = () => {
    $('body').removeClass('graph-modal-open')
    modalGQL.find('.graph-modal-gql').removeClass('graph-modal-shown')
  }

  const applyChanges = () => {
		query.url = $('.query-url').val().trim()
    $('body').removeClass('graph-modal-open')
    modalGQL.find('.graph-modal-gql').removeClass('graph-modal-shown')
    query.query = graphiql.query
    query.request(JSON.parse(graphiql.variables))
	}
	const revertChanges = () => {
    $('body').removeClass('graph-modal-open')
		modalGQL.find('.graph-modal-gql').removeClass('graph-modal-shown')
		query.url = original.url
    query.query = original.query
    query.request(JSON.parse(original.variables))
  }

  modalGQL.find('.open-btn').on('click', openModal)
  modalGQL.find('.close-btn').on('click', closeModal)
  modalGQL.find('.apply-btn').on('click', applyChanges)
  modalGQL.find('.revert-btn').on('click', revertChanges)
}
