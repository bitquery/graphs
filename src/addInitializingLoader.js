export const addInitializingLoader = (wrapper, container) => {
  const loading = $(`
		<div class="line-loader">
			<span>Loading...</span>
			<div class="line-loader__wrapper">
				<div class="line-loader__line"></div>
			</div>
			<span class="line-loader__start">0</span><span  class="line-loader__end">100</span>
		</div>
	`)

  wrapper.addClass('initializing')
  container.append(loading)
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
