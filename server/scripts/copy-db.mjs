// Copy every collection (documents + indexes) from one MongoDB database to another.
//
//   SOURCE_URI=mongodb://127.0.0.1:27017/goldstar \
//   TARGET_URI='mongodb+srv://user:pass@cluster.mongodb.net/goldstar?retryWrites=true&w=majority' \
//   node scripts/copy-db.mjs [--dry-run] [--force]
//
// Both URIs must name a database. The target must be empty unless --force is given (then existing
// documents with the same _id are replaced; nothing in the target is deleted). The source is only read.
import { createRequire } from 'node:module';

// Use the driver that mongoose installs, so this script needs no extra dependency.
const require = createRequire(import.meta.url);
const { MongoClient } = require('mongodb');

const args = new Set(process.argv.slice(2));
const unknown = [...args].filter((a) => a !== '--dry-run' && a !== '--force');
if (unknown.length) fail(`Unknown option(s): ${unknown.join(' ')}. Use --dry-run and/or --force.`);
const dryRun = args.has('--dry-run');
const force = args.has('--force');

const { SOURCE_URI, TARGET_URI } = process.env;
if (!SOURCE_URI || !TARGET_URI) fail('Set SOURCE_URI and TARGET_URI (each ending in /<database name>).');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function dbNameOf(uri) {
  try {
    const name = decodeURIComponent(new URL(uri).pathname.replace(/^\//, ''));
    return name || null;
  } catch {
    return null;
  }
}

/** Host + db with credentials removed, for logging. */
function describe(uri) {
  try {
    const u = new URL(uri);
    return `${u.host}/${dbNameOf(uri)}`;
  } catch {
    return '(unparseable URI)';
  }
}

const sourceName = dbNameOf(SOURCE_URI);
const targetName = dbNameOf(TARGET_URI);
if (!sourceName || !targetName) fail('Both SOURCE_URI and TARGET_URI must include a database name, e.g. mongodb://host:27017/goldstar');
if (new URL(SOURCE_URI).host === new URL(TARGET_URI).host && sourceName === targetName) fail('SOURCE_URI and TARGET_URI point at the same database.');

const BATCH = 500;
const source = new MongoClient(SOURCE_URI, { serverSelectionTimeoutMS: 8000 });
const target = new MongoClient(TARGET_URI, { serverSelectionTimeoutMS: 15000 });

try {
  await Promise.all([source.connect(), target.connect()]);
  const src = source.db(sourceName);
  const dst = target.db(targetName);
  console.log(`${dryRun ? '[dry run] ' : ''}Copying ${describe(SOURCE_URI)}  ->  ${describe(TARGET_URI)}`);

  const collections = (await src.listCollections({ type: 'collection' }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();

  const rows = [];
  let targetDocs = 0;
  for (const name of collections) {
    const srcCount = await src.collection(name).countDocuments();
    const dstCount = await dst.collection(name).countDocuments();
    targetDocs += dstCount;
    rows.push({ name, srcCount, dstCount });
  }
  console.table(rows.map((r) => ({ collection: r.name, source: r.srcCount, 'target now': r.dstCount })));

  if (targetDocs > 0 && !force) {
    fail(`Target database "${targetName}" already has ${targetDocs} document(s). Refusing to copy; re-run with --force to overwrite matching _ids.`);
  }
  if (dryRun) {
    console.log('Dry run only: nothing was written.');
  } else {
    for (const { name, srcCount } of rows) {
      const from = src.collection(name);
      const to = dst.collection(name);

      // Indexes first (skips the implicit _id index). Unique indexes are safe on an empty or matching target.
      const indexes = (await from.indexes()).filter((ix) => ix.name !== '_id_');
      for (const ix of indexes) {
        const { v, key, name: ixName, ns, ...options } = ix;
        await to.createIndex(key, { ...options, name: ixName });
      }

      let copied = 0;
      let batch = [];
      const flush = async () => {
        if (!batch.length) return;
        await to.bulkWrite(
          batch.map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } })),
          { ordered: false },
        );
        copied += batch.length;
        batch = [];
      };
      for await (const doc of from.find({})) {
        batch.push(doc);
        if (batch.length >= BATCH) await flush();
      }
      await flush();
      console.log(`  ${name}: ${copied}/${srcCount} documents, ${indexes.length} index(es)`);
    }
    // Verify.
    let ok = true;
    for (const { name, srcCount } of rows) {
      const n = await dst.collection(name).countDocuments();
      if (n < srcCount) {
        ok = false;
        console.error(`  MISMATCH ${name}: source ${srcCount}, target ${n}`);
      }
    }
    if (!ok) process.exitCode = 1;
    else console.log('Done. Counts match.');
  }
} catch (err) {
  console.error(`Copy failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await Promise.allSettled([source.close(), target.close()]);
}
