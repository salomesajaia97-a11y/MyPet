/** Flat parameter bag as sent to, or received from, Flitt. */
export type FlittParams = Record<string, string | number | boolean | null | undefined>;

/** Payment/order lifecycle as reported by Flitt in `order_status`. */
export type FlittOrderStatus =
  | "created"
  | "processing"
  | "declined"
  | "approved"
  | "expired"
  | "reversed";

/**
 * Flat payload delivered to `server_callback_url`, and also the shape returned
 * by `/api/status/order_id` (there nested under a root `response` object).
 * Numeric-looking fields arrive as strings, so callers must coerce.
 */
export interface FlittCallbackPayload extends FlittParams {
  order_id: string;
  merchant_id: number;
  response_status: "success" | "failure";
  order_status?: FlittOrderStatus;
  payment_id?: number;
  amount?: string | number;
  actual_amount?: string | number;
  currency?: string;
  response_code?: number;
  response_description?: string;
  merchant_data?: string;
  additional_info?: string;
  signature?: string;
  response_signature_string?: string;
  error_code?: number;
  error_message?: string;
}
