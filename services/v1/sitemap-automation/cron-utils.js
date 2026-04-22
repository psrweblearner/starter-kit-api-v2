'use strict';

const AppError = require('../../../utils/AppError');

function parseCronField(value, min, max) {
  const segments = String(value).split(',');
  const valid = new Set();

  for (const rawSegment of segments) {
    const segment = rawSegment.trim();
    if (!segment) throw new AppError('Invalid cron expression', 400);
    if (segment === '*') {
      for (let i = min; i <= max; i += 1) valid.add(i);
      continue;
    }

    const [base, stepRaw] = segment.split('/');
    const step = stepRaw ? Number(stepRaw) : 1;
    if (!Number.isInteger(step) || step < 1) {
      throw new AppError('Invalid cron step value', 400);
    }

    let rangeMin;
    let rangeMax;
    if (base === '*') {
      rangeMin = min;
      rangeMax = max;
    } else if (base.includes('-')) {
      const [a, b] = base.split('-').map((v) => Number(v));
      if (!Number.isInteger(a) || !Number.isInteger(b) || a > b) {
        throw new AppError('Invalid cron range value', 400);
      }
      rangeMin = a;
      rangeMax = b;
    } else {
      const single = Number(base);
      if (!Number.isInteger(single)) throw new AppError('Invalid cron value', 400);
      rangeMin = single;
      rangeMax = single;
    }

    if (rangeMin < min || rangeMax > max) {
      throw new AppError('Cron expression value out of range', 400);
    }

    for (let i = rangeMin; i <= rangeMax; i += step) valid.add(i);
  }

  if (!valid.size) throw new AppError('Invalid cron expression', 400);
  return valid;
}

function parseCronExpression(expression) {
  const fields = String(expression || '').trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new AppError('Cron expression must contain 5 fields', 400);
  }
  const [m, h, dom, mon, dow] = fields;
  return {
    minute: parseCronField(m, 0, 59),
    hour: parseCronField(h, 0, 23),
    dayOfMonth: parseCronField(dom, 1, 31),
    month: parseCronField(mon, 1, 12),
    dayOfWeek: parseCronField(dow, 0, 6),
  };
}

function cronMatchesDate(cron, date) {
  return (
    cron.minute.has(date.getUTCMinutes()) &&
    cron.hour.has(date.getUTCHours()) &&
    cron.dayOfMonth.has(date.getUTCDate()) &&
    cron.month.has(date.getUTCMonth() + 1) &&
    cron.dayOfWeek.has(date.getUTCDay())
  );
}

function computeNextRunAt(expression, fromDate = new Date()) {
  const cron = parseCronExpression(expression);
  const cursor = new Date(fromDate.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  for (let i = 0; i < 525600; i += 1) {
    if (cronMatchesDate(cron, cursor)) {
      return new Date(cursor.getTime());
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }

  throw new AppError('Could not compute next cron run time', 400);
}

module.exports = {
  parseCronExpression,
  computeNextRunAt,
};
