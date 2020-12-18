export const DepthLevel = (inboundDepth, outboundDepth) => {
	return `<div class="depth-level">
						<div>Depth level</div>
						<label class="depth-level__label" for="income-level">Inbound</label>
						<input class="depth-level__input" id="inbound-level" name="inbound-level" type="number" min="1" max="25" value="${inboundDepth}" oninput="this.value = 
						!!this.value && Math.abs(this.value) >= 0 ? Math.abs(this.value) : null"/>
						<label class="depth-level__label" for="outcome-level">Outbound</label>
						<input class="depth-level__input" id="outbound-level" name="outbound-level" type="number" min="1" max="25" value="${outboundDepth}" oninput="this.value = 
						!!this.value && Math.abs(this.value) >= 0 ? Math.abs(this.value) : null"/>
					</div>`
}