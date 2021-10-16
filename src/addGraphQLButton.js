import _ from "lodash";

export const addGraphQLButton = (container, query, ideUrl) => {

    const modalGQL = $(`
		<div>
			<a class="badge badge-secondary open-btn">Open GraphQL IDE</a>
		</div>
	`)

    container.append(modalGQL)

    $(modalGQL).on('click', (e) => {
        let wwindow = window.open()
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
                    wwindow.location.href = res.url
                    // window.open(res.url, '_blank').focus()
                    // res.redirect(302, res.url)
                } else {
                    console.log(res.message)
                }
            })
    })

}
