import React, { useEffect } from 'react'
import { address_sankey } from '../lib'


function SankeyRenderer({ el, config, dataSource, displayedData }) {
  useEffect(() => {
    if (dataSource && config && config.data && dataSource.data) {
			console.log('address_sankey')
			address_sankey(el, dataSource, displayedData, {theme: config.theme})
    }
  }, [JSON.stringify(config), JSON.stringify(dataSource)])
  if (!dataSource) return <div></div>
  return (
    <div className="widget-display">
      <div style={{ width: '100%', overflowY: 'hidden' }} id={el} />
    </div>
  )
}

export default SankeyRenderer
