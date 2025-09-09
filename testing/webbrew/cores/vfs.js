<script>
const DB_NAME = 'lvfs';
const STORE_META = 'meta';
const STORE_DATA = 'data';
const CHUNK = 1 * 1024 * 1024; // 1 MiB

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'path' });
      }
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        const os = db.createObjectStore(STORE_DATA, { keyPath: ['path','idx'] });
        os.createIndex('byPath', 'path', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

class LVFS {
  constructor(db) { this.db = db; }

  // --- metadata ---
  async stat(path) {
    return this._get(STORE_META, path);
  }
  async putMeta(meta) {
    return this._put(STORE_META, meta);
  }
  async listDir(dirPath) {
    dirPath = dirPath.replace(/\/+$/,'') || '/';
    const tx = this.db.transaction(STORE_META, 'readonly');
    const store = tx.objectStore(STORE_META);
    return new Promise((resolve,reject)=>{
      const out = [];
      const req = store.openCursor();
      req.onerror = ()=>reject(req.error);
      req.onsuccess = (e)=>{
        const cur = e.target.result;
        if (!cur) return resolve(out);
        const p = cur.value.path;
        if (p !== dirPath && p.startsWith(dirPath.endsWith('/')?dirPath:dirPath+'/')) {
          const rel = p.slice(dirPath.length + (dirPath.endsWith('/')?0:1));
          if (!rel.includes('/')) out.push(cur.value);
        }
        cur.continue();
      };
    });
  }

  // --- data (chunked) ---
  async writeFile(path, blob) {
    // remove old chunks
    await this._deleteChunks(path);
    const size = blob.size;
    const n = Math.ceil(size / CHUNK);
    for (let i=0;i<n;i++) {
      const start = i*CHUNK;
      const end = Math.min(start+CHUNK, size);
      const chunk = blob.slice(start, end);
      await this._put(STORE_DATA, { path, idx:i, chunk });
    }
    const meta = { path, isDir:false, size, mtime: Date.now(), readOnly:false };
    await this.putMeta(meta);
    return meta;
  }

  async readFile(path, onChunk) {
    // onChunk: (ArrayBuffer, idx, total) => void|Promise
    const tx = this.db.transaction(STORE_DATA, 'readonly');
    const store = tx.objectStore(STORE_DATA);
    const idx = store.index('byPath');
    const req = idx.getAll(IDBKeyRange.only(path));
    return new Promise((resolve,reject)=>{
      req.onerror = ()=>reject(req.error);
      req.onsuccess = async ()=>{
        const rows = req.result.sort((a,b)=>a.idx-b.idx);
        const total = rows.length;
        for (const r of rows) {
          const ab = await r.chunk.arrayBuffer();
          // eslint-disable-next-line no-await-in-loop
          await onChunk(ab, r.idx, total);
        }
        resolve();
      };
    });
  }

  async mkdir(path) {
    const existing = await this.stat(path);
    if (existing) return existing;
    const meta = { path, isDir:true, size:0, mtime: Date.now(), readOnly:false };
    await this.putMeta(meta);
    return meta;
  }

  // --- internals ---
  _get(storeName, key) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve,reject)=>{
      const req = store.get(key);
      req.onerror = ()=>reject(req.error);
      req.onsuccess = ()=>resolve(req.result || null);
    });
  }
  _put(storeName, val) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve,reject)=>{
      const req = store.put(val);
      req.onerror = ()=>reject(req.error);
      req.onsuccess = ()=>resolve();
    });
  }
  async _deleteChunks(path) {
    const tx = this.db.transaction(STORE_DATA, 'readwrite');
    const store = tx.objectStore(STORE_DATA);
    const idx = store.index('byPath');
    return new Promise((resolve,reject)=>{
      const req = idx.openCursor(IDBKeyRange.only(path));
      req.onerror = ()=>reject(req.error);
      req.onsuccess = (e)=>{
        const cur = e.target.result;
        if (!cur) return resolve();
        cur.delete();
        cur.continue();
      };
    });
  }
}

let vfs;
openDB().then(db => vfs = new LVFS(db));
</script>
