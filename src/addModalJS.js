export const addModalJS = (container, theme, title, JSCode, variables) => {
  const modalJS = $(`
	<div>
		<a class="badge badge-secondary open-btn">JS</a>
		<div class="graph-modal ${theme == 'dark' ? 'dark' : ''}" id="graph-modal-js" tabindex="-1">
				<div class="graph-modal-dialog">
						<div class="graph-modal-content">
								<div class="graph-modal-header">
										<button type="button" class="graph-modal-close close-btn" >&times;</button>
										<h4 class="graph-modal-title">${title}</h4>
								</div>
								<div class="graph-modal-body">
									<textarea>${JSCode}</textarea>
								</div>
								<div class="graph-modal-footer">
										<button type="button" class="btn btn-default close-btn">Close</button>
								</div>
						</div>
				</div>
		</div>
	</div>
	`)

	container.append(modalJS)

	const openModal = () => {
		const textarea = modalJS.find('textarea')
		textarea.text(textarea.text().replace(/query.request\(.*\)/, `query.request(${JSON.stringify(variables)})`))
		$('body').addClass('graph-modal-open')
		$('#graph-modal-js').addClass('graph-modal-shown')
	}

	const closeModal = () => {
		$('body').removeClass('graph-modal-open')
		$('#graph-modal-js').removeClass('graph-modal-shown')
	}

	modalJS.find('.open-btn').on('click', openModal)
	modalJS.find('.close-btn').on('click', closeModal)
}
