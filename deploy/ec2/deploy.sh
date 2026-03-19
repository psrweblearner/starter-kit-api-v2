#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/starter-kit-api}"
DEPLOY_ENV_FILE="${APP_DIR}/.deploy.env"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
ENV_FILE="${APP_DIR}/.env.production"
CONTAINER_NAME="${CONTAINER_NAME:-starter-kit-api}"
APP_PORT="${APP_PORT:-5000}"
IMAGE_REF="${IMAGE_REF:?IMAGE_REF is required}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
FULL_IMAGE="${IMAGE_REF}:${IMAGE_TAG}"
SEQUELIZE_CLI="./node_modules/.bin/sequelize-cli"

mkdir -p "${APP_DIR}"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Missing ${COMPOSE_FILE}"
  exit 1
fi

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

# Export environment variables from .env file
export $(grep -v '^#' "${ENV_FILE}" | xargs)

printf '%s' "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

PREVIOUS_IMAGE="$(docker inspect --format='{{.Config.Image}}' "${CONTAINER_NAME}" 2>/dev/null || true)"

cat > "${DEPLOY_ENV_FILE}" <<EOF
APP_IMAGE=${FULL_IMAGE}
CONTAINER_NAME=${CONTAINER_NAME}
APP_PORT=${APP_PORT}
EOF

# Export deploy environment variables
export $(cat "${DEPLOY_ENV_FILE}")

docker pull "${FULL_IMAGE}"
echo ">>> Running DB migrations..."
docker run --rm \
  --env-file "${ENV_FILE}" \
  "${FULL_IMAGE}" \
  "${SEQUELIZE_CLI}" db:migrate --env production
echo ">>> Migrations complete."
docker-compose -f "${COMPOSE_FILE}" down
docker-compose -f "${COMPOSE_FILE}" up -d --force-recreate

for attempt in $(seq 1 30); do
  health_status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${CONTAINER_NAME}" 2>/dev/null || true)"

  if [[ "${health_status}" == "healthy" || "${health_status}" == "running" ]]; then
    break
  fi

  if [[ "${attempt}" -eq 30 ]]; then
    echo "Deployment health check failed."
    echo "Container logs:"
    docker logs "${CONTAINER_NAME}" 2>&1 || true

    if [[ -n "${PREVIOUS_IMAGE}" ]]; then
      cat > "${DEPLOY_ENV_FILE}" <<EOF
APP_IMAGE=${PREVIOUS_IMAGE}
CONTAINER_NAME=${CONTAINER_NAME}
APP_PORT=${APP_PORT}
EOF
      export $(cat "${DEPLOY_ENV_FILE}")
      docker-compose -f "${COMPOSE_FILE}" down
      docker-compose -f "${COMPOSE_FILE}" up -d --force-recreate
      echo "Rolled back to ${PREVIOUS_IMAGE}"
    fi

    exit 1
  fi

  sleep 5
done

mapfile -t image_ids < <(docker images "${IMAGE_REF}" --format '{{.ID}}' | awk '!seen[$1]++')

if (( ${#image_ids[@]} > 2 )); then
  docker rmi -f "${image_ids[@]:2}" || true
fi

docker logout ghcr.io || true
