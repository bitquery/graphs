export const DepthLevel = (inboundDepth, outboundDepth) => {
	return `<div class="depth-level">
						<div>Depth level</div>
						<label class="depth-level__label" for="income-level">Inbound</label>
						<input class="depth-level__input" id="inbound-level" name="inbound-level" type="number" min="1" max="15" value="${inboundDepth}"/>
						<label class="depth-level__label" for="outcome-level">Outbound</label>
						<input class="depth-level__input" id="outbound-level" name="outbound-level" type="number" min="1" max="15" value="${outboundDepth}"/>
					</div>`
}