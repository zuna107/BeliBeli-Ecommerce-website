<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import { resetPassword } from '$lib/api/auth'
	import { resetPasswordSchema } from '@beibeli/shared'

	let token = $state(page.url.searchParams.get('token') ?? '')
	let password = $state('')
	let loading = $state(false)
	let success = $state(false)
	let error = $state('')
	let fieldErrors = $state<Record<string, string>>({})

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		error = ''
		fieldErrors = {}

		const parsed = resetPasswordSchema.safeParse({ token, password })
		if (!parsed.success) {
			for (const issue of parsed.error.errors) {
				const field = issue.path[0]?.toString() ?? ''
				fieldErrors[field] = issue.message
			}
			return
		}

		loading = true
		try {
			await resetPassword({ token, password })
			success = true
		} catch (err: any) {
			error = err?.error ?? 'Reset failed. The link may have expired.'
		} finally {
			loading = false
		}
	}
</script>

<svelte:head>
	<title>Reset Password — BeliBeli</title>
</svelte:head>

<section class="flex items-center justify-center min-h-[80vh] px-4 py-12">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="text-5xl mb-4">🔐</div>
				<h2 class="text-xl font-bold text-gray-800 mb-2">Password updated!</h2>
				<p class="text-sm text-gray-500 mb-4">You can now sign in with your new password.</p>
				<a
					href="/login"
					class="inline-block bg-[#0095DA] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#007bb5] transition"
				>
					Sign in
				</a>
			</div>
		{:else}
			<h1 class="text-2xl font-bold text-gray-800 mb-1">Set new password</h1>
			<p class="text-sm text-gray-500 mb-6">
				Choose a strong password for your account.
			</p>

			{#if !token}
				<div class="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
					Invalid or missing reset token. Please request a new reset link.
				</div>
			{:else}
				{#if error}
					<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
						{error}
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-4" novalidate>
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
							New password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							autocomplete="new-password"
							placeholder="Min. 8 chars, 1 uppercase, 1 number"
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
						{loading ? 'Saving…' : 'Reset password'}
					</button>
				</form>
			{/if}
		{/if}
	</div>
</section>
