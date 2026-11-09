// holon-generated-apps-v1 app=checkout
import type { ToolClient, EndpointBinding, CreateOptions } from "holon-sh/runtime";
export { ToolCallError } from "holon-sh/runtime";
export type OrdersInputOrderId = string;
export type OrdersOutputTotal = number;
export type WithHyphenInputOrderId = string;
export type WithHyphenOutputTotal = number;
export interface Inputs {
  "orders": {
    "get_order": { "count"?: number; "orderId": OrdersInputOrderId; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
  "with-hyphen": {
    "get_order": { "count"?: number; "orderId": WithHyphenInputOrderId; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
}
export interface Outputs {
  "orders": {
    "get_order": { "total": OrdersOutputTotal; };
  };
  "with-hyphen": {
    "get_order": { "total": WithHyphenOutputTotal; };
  };
}
export interface InputTypes {
  "orders": {
    "get_order": { "OrderId": OrdersInputOrderId; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
  "with-hyphen": {
    "get_order": { "OrderId": WithHyphenInputOrderId; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
}
export interface OutputTypes {
  "orders": {
    "get_order": { "Total": OrdersOutputTotal; };
  };
  "with-hyphen": {
    "get_order": { "Total": WithHyphenOutputTotal; };
  };
}
export interface Resources {
  "orders": {
    "orders://summary": { "total": number; };
  };
  "with-hyphen": {
    "orders://summary": { "total": number; };
  };
}

export type Apps = { readonly [A in keyof Inputs]: ToolClient<Inputs[A], Outputs[A], Resources[A]> };
export declare const apps: Apps;
export type { EndpointBinding, CreateOptions };
export declare function createApps<K extends keyof Apps>(bindings: { [A in K]: EndpointBinding }, options?: CreateOptions): Pick<Apps,K>;
