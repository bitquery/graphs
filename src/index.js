import SankeyEditor from './reactComponents/SankeyEditor'
import SankeyRenderer from './reactComponents/SankeyRenderer'
import GraphEditor from './reactComponents/GraphEditor'
import GraphRenderer from './reactComponents/GraphRenderer'


class SankeyPlugin {
	constructor() {
		this.id = 'sankey'
		this.name = 'Sankey'
		this.editor = SankeyEditor
		this.renderer = SankeyRenderer
	}
	supportsModel(model) {
		for (let key in model) {
			return !key.includes('.') || model[key].typeInfo.toString()[0]==='[' && model[key].typeInfo.toString().slice(-2, -1)!=='0'
		}
	}
}

class GraphPlugin {
	constructor() {
		this.id = 'graph'
		this.name = 'Graph'
		this.editor = GraphEditor
		this.renderer = GraphRenderer
	}
	supportsModel(model) {
		for (let key in model) {
			return !key.includes('.') || model[key].typeInfo.toString()[0]==='[' && model[key].typeInfo.toString().slice(-2, -1)!=='0'
		}
	}
}

export let graphPlugins = [new SankeyPlugin(), new GraphPlugin()]