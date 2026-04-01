#!/bin/zsh
set -eu

BASE_URL="${1:-https://greyworks.org}"
CURL_BIN="${CURL_BIN:-/usr/bin/curl}"
RG_BIN="${RG_BIN:-/Applications/Codex.app/Contents/Resources/rg}"
HOST_HEADER="${HOST_HEADER:-}"

curl_run() {
  if [[ -n "$HOST_HEADER" ]]; then
    "$CURL_BIN" -H "Host: $HOST_HEADER" "$@"
  else
    "$CURL_BIN" "$@"
  fi
}

check_code() {
  local path="$1"
  local expected="${2:-200}"
  local code
  code="$(curl_run -sSL -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")"
  if [[ "$code" != "$expected" ]]; then
    printf 'FAIL  %s -> expected %s, got %s\n' "$path" "$expected" "$code" >&2
    return 1
  fi
  printf 'OK    %s -> %s\n' "$path" "$code"
}

check_body_contains() {
  local path="$1"
  local pattern="$2"
  if ! curl_run -sSL "${BASE_URL}${path}" | "$RG_BIN" -q "$pattern"; then
    printf 'FAIL  %s -> missing pattern: %s\n' "$path" "$pattern" >&2
    return 1
  fi
  printf 'OK    %s -> contains %s\n' "$path" "$pattern"
}

check_body_absent() {
  local path="$1"
  local pattern="$2"
  if curl_run -sSL "${BASE_URL}${path}" | "$RG_BIN" -q "$pattern"; then
    printf 'FAIL  %s -> unexpected pattern: %s\n' "$path" "$pattern" >&2
    return 1
  fi
  printf 'OK    %s -> absent %s\n' "$path" "$pattern"
}

check_code "/"
check_code "/contact/"
check_code "/support/"
check_code "/privacy/"
check_code "/terms/"
check_code "/greyworks-logo-512.png"
check_code "/greyworks-banner.jpg"

check_body_contains "/" "Digital product surfaces, built for clarity."
check_body_contains "/" "What Greyworks improves first."
check_body_contains "/" "Explore services"
check_body_absent "/" "StockWise|BridgeLingo"
check_body_absent "/" "U\\.K\\.-based"
check_body_absent "/contact/" "U\\.K\\.-based"
check_body_absent "/privacy/" "U\\.K\\.-based"
check_body_absent "/terms/" "U\\.K\\.-based"
check_body_absent "/" "/script\\.js|/og-card\\.html"

printf '\nGreyworks smoke check passed for %s\n' "$BASE_URL"
