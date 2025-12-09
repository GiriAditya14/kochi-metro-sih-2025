import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getTrains } from '../services/api'

const DepotContext = createContext(null)

export function DepotProvider({ children }) {
  const [selectedDepot, setSelectedDepot] = useState('ALL')
  const [depotOptions, setDepotOptions] = useState(['MUTTOM', 'DEPOT2'])

  const updateFromTrains = useCallback((trains = []) => {
    const unique = new Set(depotOptions)
    trains.forEach(t => t?.depot_id && unique.add(t.depot_id))
    if (unique.size) {
      setDepotOptions(Array.from(unique))
    }
  }, [depotOptions])

  const refreshDepots = useCallback(async () => {
    try {
      const res = await getTrains()
      updateFromTrains(res.data?.trains || [])
    } catch (err) {
      console.error('Failed to fetch depots', err)
    }
  }, [updateFromTrains])

  useEffect(() => {
    refreshDepots()
  }, [refreshDepots])

  return (
    <DepotContext.Provider value={{
      selectedDepot,
      setSelectedDepot,
      depotOptions,
      refreshDepots,
      updateFromTrains
    }}>
      {children}
    </DepotContext.Provider>
  )
}

export const useDepot = () => {
  const ctx = useContext(DepotContext)
  if (!ctx) throw new Error('useDepot must be used within DepotProvider')
  return ctx
}


