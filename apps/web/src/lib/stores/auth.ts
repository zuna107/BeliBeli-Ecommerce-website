import type { AuthUser } from '$lib/api/auth'

// ─── State ───────────────────────────────────────────────────────────────────

let _user = $state<AuthUser | null>(null)
let _accessToken = $state<string | null>(null)
let _initialized = $state(false)

// ─── Store object (exported as singleton) ────────────────────────────────────

export const authStore = {
  get user() { return _user },
  get accessToken() { return _accessToken },
  get initialized() { return _initialized },
  get isLoggedIn() { return _user !== null && _accessToken !== null },

  setUser(user: AuthUser | null) { _user = user },
  setToken(token: string | null) { _accessToken = token },
  setInitialized(v: boolean) { _initialized = v },

  login(user: AuthUser, token: string) {
    _user = user
    _accessToken = token
    _initialized = true
  },

  logout() {
    _user = null
    _accessToken = null
  },
}
