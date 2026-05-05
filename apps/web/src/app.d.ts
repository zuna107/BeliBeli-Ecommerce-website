// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				sub: string
				email: string
				role: 'buyer' | 'seller' | 'admin'
			} | null
		}
		interface PageData {
			user?: App.Locals['user']
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
