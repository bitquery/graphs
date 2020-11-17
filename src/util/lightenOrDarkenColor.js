export function lightenOrDarkenColor(color, percent, darken=false) {
	const num = parseInt(color.replace("#",""),16),
				amt = Math.round(2.55 * percent),
	R = (num >> 16) + (darken ? amt : -amt),
	B = (num >> 8 & 0x00FF) + (darken ? amt : -amt),
	G = (num & 0x0000FF) + (darken ? amt : -amt);

	return `#${(0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1)}`;
}