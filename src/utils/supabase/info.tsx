const envProjectId = import.meta.env?.VITE_SUPABASE_PROJECT_ID as
	| string
	| undefined;
const envAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY as
	| string
	| undefined;

export const projectId = envProjectId || "";
export const publicAnonKey = envAnonKey || "";

if (!projectId || !publicAnonKey) {
	throw new Error(
		"Missing Supabase environment variables: VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY"
	);
}