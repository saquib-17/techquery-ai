import fs from 'fs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const env = dotenv.parse(fs.readFileSync('.env'));

async function grantPermissions() {
  const devUrl = env.MIGRATION_DATABASE_URL;
  const testUrl = env.TEST_MIGRATION_DATABASE_URL || env.TEST_DATABASE_URL;

  console.log('Granting permissions on dev database...');
  const prismaDev = new PrismaClient({
    datasources: { db: { url: devUrl } },
  });
  await prismaDev.$executeRawUnsafe(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE refresh_tokens TO techquery_runtime;'
  );
  await prismaDev.$disconnect();

  console.log('Granting permissions on test database...');
  const prismaTest = new PrismaClient({
    datasources: { db: { url: testUrl } },
  });
  await prismaTest.$executeRawUnsafe(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE refresh_tokens TO techquery_runtime;'
  );
  await prismaTest.$disconnect();

  console.log('Successfully granted DML permissions on refresh_tokens to techquery_runtime');
}

grantPermissions().catch((err) => {
  console.error('Failed to grant permissions:', err);
  process.exit(1);
});
