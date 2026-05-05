<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import { verifyEmail, resendVerification } from '$lib/api/auth'
	import { verifyEmailSchema } from '@beibeli/shared'

	let email = $state(page.url.searchParams.get('email') ?? '')
	let token = $state('')
	let loading = $state(false)
	let resending = $state(false)
	let success = $state(false)
	let error = $state('')
	let fieldErrors = $state<Record<string, string>>({})
	let resendMessage = $state('')

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		error = ''
		fieldErrors = {}

		const parsed = verifyEmailSchema.safeParse({ email, token })
		if (!parsed.success) {
			for (const issue of parsed.error.errors) {
				const field = issue.path[0]?.toString() ?? ''
				fieldErrors[field] = issue.message
			}
			return
		}

		loading = true
		try {
			await verifyEmail({ email, token })
			success = true
		} catch (err: any) {
			error = err?.error ?? 'Verification failed. Please check your code.'
		} finally {
			loading = false
		}
	}

	async function handleResend() {
		if (!email) { error = 'Please enter your email first.'; return }
		resending = true
		resendMessage = ''
		error = ''
		try {
			const data = await resendVerification({ email })
			resendMessage = data.message
		} catch (err: any) {
			error = err?.error ?? 'Failed to resend verification code.'
		} finally {
			resending = false
		}
	}
</script>

<svelte:head>
	<title>Verify Email — BeliBeli</title>
</svelte:head>

<section class="flex items-center justify-center min-h-[80vh] px-4 py-12">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="text-5xl mb-4">✅</div>
				<h2 class="text-xl font-bold text-gray-800 mb-2">Email verified!</h2>
				<p class="text-sm text-gray-500 mb-4">Your account is now active. You can sign in.</p>
				<a
					href="/login"
					class="inline-block bg-[#0095DA] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#007bb5] transition"
				>
					Sign in
				</a>
			</div>
		{:else}
			<h1 class="text-2xl font-bold text-gray-800 mb-1">Verify your email</h1>
			<p class="text-sm text-gray-500 mb-6">Enter the 6-digit OTP sent to your email.</p>

			{#if error}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
					{error}
				</div>
			{/if}
			{#if resendMessage}
				<div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
					{resendMessage}
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
						placeholder="you@example.com"
						class="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095DA]
							{fieldErrors.email ? 'border-red-400' : 'border-gray-300'}"
					/>
					{#if fieldErrors.email}
						<p class="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
					{/if}
				</div>

				<!-- OTP -->
				<div>
					<label for="token" class="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
					<input
						id="token"
						type="text"
						bind:value={token}
						maxlength={6}
						inputmode="numeric"
						placeholder="123456"
						class="w-full px-3 py-2.5 border rounded-lg text-sm tracking-widest font-mono text-center
							focus:outline-none focus:ring-2 focus:ring-[#0095DA]
							{fieldErrors.token ? 'border-red-400' : 'border-gray-300'}"
					/>
					{#if fieldErrors.token}
						<p class="mt-1 text-xs text-red-500">{fieldErrors.token}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[#0095DA] text-white py-2.5 rounded-lg font-medium
						hover:bg-[#007bb5] transition disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? 'Verifying…' : 'Verify email'}
				</button>
			</form>

			<p class="mt-4 text-center text-sm text-gray-500">
				Didn't receive the code?
				<button
					onclick={handleResend}
					disabled={resending}
					class="text-[#0095DA] hover:underline disabled:opacity-60"
				>
					{resending ? 'Sending…' : 'Resend'}
				</button>
			</p>
		{/if}
	</div>
</section>
