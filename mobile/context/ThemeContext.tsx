import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import { ColorScheme, DarkColors, LightColors } from '../constants/theme'

const STORAGE_KEY = '@nuvera_theme'

interface ThemeCtx {
  colors: ColorScheme
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx>({
  colors: LightColors,
  isDark: false,
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [isDark, setIsDark] = useState(systemScheme === 'dark')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved !== null) setIsDark(saved === 'dark')
    })
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{
      colors: isDark ? DarkColors : LightColors,
      isDark,
      toggle,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
