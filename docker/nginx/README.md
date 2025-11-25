Build an nginx image with brotli support

This folder contains a multi-stage Dockerfile that compiles nginx with the
third-party `ngx_brotli` module so nginx can serve Brotli-compressed files
(`*.br`) transparently. Use this image as the base for serving the frontend
`build/` output when you want nginx to prefer precompressed files.

How it works

- The builder stage downloads nginx source and the `ngx_brotli` module and
  compiles nginx with the module included.
- The final stage is a minimal Alpine image with the compiled nginx binary and
  configuration copied into `/etc/nginx`.

Build

From the repository root run:

```bash
docker build -f docker/nginx/Dockerfile.brotli -t your-registry/nginx-brotli:latest docker/nginx
```

Use

- Tag and push `your-registry/nginx-brotli:latest` to your registry.
- Update your `frontend/Dockerfile.prod` or k8s manifests to use this image as
  the nginx runtime if you want nginx to handle brotli at the server layer.

Notes

- Building nginx from source in Docker can take time (~1-3 minutes depending
  on the host). CI pipelines should cache layers or build out-of-band.
- The image currently enables `gzip_static` and compiles ngx_brotli so ngx_brotli
  will be available. If you prefer dynamic modules or different nginx flags,
  edit `Dockerfile.brotli` accordingly.
