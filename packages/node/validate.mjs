import { AjvJsonSchemaValidator } from "@modelcontextprotocol/client/validators/ajv";

// The MCP client's own Ajv, one engine per schema so contracts that reuse an $id stay apart.
export function validator(schema) {
  const validate = new AjvJsonSchemaValidator().getValidator(schema);
  const check = value => {
    const { valid, errorMessage } = validate(value);
    check.errors = errorMessage;
    return valid;
  };
  return check;
}
