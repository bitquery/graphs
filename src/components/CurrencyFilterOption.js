export const CurrencyFilterOption = (value, currency, name, symbol) => {
	return `<option value="${value}" ${
						value == currency ? 'selected=selected' : ''
					}>${name} (${symbol})</option>`
}