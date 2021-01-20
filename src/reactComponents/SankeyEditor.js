import React, { useEffect, useState } from 'react'
import { useFirstUpdate } from '../util/useFirstUpdate'
import WidgetOptions from './WidgetOptions'

function SankeyEditor({ model, config, setConfig, displayedData }) {
  const [theme, setTheme] = useState('')
  const themeOptions = { light: 'light', dark: 'dark' }
  const themeFunc = () => true

	useEffect(() => {
		setTheme('light')
	}, [])
  useFirstUpdate(() => {
    if (model) {
      var cfg = {
        data: displayedData,
        theme: theme,
      }
      setConfig(cfg)
    }
  }, [theme, displayedData])

  return (
    <div className="widget">
      <div className="widget-editor">
        <WidgetOptions
          value={theme}
          setValue={setTheme}
          condition={themeFunc}
          title={'Theme'}
          model={themeOptions}
        />
      </div>
    </div>
  )
}

export default SankeyEditor
