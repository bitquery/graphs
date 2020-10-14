export const FullscreenButton = (fullscreen) => {
	return `<div class="fullscreen-button" title="Minimize"><i class="fullscreen-button__icon fas ${
						fullscreen ? 'fa-compress' : 'fa-expand'
					}"></i></div>`
}