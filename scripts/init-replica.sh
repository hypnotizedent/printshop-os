#!/bin/bash
# Initialize MongoDB replica set for Appsmith

sleep 5

mongosh --quiet <<EOF
try {
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017' }]
  });
  print('Replica set initiated successfully');
} catch(e) {
  print('Replica set already initiated or error:', e);
}
EOF
