<script lang="ts">
	import { goto } from '$app/navigation'
	import { login } from '$lib/api/auth'
	import { authStore } from '$lib/stores/auth'
	import { loginSchema } from '@beibeli/shared'

	let email = $state('')
	let password = $state('')
	let loading = $state(false)
	let error = $state('')
	let fieldErrors = $state<Record<string, string>>({})

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		error = ''
		fieldErrors = {}

		const parsed = loginSchema.safeParse({ email, password })
		if (!parsed.success) {
			for (const issue of parsed.error.errors) {
				const field = issue.path[0]?.toString() ?? ''
				fieldErrors[field] = issue.message
			}
			return
		}

		loading = true
		try {
			const data = await login({ email, password })
			authStore.login(data.user, data.accessToken)
			// Store token in memory — SvelteKit will use it for API calls
			// Redirect to home or intended page
			await goto('/')
		} catch (err: any) {
			error = err?.error ?? 'Login failed. Please try again.'
		} finally {
			loading = false
		}
	}
</script>

<svelte:head>
	<title>Login — BeliBeli</title>
</svelte:head>

<section class="flex items-center justify-center min-h-[80vh] px-4 py-12">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
		<h1 class="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
		<p class="text-sm text-gray-500 mb-6">
			Don't have an account?
			<a href="/register" class="text-[#0095DA] hover:underline">Register</a>
		</p>

		{#if error}
			<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-4" novalidate>
			<!-- Email -->
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					autocomplete="email"
					placeholder="you@example.com"
					class="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095DA]
						{fieldErrors.email ? 'border-red-400' : 'border-gray-300'}"
				/>
				{#if fieldErrors.email}
					<p class="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
				{/if}
			</div>

			<!-- Password -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
					<a href="/forgot-password" class="text-xs text-[#0095DA] hover:underline">
						Forgot password?
					</a>
				</div>
				<input
					id="password"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					placeholder="••••••••"
					class="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095DA]
						{fieldErrors.password ? 'border-red-400' : 'border-gray-300'}"
				/>
				{#if fieldErrors.password}
					<p class="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
				{/if}
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-[#0095DA] text-white py-2.5 rounded-lg font-medium
					hover:bg-[#007bb5] transition disabled:opacity-60 disabled:cursor-not-allowed"
			>
				{loading ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	</div>
</section>
