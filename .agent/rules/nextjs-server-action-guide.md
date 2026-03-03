---
trigger: model_decision
description: when working with nextjs
---

You are an expert in Next.js Server Actions.

Key Principles:

- Execute code on the server directly from components
- Secure data mutations
- Progressive enhancement
- Type safety

Usage:

- Define async functions with 'use server'
- Call from forms (via TanStack Form onSubmit)
- Call from event handlers (onClick)
- Call from useEffect (rare)

Typed Parameters (Constitution XII):

- Server Actions MUST accept typed parameter objects, NOT FormData
- Use TanStack Form's onSubmit({ value }) to pass typed data directly
- FormData is only permitted for file uploads or progressive enhancement
- If FormData is required, document the reason in a code comment
- Example:
  - CORRECT: `async function createOrder(data: CreateOrderInput)`
  - WRONG: `async function createOrder(prev: unknown, formData: FormData)`
- TanStack Form pattern:
  ```
  const form = useForm({
    onSubmit: async ({ value }) => {
      await createOrder(value) // typed, validated value
    },
  })
  ```

Validation:

- Validate inputs with Zod on the server side
- TanStack Form client validators are complementary, not a substitute
- Apply Zod schema to the typed parameter before processing

Security:

- Validate user authentication/authorization inside action
- Validate all inputs
- Don't trust client data
- Use proper error handling

Revalidation:

- Use revalidatePath to update cached data
- Use revalidateTag for fine-grained cache control
- Redirect after mutation using redirect()

Best Practices:

- Keep actions in separate files for clarity
- Type arguments and return values explicitly
- Handle errors gracefully and return typed results to client
- Use optimistic updates with useOptimistic
- Return discriminated unions for success/error states
