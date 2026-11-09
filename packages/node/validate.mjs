import { AjvJsonSchemaValidator } from "@modelcontextprotocol/client/validators/ajv";

// The MCP client's own Ajv engines, shared by every schema.
const engines = new AjvJsonSchemaValidator();

export function validator(schema) {
  const validate = engines.getValidator(schema);
  const check = value => {
    const { valid, errorMessage } = validate(value);
    check.errors = errorMessage;
    return valid;
  };
  return check;
}
