<script lang="ts">
	import type { LayoutData } from './$types'
	import { authStore } from '$lib/stores/auth'

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props()

	// Sync server user to client auth store on initial hydration
	$effect(() => {
		if (!authStore.initialized && data.user) {
			authStore.setUser(data.user as any)
			authStore.setInitialized(true)
		}
	})
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200 shadow-sm">
		<div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
			<a href="/" class="text-xl font-bold text-[#0095DA]">BeliBeli</a>
			<nav class="flex items-center gap-4 text-sm">
				{#if authStore.isLoggedIn}
					<span class="text-gray-600">Hi, {authStore.user?.name}</span>
					<a href="/logout" class="text-gray-500 hover:text-gray-800">Logout</a>
				{:else}
					<a href="/login" class="text-gray-600 hover:text-[#0095DA]">Login</a>
					<a
						href="/register"
						class="bg-[#0095DA] text-white px-4 py-1.5 rounded hover:bg-[#007bb5] transition"
					>
						Register
					</a>
				{/if}
			</nav>
		</div>
	</header>

	<main>
		{@render children()}
	</main>
</div>

