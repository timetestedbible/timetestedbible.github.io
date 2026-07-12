# Versioned experiment runs

Each run receives its own directory. Commit completed runs when their manifest,
input snapshot, exact requests, raw provider responses, normalized responses,
and generated summaries have been reviewed for accidental secrets.

API keys are read from environment variables and are never written here.
