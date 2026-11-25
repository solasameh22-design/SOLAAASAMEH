import bcrypt from 'bcryptjs';

const COST = 12; // higher is slower for attackers, and for you. 12 is a good start.

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

// If the email is unknown (hash is null) we still do one comparison,
// so a wrong email and a wrong password take about the same time.
let dummyHash: Promise<string> | null = null;
export async function checkPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) {
    dummyHash ??= bcrypt.hash('not-a-real-password', COST);
    await bcrypt.compare(plain, await dummyHash);
    return false;
  }
  return bcrypt.compare(plain, hash);
}
