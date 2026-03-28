#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/starter-kit-api}"
ENV_FILE="${APP_DIR}/.env.production"
CONTAINER_NAME="${CONTAINER_NAME:-starter-kit-api}"
APP_PORT="${APP_PORT:-5000}"
IMAGE_REF="${IMAGE_REF:?IMAGE_REF is required}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
FULL_IMAGE="${IMAGE_REF}:${IMAGE_TAG}"
SEQUELIZE_CLI="./node_modules/.bin/sequelize-cli"

# Use sudo when this user cannot talk to the daemon (common if SSH session predates `usermod -aG docker`).
DOCKER=(docker)
if ! docker info >/dev/null 2>&1; then
  if sudo docker info >/dev/null 2>&1; then
    DOCKER=(sudo docker)
    echo ">>> Using sudo for Docker (add ec2-user to group docker and re-login to avoid this)."
  else
    echo "Cannot access Docker. Install/start docker and ensure this user may use it (or sudo)." >&2
    exit 1
  fi
fi

mkdir -p "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Create it on the EC2 host before deploying."
  exit 1
fi

required_env_keys=(DB_HOST DB_USER DB_PASSWORD DB_NAME)
missing_env_keys=()
for key in "${required_env_keys[@]}"; do
  if ! grep -qE "^${key}=" "${ENV_FILE}"; then
    missing_env_keys+=("${key}")
  fi
done
if (( ${#missing_env_keys[@]} > 0 )); then
  echo "Missing required DB env keys in ${ENV_FILE}: ${missing_env_keys[*]}"
  exit 1
fi

if [[ -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "GHCR credentials are required on the remote host."
  exit 1
fi

cd "${APP_DIR}"

export $(grep -v '^#' "${ENV_FILE}" | xargs)

printf '%s' "${GHCR_TOKEN}" | "${DOCKER[@]}" login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

PREVIOUS_IMAGE="$("${DOCKER[@]}" inspect --format='{{.Config.Image}}' "${CONTAINER_NAME}" 2>/dev/null || true)"

"${DOCKER[@]}" pull "${FULL_IMAGE}"

run_api() {
  local image="$1"
  "${DOCKER[@]}" rm -f "${CONTAINER_NAME}" 2>/dev/null || true
  "${DOCKER[@]}" run -d \
    --name "${CONTAINER_NAME}" \
    --network host \
    --restart unless-stopped \
    --env-file "${ENV_FILE}" \
    -e NODE_ENV=production \
    -e "PORT=${APP_PORT}" \
    --health-cmd="curl -fsS http://127.0.0.1:${APP_PORT}/healthz >/dev/null || exit 1" \
    --health-interval=30s \
    --health-timeout=5s \
    --health-retries=5 \
    --health-start-period=20s \
    "${image}"
}

echo ">>> Running DB migrations..."
"${DOCKER[@]}" run --rm --network host \
  --env-file "${ENV_FILE}" \
  "${FULL_IMAGE}" \
  "${SEQUELIZE_CLI}" db:migrate --env production
echo ">>> Migrations complete."

# Seeders: config uses seederStorage 'sequelize' → completed seeds live in SequelizeData.
# db:seed:all only runs *pending* seeders; already-applied files are not re-run (no duplicate runs).
# Set SKIP_DB_SEED=1 or true on the host env (export before deploy) or in CI to skip this block entirely.
if [[ "${SKIP_DB_SEED:-}" == "1" || "${SKIP_DB_SEED:-}" == "true" ]]; then
  echo ">>> Skipping db:seed:all (SKIP_DB_SEED is set)."
else
  echo ">>> Running DB seeders (pending only; already seeded files are skipped)..."
  "${DOCKER[@]}" run --rm --network host \
    --env-file "${ENV_FILE}" \
    "${FULL_IMAGE}" \
    "${SEQUELIZE_CLI}" db:seed:all --env production
  echo ">>> Seeders complete."
fi

echo ">>> Starting API container..."
run_api "${FULL_IMAGE}"

# Wait for Docker health (or running if no health yet). Max ~150s then fail + rollback — never indefinite.
for attempt in $(seq 1 30); do
  health_status="$("${DOCKER[@]}" inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${CONTAINER_NAME}" 2>/dev/null || true)"
  echo ">>> Waiting for API (${attempt}/30): ${health_status:-unknown}"

  if [[ "${health_status}" == "healthy" || "${health_status}" == "running" ]]; then
    echo ">>> API is up (${health_status})."
    break
  fi

  if [[ "${attempt}" -eq 30 ]]; then
    echo "Deployment health check failed."
    echo "Container logs:"
    "${DOCKER[@]}" logs "${CONTAINER_NAME}" 2>&1 || true

    if [[ -n "${PREVIOUS_IMAGE}" ]]; then
      echo ">>> Rolling back to ${PREVIOUS_IMAGE}"
      run_api "${PREVIOUS_IMAGE}"
    fi

    exit 1
  fi

  sleep 5
done

echo ">>> On this host after deploy (compare when you SSH — same machine as EC2_HOST in GitHub):"
"${DOCKER[@]}" ps -a

mapfile -t image_ids < <("${DOCKER[@]}" images "${IMAGE_REF}" --format '{{.ID}}' | awk '!seen[$1]++')

if (( ${#image_ids[@]} > 2 )); then
  "${DOCKER[@]}" rmi -f "${image_ids[@]:2}" || true
fi

"${DOCKER[@]}" logout ghcr.io || true
