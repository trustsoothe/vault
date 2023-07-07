import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { Store } from 'webext-redux'

const store = new Store()

interface RootProps {
  children: React.ReactNode;
}

const Root: React.FC<RootProps> = ({ children }) => {
  const [storeReady, setStoreReady] = useState(false)

  useEffect(() => {
    console.log('in root', store)
    store.ready().then(() => {
      console.log('resolved')
      setStoreReady(true)
    }).catch((e) => console.log(e))
  }, [])

  if (!storeReady) {
    return null
  }

  return <Provider store={store}>{children}</Provider>
}

export default Root
