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

export interface ChatFlowPrivateFormSettingsV1 {
  appearance?: Appearance;
  phrases?: {
    [k: string]: string;
  };
  completion?: {
    defaultEndingId: string;
    /**
     * @maxItems 20
     */
    allowedRedirectHosts?:
      | []
      | [string]
      | [string, string]
      | [string, string, string]
      | [string, string, string, string]
      | [string, string, string, string, string]
      | [string, string, string, string, string, string]
      | [string, string, string, string, string, string, string]
      | [string, string, string, string, string, string, string, string]
      | [string, string, string, string, string, string, string, string, string]
      | [string, string, string, string, string, string, string, string, string, string]
      | [string, string, string, string, string, string, string, string, string, string, string]
      | [string, string, string, string, string, string, string, string, string, string, string, string]
      | [string, string, string, string, string, string, string, string, string, string, string, string, string]
      | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
      | [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string
        ]
      | [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string
        ]
      | [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string
        ]
      | [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string
        ]
      | [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string
        ]
      | [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string
        ];
  };
  sessions?: {
    magicLinks?: {
      enabled?: boolean;
      whatsapp?: boolean;
      emailField?: string;
      ttlMinutes?: number;
    };
    savePartial?: boolean;
    resumeEnabled?: boolean;
    resumePrompt?: boolean;
    resumeDays?: number;
    abandonDays?: number;
    deletePartialOnRestart?: boolean;
  };
  limits?: {
    requireLogin?: boolean;
    total?: number | null;
    perUser?: number | null;
    closesAt?: string | null;
  };
  privacy?: {
    storeMeta?: boolean;
    ipMode?: "full" | "anonymized" | "none";
    storeUserAgent?: boolean;
    respectDnt?: boolean;
    retentionEnabled?: boolean;
    retentionDays?: number;
    partialRetentionDays?: number | null;
  };
  spam?: {
    honeypotEnabled?: boolean;
    minSeconds?: number;
    rateLimit?: number;
    rateWindowSeconds?: number;
    captcha?: "none" | "turnstile" | "hcaptcha" | "recaptcha";
    akismetEnabled?: boolean;
  };
  notifications?: {
    /**
     * @maxItems 20
     */
    admin?:
      | []
      | [Notification]
      | [Notification, Notification]
      | [Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification, Notification, Notification, Notification]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ];
    /**
     * @maxItems 20
     */
    autoresponders?:
      | []
      | [Notification]
      | [Notification, Notification]
      | [Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification, Notification, Notification]
      | [Notification, Notification, Notification, Notification, Notification, Notification, Notification, Notification]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ]
      | [
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification,
          Notification
        ];
    firstMatchOnly?: boolean;
    notifyAbandoned?: boolean;
  };
  integrations?: {
    /**
     * @maxItems 20
     */
    webhooks?:
      | []
      | [Webhook]
      | [Webhook, Webhook]
      | [Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook]
      | [Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook, Webhook]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ]
      | [
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook,
          Webhook
        ];
  };
  display?: {
    mode?: "inline" | "fullpage" | "launcher" | "popup";
    theme?: "light" | "dark" | "auto";
    baseSlug?: string;
    height?: number;
    launcher?: {
      position?: "left" | "right";
      autoOpenSeconds?: number | null;
      scrollPercent?: number | null;
      enabled?: boolean;
      /**
       * @maxItems 500
       */
      includePageIds?: number[];
      /**
       * @maxItems 500
       */
      excludePageIds?: number[];
    };
  };
}
export interface Appearance {
  confetti?: boolean;
  theme?: "light" | "dark" | "auto";
  primary?: string;
  botBubbleBackground?: string;
  userBubbleBackground?: string;
  textColor?: string;
  font?: string;
  inheritFont?: boolean;
  radius?: number;
  width?: number;
  customCss?: string;
  googleFont?: "system" | "Inter" | "Roboto" | "Open Sans";
}
export interface Notification {
  id: string;
  enabled: boolean;
  /**
   * @maxItems 20
   */
  to?:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ];
  /**
   * @maxItems 20
   */
  cc?:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ];
  /**
   * @maxItems 20
   */
  bcc?:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ];
  emailField?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  subject: string;
  body: string;
  conditions?: Condition;
  delaySeconds?: number;
  /**
   * @maxItems 20
   */
  attachmentIds?:
    | []
    | [number]
    | [number, number]
    | [number, number, number]
    | [number, number, number, number]
    | [number, number, number, number, number]
    | [number, number, number, number, number, number]
    | [number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number, number, number, number, number]
    | [number, number, number, number, number, number, number, number, number, number, number, number, number, number]
    | [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ]
    | [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ]
    | [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ]
    | [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ]
    | [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ]
    | [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ];
}
export interface Webhook {
  id: string;
  enabled: boolean;
  url: string;
  /**
   * @maxItems 3
   */
  events:
    | []
    | ["completed" | "partial" | "abandoned"]
    | ["completed" | "partial" | "abandoned", "completed" | "partial" | "abandoned"]
    | [
        "completed" | "partial" | "abandoned",
        "completed" | "partial" | "abandoned",
        "completed" | "partial" | "abandoned"
      ];
  headers?: {
    [k: string]: string;
  };
  secret?: string;
}
