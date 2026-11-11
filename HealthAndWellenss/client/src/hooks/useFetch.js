import { useCallback, useEffect, useState } from 'react'

// Data laane ka common hook: const { data, loading, error, reload } = useFetch(() => api.x(), [dep])
// "key" se pata chalta hai ki abhi wala data current deps ka hai ya purana (tab loading = true)
export const useFetch = (fetcher, deps = []) => {
  const [version, setVersion] = useState(0)
  const key = JSON.stringify([...deps, version])
  const [state, setState] = useState({ key: null, data: null, error: '' })

  useEffect(() => {
    let active = true
    fetcher()
      .then((res) => active && setState({ key, data: res.data, error: '' }))
      .catch((err) => active && setState((s) => ({ key, data: s.data, error: err.message })))
    return () => {
      active = false
    }
    // fetcher har render pe naya hota hai, isliye sirf key pe chalao
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }))
  }, [])

  return {
    data: state.data,
    loading: state.key !== key,
    error: state.key === key ? state.error : '',
    reload,
    setData,
  }
}

// Search box ke liye — user typing rok de tab hi value badle
export const useDebounced = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
