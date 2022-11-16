This is a fork of [actions/download-artifact@v3](https://github.com/actions/download-artifact) that supports retrying when downloading a single artifact.

This is intended to support the case where job A uploads the artifact and you want a step of parallel job B to download that artifact, waiting until it becomes available.

# What's new

- Optional retry failed download of a single artifact.

# Usage

See [action.yml](action.yml)

# Download a Single Artifact

Download with retry:
```yaml
steps:
- uses: ximon18/download-artifact@v3
  with:
    name: my-artifact
    maxTries: 10
    retryDelayMs: 60000
```

If `maxTries` is not specified or is <= 1 the behaviour is the same as the original action.

When `maxTries` > 1 this forked action will wait `retryDelayMs` milliseconds after failing to download the single artifact and will then retry upto `maxTries` times.

Warning: Setting `retryDelayMs` too low may result in over rate limit errors from the underlying GitHub APIs.