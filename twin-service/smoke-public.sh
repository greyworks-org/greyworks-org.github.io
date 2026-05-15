#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8788}"
CURL_BIN="${CURL_BIN:-/usr/bin/curl}"
RG_BIN="${RG_BIN:-$(command -v rg || command -v grep)}"

check_code() {
  local path="$1"
  local expected="${2:-200}"
  local code
  code="$($CURL_BIN -sSL -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")"
  if [[ "$code" != "$expected" ]]; then
    printf 'FAIL  %s -> expected %s, got %s\n' "$path" "$expected" "$code" >&2
    return 1
  fi
  printf 'OK    %s -> %s\n' "$path" "$code"
}

check_contains() {
  local path="$1"
  local pattern="$2"
  if ! $CURL_BIN -sSL "${BASE_URL}${path}" | "$RG_BIN" -q "$pattern"; then
    printf 'FAIL  %s -> missing pattern: %s\n' "$path" "$pattern" >&2
    return 1
  fi
  printf 'OK    %s -> contains %s\n' "$path" "$pattern"
}

check_code "/healthz"
check_code "/utku-bozkurt/"
check_code "/utku-profile.jpeg"
check_contains "/healthz" '"chat_configured":true'
check_contains "/utku-bozkurt/" "Utku's Twin"
check_contains "/utku-bozkurt/" "Ask about experience, leadership, or what I've built\\."

printf '\nGreyworks twin public smoke check passed for %s\n' "$BASE_URL"
