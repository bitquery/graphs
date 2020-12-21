export const DepthLevel = (inboundDepth, outboundDepth) => {
	const rand = parseInt(Math.random() * 10000)
  return `<div class="depth-level">
						<h4 class="depth-level__header">Depth level</h4>
						
						<div class=depth-level__body>
							<label class="depth-level__label depth-level__label--inbound" for="inbound-level-${rand}">Inbound</label>

							<div class="depth-level__button-block">
								<button class="depth-level__button depth-level__button--increment" data-for="inbound-level-${rand}"></button>
								<button class="depth-level__button depth-level__button--decrement" data-for="inbound-level-${rand}"></button>
							</div>

							<input class="depth-level__input" id="inbound-level-${rand}" name="inbound-level" type="number" min="1" max="25" value="${inboundDepth}" oninput="this.value = 
							!!this.value && Math.abs(this.value) >= 0 ? Math.abs(this.value) : null"/>
							
							<input class="depth-level__input" id="outbound-level-${rand}" name="outbound-level" type="number" min="1" max="25" value="${outboundDepth}" oninput="this.value = 
							!!this.value && Math.abs(this.value) >= 0 ? Math.abs(this.value) : null"/>

							<div class="depth-level__button-block">
								<button class="depth-level__button depth-level__button--increment" data-for="outbound-level-${rand}"></button>
								<button class="depth-level__button depth-level__button--decrement" data-for="outbound-level-${rand}"></button>
							</div>

							<label class="depth-level__label  depth-level__label--outbound" for="outbound-level-${rand}">Outbound</label>
						</div>
					</div>`
}
