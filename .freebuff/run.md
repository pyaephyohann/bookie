# Bookie Dev Server Run Doc

## How to Reproduce Artifacts

1. The `.env` file should already exist in the main checkout with database configuration.
2. `node_modules` should already be installed.

## How to Run the Server

```bash
# Start the dev server on port 3076
PORT=3076 npm run dev
```

Or using the detached method:

```bash
nohup sh -c 'PORT=3076 npm run dev' > /Users/ikki/Documents/projects/personal/bookie/.freebuff/preview.log 2>&1 < /dev/null &
echo "pid=$!"
disown
```

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `BOOKIE_AUTH_SECRET` - Admin authentication secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (optional for dev)
- `CLOUDINARY_API_KEY` - Cloudinary API key (optional for dev)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (optional for dev)

## Notes

- The server runs on http://localhost:3076
- Admin login requires admin credentials (create via `node scripts/create-admin.mjs`)
- Cloudinary uploads will fail gracefully if credentials are not configured
