export const addFullScreenButton = (container) => {
  const fullScreenButton = $(
    `<div class="fullscreen-button" title="Minimize"><i class="fullscreen-button__icon fas fa-expand"></i></div>`
  )
  container.append(fullScreenButton)

  fullScreenButton.find('.fullscreen-button__icon').on('click', function() {
    const icon = $(this)
    $('#wrapper').toggleClass('fullscreen')
    icon.toggleClass('fa-expand')
    icon.toggleClass('fa-compress')
  })
}
