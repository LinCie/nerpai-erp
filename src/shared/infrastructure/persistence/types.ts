import type { ColumnType } from 'kysely'

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {
  // Tables will be added as migrations are created
  // After running migrations, use `bun run db:codegen` to generate types
  // Example after codegen:
  // users: {
  //   id: Generated<number>
  //   email: string
  //   name: string | null
  //   created_at: Generated<Date>
  // }
}
