import React, { useEffect } from 'react'
import { address_graph } from '../lib'


function GraphRenderer({ el, config, dataSource, displayedData }) {
  useEffect(() => {
    if (dataSource && config && config.data && dataSource.data ) {
			console.log(dataSource)
			console.log('address_graph')
			address_graph(el, dataSource, displayedData, {theme: config.theme})
    }
  }, [JSON.stringify(config), JSON.stringify(dataSource)])
  if (!dataSource) return <div></div>
  return (
    <div className="widget-display">
      <div style={{ width: '100%', overflowY: 'hidden' }} id={el} key={el}/>
    </div>
  )
}

export default GraphRenderer
