// src/app.d.ts
declare global {
	namespace App {
		interface Locals {
			auth: import('lucia').AuthRequest;
			user: Lucia.UserAttributes;
			startTimer: number;
			error: string;
			errorId: string;
			errorStackTrace: string;
			message: unknown;
			track: unknown;
		}
		interface Error {
			code?: string;
			errorId?: string;
		}
	}
}

declare global {
	namespace Lucia {
		type UserAttributes = {
			id: string;
			email: string;
			name: string;
			token: string;
		};
	}
}

// THIS IS IMPORTANT!!!
export {};
