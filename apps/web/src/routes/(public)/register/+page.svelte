<script lang="ts">
	import { goto } from '$app/navigation'
	import { register } from '$lib/api/auth'
	import { registerSchema } from '@beibeli/shared'

	let name = $state('')
	let email = $state('')
	let password = $state('')
	let phone = $state('')
	let loading = $state(false)
	let success = $state(false)
	let error = $state('')
	let fieldErrors = $state<Record<string, string>>({})

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		error = ''
		fieldErrors = {}

		const body = { name, email, password, ...(phone ? { phone } : {}) }
		const parsed = registerSchema.safeParse(body)
		if (!parsed.success) {
			for (const issue of parsed.error.errors) {
				const field = issue.path[0]?.toString() ?? ''
				fieldErrors[field] = issue.message
			}
			return
		}

		loading = true
		try {
			await register(parsed.data)
			success = true
		} catch (err: any) {
			if (err?.code === 'VALIDATION_ERROR' && err.details) {
				for (const d of err.details) fieldErrors[d.field] = d.message
			} else {
				error = err?.error ?? 'Registration failed. Please try again.'
			}
		} finally {
			loading = false
		}
	}
</script>

<svelte:head>
	<title>Create Account — BeliBeli</title>
</svelte:head>

<section class="flex items-center justify-center min-h-[80vh] px-4 py-12">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="text-5xl mb-4">📧</div>
				<h2 class="text-xl font-bold text-gray-800 mb-2">Check your email</h2>
				<p class="text-sm text-gray-500 mb-4">
					We sent a 6-digit OTP to <strong>{email}</strong>. Enter it to verify your account.
				</p>
				<a
					href="/verify-email?email={encodeURIComponent(email)}"
					class="inline-block bg-[#0095DA] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#007bb5] transition"
				>
					Verify now
				</a>
			</div>
		{:else}
			<h1 class="text-2xl font-bold text-gray-800 mb-1">Create an account</h1>
			<p class="text-sm text-gray-500 mb-6">
				Already have one?
				<a href="/login" class="text-[#0095DA] hover:underline">Sign in</a>
			</p>

			{#if error}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
					{error}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4" novalidate>
				<!-- Name -->
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full name</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						autocomplete="name"
						placeholder="Jane Doe"
						class="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095DA]
							{fieldErrors.name ? 'border-red-400' : 'border-gray-300'}"
					/>
					{#if fieldErrors.name}
						<p class="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
					{/if}
				</div>

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
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
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

				<!-- Phone (optional) -->
				<div>
					<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
						Phone <span class="text-gray-400 font-normal">(optional)</span>
					</label>
					<input
						id="phone"
						type="tel"
						bind:value={phone}
						autocomplete="tel"
						placeholder="08xxxxxxxxxx"
						class="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095DA]
							{fieldErrors.phone ? 'border-red-400' : 'border-gray-300'}"
					/>
					{#if fieldErrors.phone}
						<p class="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[#0095DA] text-white py-2.5 rounded-lg font-medium
						hover:bg-[#007bb5] transition disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? 'Creating account…' : 'Create account'}
				</button>
			</form>
		{/if}
	</div>
</section>
