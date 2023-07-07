import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import browser from 'webextension-polyfill'

const Popup = () => {
  const [count, setCount] = useState(0)
  const [currentURL, setCurrentURL] = useState<string>()

  useEffect(() => {
    browser.action.setBadgeText({ text: count.toString() })
  }, [count])

  useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(function (tabs) {
        setCurrentURL(tabs[0].url)
      })
  }, [])

  const openHomePage = () => {
    browser.tabs
      .create({
        active: true,
        url: 'home.html',
      })
  }

  return (
    <>
      <ul style={{ minWidth: '700px' }}>
        <li>Current URL: {currentURL}</li>
        <li>Current Time: {new Date().toLocaleTimeString()}</li>
      </ul>
      <button
        onClick={() => setCount(count + 1)}
        style={{ marginRight: '5px' }}
      >
        count up
      </button>
      <button onClick={openHomePage}>Open Home</button>
    </>
  )
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <Popup/>
  </React.StrictMode>,
)
