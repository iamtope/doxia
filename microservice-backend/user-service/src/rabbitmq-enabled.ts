/** Enable only when a real broker is available (e.g. docker-compose). Omit on Fly. */
export function rabbitEnabled(): boolean {
  return process.env.RABBITMQ_ENABLED === 'true';
}
