import _ from "lodash";

export const addGraphQLButton = (container, query, ideUrl) => {

    const modalGQL = $(`
		<div>
			<a class="badge badge-secondary open-btn">Open GraphQL IDE</a>
		</div>
	`)

    container.append(modalGQL)

    $(modalGQL).on('click', (e) => {
        fetch(ideUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                query: query.query,
                variables: JSON.stringify(query.variables),
            }),
        })
            .then((res) => {
                if (res.status === 200 || res.status === 302) {
                    window.open(res.url, '_blank').focus()
                    // res.redirect(302, res.url)
                } else {
                    console.log(res.message)
                }
            })
    })

}
