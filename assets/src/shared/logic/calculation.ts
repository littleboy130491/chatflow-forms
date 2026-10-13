import type { AnswerMap } from '../contracts';

export const CALCULATION_LIMIT = 1e12;
export function bounded(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > CALCULATION_LIMIT) throw new Error('Invalid calculation.');
  return value;
}

// A deliberately small arithmetic grammar, shared with PHP; never executable code.
export function calculate(expression: string, answers: AnswerMap = {}, variables: AnswerMap = {}, syntaxOnly = false): number {
  if (!expression.length || expression.length > 512 || /[^\t\n\r\f\v -~]/.test(expression)) throw new Error('Invalid calculation.');
  const tokens = expression.match(/(?:answer|variable)\.[a-z][a-z0-9_]{0,63}|[0-9]+(?:\.[0-9]+)?|[()+*/-]|[^\t\n\r\f\v ]/g) ?? [];
  if (tokens.length > 128) throw new Error('Invalid calculation.');
  let cursor = 0;
  const parse = (minimum = 0, depth = 0): number => {
    if (depth > 16) throw new Error('Invalid calculation.');
    const token = tokens[cursor++];
    let value: number;
    if (token === '+' || token === '-') value = (token === '-' ? -1 : 1) * parse(3, depth + 1);
    else if (token === '(') {
      value = parse(0, depth + 1);
      if (tokens[cursor++] !== ')') throw new Error('Invalid calculation.');
    } else if (token && /^(answer|variable)\.[a-z][a-z0-9_]{0,63}$/.test(token)) {
      const [source, key] = token.split('.'), raw = (source === 'answer' ? answers : variables)[key!];
      if (raw !== undefined && raw !== null && typeof raw !== 'number') throw new Error('Invalid calculation.');
      value = raw ?? 0;
    } else if (token && /^[0-9]+(?:\.[0-9]+)?$/.test(token)) value = Number(token);
    else throw new Error('Invalid calculation.');
    bounded(value);
    while (cursor < tokens.length) {
      const op = tokens[cursor]!, precedence = op === '+' || op === '-' ? 1 : op === '*' || op === '/' ? 2 : 0;
      if (!precedence || precedence < minimum) break;
      cursor++;
      const right = parse(precedence + 1, depth + 1);
      value = syntaxOnly ? 1 : bounded(op === '+' ? value + right : op === '-' ? value - right : op === '*' ? value * right : value / right);
    }
    return bounded(value);
  };
  const value = parse();
  if (cursor !== tokens.length) throw new Error('Invalid calculation.');
  return Math.floor(value * 1e6 + 0.5) / 1e6 || 0;
}

export function calculationReferences(expression: string): { source: string; key: string }[] {
  const refs = [...expression.matchAll(/(answer|variable)\.([a-z][a-z0-9_]{0,63})/g)].map(m => ({ source: m[1]!, key: m[2]! }));
  const answers: AnswerMap = {}, variables: AnswerMap = {};
  for (const ref of refs) (ref.source === 'answer' ? answers : variables)[ref.key] = 1;
  calculate(expression, answers, variables, true);
  return refs;
}
