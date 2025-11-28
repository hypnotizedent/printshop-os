# Hot Folder & Auto-Archive System Architecture

> **Created:** November 27, 2025  
> **Status:** Design Complete  
> **Priority:** HIGH - Solves artwork organization and machine integration

---

## Overview

A file watcher system that:
1. **Syncs production files** from MinIO to machine hot folders
2. **Monitors machine output folders** for completed jobs
3. **Auto-archives files** after production with proper organization
4. **Logs all file movements** for audit trail

---

## System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PrintShop OS - Server                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────────────┐ │
│  │   MinIO     │───▶│  Hot Folder  │───▶│  Machine Network Folders   │ │
│  │  (artwork)  │    │   Service    │    │                            │ │
│  │             │    │              │    │  /screenpro-600/incoming/  │ │
│  │  /pending/  │    │  - Watches   │    │  /barudan/incoming/        │ │
│  │  /approved/ │    │  - Syncs     │    │  /dtg-printer/incoming/    │ │
│  │  /archive/  │    │  - Logs      │    │                            │ │
│  └─────────────┘    └──────────────┘    └────────────────────────────┘ │
│                            │                        │                   │
│                            │ watch                  │ watch             │
│                            ▼                        ▼                   │
│                     ┌──────────────────────────────────────────────┐   │
│                     │         File Event Log (Strapi)              │   │
│                     │                                              │   │
│                     │  - timestamp                                 │   │
│                     │  - event_type (sent_to_machine, completed,   │   │
│                     │               archived, modified)            │   │
│                     │  - file_path                                 │   │
│                     │  - order_id                                  │   │
│                     │  - machine_id                                │   │
│                     │  - operator (if known)                       │   │
│                     └──────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## MinIO Bucket Structure

```
printshop/
├── artwork/
│   ├── pending/              # Awaiting approval
│   │   └── order-{id}/
│   │       ├── original/     # Original customer files
│   │       └── converted/    # Production-ready files
│   │
│   ├── approved/             # Ready for production
│   │   └── order-{id}/
│   │       ├── screen-printing/
│   │       │   ├── front.psd
│   │       │   └── back.psd
│   │       ├── embroidery/
│   │       │   └── logo.dst
│   │       └── metadata.json
│   │
│   ├── in-production/        # Currently on machine queues
│   │   └── order-{id}/
│   │
│   └── archive/              # Completed jobs (organized by date + customer)
│       └── 2025/
│           └── 11/
│               └── inferno-studios/
│                   └── order-45678/
│                       ├── artwork/
│                       ├── production-log.json
│                       └── metadata.json
```

---

## Machine Hot Folder Structure

Each machine has a network-accessible folder:

```
/mnt/production/
├── screenpro-600/
│   ├── incoming/         # Files to print (synced from MinIO)
│   │   └── 45678_front_center.psd
│   ├── processing/       # Currently printing
│   └── completed/        # Done (watched for auto-archive)
│
├── barudan/
│   ├── incoming/         # DST files to embroider
│   ├── processing/
│   └── completed/
│
└── dtg-printer/
    ├── incoming/
    ├── processing/
    └── completed/
```

---

## Hot Folder Service

### Location
`services/production-dashboard/src/hot-folder/`

### Core Components

```typescript
// hot-folder.service.ts
interface HotFolderConfig {
  machineId: string;
  machineName: string;
  machineType: 'screen-printing' | 'embroidery' | 'dtg' | 'heat-transfer';
  paths: {
    incoming: string;
    processing: string;
    completed: string;
  };
  watchInterval: number; // ms
  filePatterns: string[]; // ['*.psd', '*.dst', etc]
}

interface FileEvent {
  id: string;
  timestamp: Date;
  eventType: 'sent_to_machine' | 'started_processing' | 'completed' | 'archived' | 'error';
  filePath: string;
  fileName: string;
  orderId: string;
  machineId: string;
  operatorId?: string;
  metadata?: Record<string, any>;
}
```

### Workflow

1. **Job Approved → Queue for Machine**
   - Admin marks job as "ready for production"
   - Service copies files from MinIO `/approved/` to machine's `/incoming/`
   - Logs `sent_to_machine` event

2. **File Picked Up by Machine**
   - Service watches for files moved from `/incoming/` to `/processing/`
   - Logs `started_processing` event
   - Updates job status in Strapi

3. **Job Completed**
   - Operator or machine moves file to `/completed/`
   - Service detects completion
   - Logs `completed` event
   - Triggers archive workflow

4. **Auto-Archive**
   - Service moves files from machine to MinIO `/archive/`
   - Organizes by year/month/customer/order
   - Cleans up machine folder
   - Logs `archived` event

---

## Strapi Content Types Needed

### `file-event` (New)
```json
{
  "kind": "collectionType",
  "collectionName": "file_events",
  "attributes": {
    "eventType": {
      "type": "enumeration",
      "enum": ["sent_to_machine", "started_processing", "completed", "archived", "error"]
    },
    "filePath": { "type": "string" },
    "fileName": { "type": "string" },
    "orderId": { "type": "string" },
    "machineId": { "type": "string" },
    "machineName": { "type": "string" },
    "operatorId": { "type": "string" },
    "metadata": { "type": "json" },
    "errorMessage": { "type": "text" }
  }
}
```

### `machine` (New)
```json
{
  "kind": "collectionType",
  "collectionName": "machines",
  "attributes": {
    "name": { "type": "string", "required": true },
    "type": {
      "type": "enumeration",
      "enum": ["screen-printing", "embroidery", "dtg", "heat-transfer", "cutting"]
    },
    "status": {
      "type": "enumeration",
      "enum": ["idle", "running", "maintenance", "offline"]
    },
    "hotFolderPath": { "type": "string" },
    "networkAddress": { "type": "string" },
    "lastSeen": { "type": "datetime" },
    "metadata": { "type": "json" }
  }
}
```

### `production-job` (Extension to Order)
Add to existing `order` content type:
```json
{
  "machineId": { "type": "string" },
  "machineQueue": { "type": "integer" }, // Position in queue
  "artworkStatus": {
    "type": "enumeration",
    "enum": ["pending", "approved", "sent_to_machine", "in_production", "completed", "archived"]
  },
  "artworkPath": { "type": "string" },
  "productionStarted": { "type": "datetime" },
  "productionCompleted": { "type": "datetime" }
}
```

---

## Implementation Priority

### Phase 1 (MVP) - Manual Sync + Basic Logging
- [ ] Create `machine` content type in Strapi
- [ ] Create `file-event` content type in Strapi
- [ ] Build basic file watcher service using `chokidar`
- [ ] Log file events to Strapi
- [ ] Manual button to "Send to Machine" from frontend

### Phase 2 - Automatic Archive
- [ ] Implement `/completed/` folder watcher
- [ ] Auto-move files to MinIO `/archive/`
- [ ] Generate production-log.json with timing data
- [ ] Clean up machine folders after archival

### Phase 3 - Full Automation
- [ ] Automatic job-to-machine assignment based on type
- [ ] Queue management in frontend
- [ ] Real-time status updates via WebSocket
- [ ] Integration with machine APIs (if available)

---

## Configuration Example

`services/production-dashboard/.env`:
```env
# MinIO
MINIO_ENDPOINT=100.92.156.118
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=printshop

# Machine Hot Folders (mounted via NFS/SMB)
MACHINE_SCREENPRO_PATH=/mnt/production/screenpro-600
MACHINE_BARUDAN_PATH=/mnt/production/barudan
MACHINE_DTG_PATH=/mnt/production/dtg-printer

# Watch Interval
HOT_FOLDER_WATCH_INTERVAL=5000
```

---

## File Naming Convention

When sending files to machines, use this format:
```
{orderNumber}_{location}_{timestamp}.{ext}

Examples:
45678_front_center_1732752000.psd
45678_left_chest_1732752000.dst
45679_full_back_1732752100.psd
```

This allows:
- Quick order lookup from filename
- Multiple files per order
- Timestamp for ordering

---

## Network Mount Setup (docker-host)

```bash
# Create mount points
sudo mkdir -p /mnt/production/screenpro-600
sudo mkdir -p /mnt/production/barudan
sudo mkdir -p /mnt/production/dtg-printer

# Mount via SMB (example for Windows machines)
sudo mount -t cifs //192.168.12.xxx/production /mnt/production/screenpro-600 \
  -o username=printshop,password=xxx,uid=1000,gid=1000

# Or add to /etc/fstab for persistent mounts
```

---

## Security Considerations

1. **Network Isolation**: Machines on separate VLAN if possible
2. **File Validation**: Check file types before accepting
3. **Audit Trail**: All file movements logged with timestamps
4. **Backup**: MinIO versioning enabled on /archive/
5. **Access Control**: Only production-dashboard service can write to hot folders

---

## Next Steps

1. Create Strapi content types (`machine`, `file-event`)
2. Set up test hot folder on docker-host
3. Implement basic file watcher in production-dashboard
4. Test with one machine (Screenpro 600)
5. Expand to other machines

---

*Document maintained by: @ronnyworks*  
*Last Updated: November 27, 2025*
