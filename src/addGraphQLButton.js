import _ from "lodash";

export const addGraphQLButton = (container, query, ideUrl) => {

    const modalGQL = $(`
		<div>
			<a class="badge badge-secondary open-btn">Get API</a>
		</div>
	`)

    container.append(modalGQL)

    $(modalGQL).on('click', (e) => {
        let createHiddenField = function (name, value) {
            let input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', name);
            input.setAttribute('value', value);
            return input;
        }
        let form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', ideUrl);
        form.setAttribute('target', '_blank');
        form.setAttribute('enctype', 'application/json');
        form.appendChild(createHiddenField('query', JSON.stringify(query.query)));
        form.appendChild(createHiddenField('variables', JSON.stringify(query.variables)));
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    })
}
