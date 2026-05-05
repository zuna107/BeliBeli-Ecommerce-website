<script lang="ts">
	import { forgotPassword } from '$lib/api/auth'
	import { forgotPasswordSchema } from '@beibeli/shared'

	let email = $state('')
	let loading = $state(false)
	let sent = $state(false)
	let error = $state('')

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		error = ''

		const parsed = forgotPasswordSchema.safeParse({ email })
		if (!parsed.success) {
			error = parsed.error.errors[0].message
			return
		}

		loading = true
		try {
			await forgotPassword({ email })
			sent = true
		} catch (err: any) {
			error = err?.error ?? 'Request failed. Please try again.'
		} finally {
			loading = false
		}
	}
</script>

<svelte:head>
	<title>Forgot Password — BeliBeli</title>
</svelte:head>

<section class="flex items-center justify-center min-h-[80vh] px-4 py-12">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
		{#if sent}
			<div class="text-center py-4">
				<div class="text-5xl mb-4">📬</div>
				<h2 class="text-xl font-bold text-gray-800 mb-2">Check your inbox</h2>
				<p class="text-sm text-gray-500 mb-4">
					If an account with <strong>{email}</strong> exists, we sent a password reset link.
				</p>
				<a href="/login" class="text-[#0095DA] text-sm hover:underline">Back to login</a>
			</div>
		{:else}
			<h1 class="text-2xl font-bold text-gray-800 mb-1">Forgot password?</h1>
			<p class="text-sm text-gray-500 mb-6">
				Enter your email and we'll send a reset link.
			</p>

			{#if error}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
					{error}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4" novalidate>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						autocomplete="email"
						placeholder="you@example.com"
						class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
							focus:outline-none focus:ring-2 focus:ring-[#0095DA]"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[#0095DA] text-white py-2.5 rounded-lg font-medium
						hover:bg-[#007bb5] transition disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? 'Sending…' : 'Send reset link'}
				</button>
			</form>

			<p class="mt-4 text-center text-sm">
				<a href="/login" class="text-gray-500 hover:text-[#0095DA]">Back to login</a>
			</p>
		{/if}
	</div>
</section>
