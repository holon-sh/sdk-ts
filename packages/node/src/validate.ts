import { AjvJsonSchemaValidator } from "@modelcontextprotocol/client/validators/ajv";
import type { CreateOptions } from "./runtime.js";

/** Checks a value against one JSON Schema; errors describes the last failure. */
export type Check = ReturnType<NonNullable<CreateOptions["validator"]>>;

// Contracts are module constants, so each schema compiles once however often createApps runs.
const checks = new WeakMap<object, Check>();

export function validator(schema: object): Check {
  let check = checks.get(schema);
  if (!check) checks.set(schema, check = compile(schema));
  return check;
}

// The MCP client's own Ajv, one engine per schema so contracts that reuse an $id stay apart.
function compile(schema: object): Check {
  const validate = new AjvJsonSchemaValidator().getValidator(schema);
  const check: Check = value => {
    const { valid, errorMessage } = validate(value);
    check.errors = errorMessage;
    return valid;
  };
  return check;
}
