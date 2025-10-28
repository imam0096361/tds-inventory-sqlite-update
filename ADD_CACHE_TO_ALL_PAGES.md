# Quick Guide: Adding Cache to Remaining Pages

## Pages to Update:
1. ✅ Dashboard - DONE
2. ✅ Department Summary - DONE
3. ✅ PC Info - DONE
4. ✅ Laptop Info - DONE
5. Server Info
6. Mouse Log
7. Keyboard Log
8. SSD Log
9. Headphone Log
10. Portable HDD Log
11. Product Inventory

## Standard Pattern for Each Page:

### 1. Add Import:
```typescript
import { cachedFetch, CACHE_CONFIG, invalidateCache } from '../utils/cache';
```

### 2. Update useEffect:
```typescript
// OLD:
useEffect(() => {
    fetch('/api/endpoint').then(res => res.json()).then(data => setData(data));
}, []);

// NEW:
useEffect(() => {
    cachedFetch<DataType[]>('/api/endpoint', {
        ttl: CACHE_CONFIG.STATIC_DATA,  // or LOGS for peripherals
        staleWhileRevalidate: true
    }).then(data => setData(data));
}, []);
```

### 3. Add Cache Invalidation:
```typescript
const handleSave = async () => {
    // ... existing save logic ...
    invalidateCache(['/api/endpoint']);
};

const handleDelete = async () => {
    // ... existing delete logic ...
    invalidateCache(['/api/endpoint']);
};
```

## Let me do this systematically for all remaining pages...

