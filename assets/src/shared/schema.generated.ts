/* Generated from schema/*.schema.json. Run npm run schema:types. */

export type Condition =
  | {
      /**
       * @maxItems 50
       */
      all: Condition[];
    }
  | {
      /**
       * @maxItems 50
       */
      any: Condition[];
    }
  | {
      field: string;
      source?: "answer" | "variable" | "hidden" | "url";
      op:
        | "eq"
        | "neq"
        | "contains"
        | "not_contains"
        | "in"
        | "not_in"
        | "gt"
        | "gte"
        | "lt"
        | "lte"
        | "between"
        | "is_empty"
        | "is_not_empty"
        | "starts_with"
        | "matches"
        | "date_before"
        | "date_after"
        | "age_gte";
      value?: (string | number | boolean | null) | (string | number | boolean | null)[];
    };
export type Action =
  | {
      action: "show" | "hide" | "jump" | "require" | "unrequire";
      to: string;
    }
  | {
      action: "end";
      to: string;
    }
  | {
      action: "set_variable";
      key: string;
      operation: "set" | "add" | "subtract";
      value: string | number | boolean | null;
    };

export interface ChatFlowFormSchemaV1 {
  schemaVersion: 1;
  bot: Bot;
  /**
   * @minItems 1
   * @maxItems 500
   */
  steps: [Step, ...Step[]];
  /**
   * @maxItems 100
   */
  groups?: Group[];
  /**
   * @minItems 1
   * @maxItems 100
   */
  endings: [Ending, ...Ending[]];
  /**
   * @maxItems 100
   */
  variables?: Variable[];
}
export interface Bot {
  name: string;
  avatar?: number | null;
  typingSpeed?: "off" | "fast" | "normal" | "slow";
}
export interface Step {
  id: string;
  key: string;
  type:
    | "short_text"
    | "long_text"
    | "email"
    | "phone"
    | "number"
    | "date"
    | "single_choice"
    | "multi_choice"
    | "yes_no"
    | "rating"
    | "scale"
    | "nps"
    | "slider"
    | "file_upload"
    | "address"
    | "consent"
    | "hidden"
    | "statement"
    | "media"
    | "summary";
  /**
   * @maxItems 50
   */
  messages: string[];
  label: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  hiddenByDefault?: boolean;
  validation?: Validation;
  /**
   * @maxItems 100
   */
  logic?: Rule[];
  /**
   * @maxItems 200
   */
  options?: Option[];
  defaultValue?:
    | (string | number | boolean | null)
    | (string | number | boolean | null)[]
    | {
        street?: string;
        city?: string;
        postcode?: string;
        country?: string;
      };
  settings?: {
    country?: string;
    autocomplete?: string;
    inputMode?: "text" | "numeric" | "tel" | "decimal" | "email" | "url" | "search" | "none";
    unit?: string;
    layout?: "chips" | "cards" | "dropdown";
    buttonLabel?: string;
    autoContinue?: boolean;
    source?: "default" | "url" | "cookie" | "meta" | "merge";
    sourceKey?: string;
    consentText?: string;
    privacyUrl?: string;
    media?: {
      type?: "image" | "video" | "gif";
      url?: string;
      attachmentId?: number;
      alt?: string;
    };
    /**
     * @minItems 1
     * @maxItems 4
     */
    addressFields?:
      | ["street" | "city" | "postcode" | "country"]
      | ["street" | "city" | "postcode" | "country", "street" | "city" | "postcode" | "country"]
      | [
          "street" | "city" | "postcode" | "country",
          "street" | "city" | "postcode" | "country",
          "street" | "city" | "postcode" | "country"
        ]
      | [
          "street" | "city" | "postcode" | "country",
          "street" | "city" | "postcode" | "country",
          "street" | "city" | "postcode" | "country",
          "street" | "city" | "postcode" | "country"
        ];
  };
}
export interface Validation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "text" | "url" | "email";
  min?: number | string;
  max?: number | string;
  step?: number;
  minSelections?: number;
  maxSelections?: number;
  minAge?: number;
  mxCheck?: boolean;
  maxBytes?: number;
  /**
   * @maxItems 30
   */
  mimeTypes?: string[];
}
export interface Rule {
  if: Condition;
  then: Action;
}
export interface Option {
  id: string;
  value: string;
  label: string;
  emoji?: string;
  reaction?: string;
  image?: number;
  isOther?: boolean;
  isExclusive?: boolean;
  /**
   * @maxItems 50
   */
  logic?: Rule[];
}
export interface Group {
  id: string;
  title: string;
  /**
   * @maxItems 500
   */
  stepIds: string[];
}
export interface Ending {
  id: string;
  type: "message" | "redirect";
  /**
   * @maxItems 50
   */
  messages?: string[];
  url?: string;
  appendQuery?: boolean;
  /**
   * @maxItems 100
   */
  queryKeys?: string[];
  appendSubmission?: boolean;
  delayMs?: number;
  /**
   * @maxItems 20
   */
  buttons?:
    | []
    | [Button]
    | [Button, Button]
    | [Button, Button, Button]
    | [Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button]
    | [Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button, Button]
    | [
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button
      ]
    | [
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button
      ]
    | [
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button
      ]
    | [
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button
      ]
    | [
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button
      ]
    | [
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button,
        Button
      ];
}
export interface Button {
  id: string;
  label: string;
  action: "link" | "restart" | "close";
  url?: string;
}
export interface Variable {
  key: string;
  type: "number" | "string" | "boolean";
  default: string | number | boolean | null;
}
