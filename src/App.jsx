import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import XmlValidator from './pages/XmlValidator'
import XmlFormatter from './pages/XmlFormatter'
import XmlTransformer from './pages/XmlTransformer'
import Home from './pages/Home'
import { UserManager } from 'oidc-client-ts'
import Avatar from './components/Avatar'

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // OAuth2 configuration using environment variables
  const oidcConfig = {
    authority: import.meta.env.VITE_OAUTH_AUTHORITY,
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
    redirect_uri: `${window.location.origin}${import.meta.env.VITE_OAUTH_REDIRECT_URI}`,
    response_type: import.meta.env.VITE_OAUTH_RESPONSE_TYPE,
    scope: import.meta.env.VITE_OAUTH_SCOPE,
    post_logout_redirect_uri: `${window.location.origin}${import.meta.env.VITE_OAUTH_POST_LOGOUT_REDIRECT_URI}`,
    loadUserInfo: true,
  }

  const userManager = new UserManager(oidcConfig)
  let inFlight = false
  // Handle callback from identity provider
  const handleLoginCallback = useCallback((() => {
    let inFlight = false
    return async () => {
      if (inFlight) return false
      inFlight = true
      try {
        const user = await userManager.signinRedirectCallback();
        setUser(user)
        setIsAuthenticated(true)
        localStorage.setItem('user', JSON.stringify(user))
        return true
      } catch (error) {
        console.error('Login callback error:', error)
        return false
      } finally {
        inFlight = false
      }
    }
  })(), [userManager])

  // Check for user in localStorage on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if there's a stored user in localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error)
        // Clear potentially corrupted data
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])


  const login = async () => {
    await userManager.signinRedirect()
  }

  const logout = async () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('user')
    await userManager.signoutSilent()
  }

  if (isLoading) {
    return <div>Loading...</div> 
  }

  return (
    <>
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 font-bold text-xl">XML Tools</Link>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">Home</Link>
                  <Link to="/validator" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">XML Validator</Link>
                  <Link to="/formatter" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">XML Formatter</Link>
                  <Link to="/transformer" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">XML Transformer</Link>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">{user?.profile?.name}</span>
                    <Avatar src={user?.profile?.picture || ''} />
                    <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">Logout</button>
                  </div>
                ) : (
                  <button onClick={login} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">Login</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/validator" element={<XmlValidator />} />
          <Route path="/formatter" element={<XmlFormatter />} />
          <Route path="/transformer" element={<XmlTransformer />} />
          <Route path="/callback" element={
            <CallbackHandler handleLoginCallback={handleLoginCallback} />
          } />
        </Routes>
      </div>
    </>
  )
}

// Callback handler component
const CallbackHandler = ({ handleLoginCallback }) => {
  const [done, setDone] = useState(false)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    ;(async () => {
      await handleLoginCallback()
      // clean up the URL so even StrictMode remounts won’t re-call
      window.history.replaceState({}, document.title, '/')
      setDone(true)
    })()
  }, [handleLoginCallback])

  if (!done) {
    return (
      <div className="text-center mt-5">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" role="status">
          <span className="sr-only">Loading…</span>
        </div>
        <p className="mt-3">Processing login, please wait…</p>
      </div>
    )
  }

  return <Navigate to="/" replace />
}

export default App