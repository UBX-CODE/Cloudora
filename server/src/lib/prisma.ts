import dns from 'dns';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { config } from '../config/env';

// Fallback DNS resolver to ensure cloud database hostnames (Neon, AWS) resolve reliably
const originalLookup = dns.lookup;
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  // @ts-ignore
  dns.lookup = (hostname: string, options: any, callback: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    dns.resolve4(hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        if (options && options.all) {
          return callback(null, addresses.map((addr) => ({ address: addr, family: 4 })));
        }
        return callback(null, addresses[0], 4);
      }
      return originalLookup(hostname, options, callback);
    });
  };
} catch {
  // Fallback to default lookup if setServers is not supported
}

const adapter = new PrismaPg({
  connectionString: config.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
});
