import { neon } from '@neondatabase/serverless';

export default function Page() {
  async function create(formData: FormData) {
    'use server';

    const sql = neon(process.env.POSTGRES_URL!);
    const comment = String(formData.get('comment') ?? '');

    // ensure table exists (dev convenience)
    await sql`CREATE TABLE IF NOT EXISTS comments (
      id serial PRIMARY KEY,
      comment text
    )`;

    // tagged template with interpolation (safe)
    await sql`INSERT INTO comments (comment) VALUES (${comment})`;
  }

  return (
    <form action={create}>
      <input type="text" placeholder="write a comment" name="comment" />
      <button type="submit">Submit</button>
    </form>
  );
}
