import { z } from "zod";
import {
  MINIMAX_BITRATES,
  MINIMAX_FORMATS,
  MINIMAX_MODELS,
  MINIMAX_SAMPLE_RATES,
  SUNO_VERSIONS,
} from "@/types/music";

const audioQualitySchema = z.object({
  sampleRate: z
    .number()
    .refine(
      (n): n is (typeof MINIMAX_SAMPLE_RATES)[number] =>
        (MINIMAX_SAMPLE_RATES as readonly number[]).includes(n),
      `sampleRate must be one of ${MINIMAX_SAMPLE_RATES.join(", ")}`
    ),
  bitrate: z
    .number()
    .refine(
      (n): n is (typeof MINIMAX_BITRATES)[number] =>
        (MINIMAX_BITRATES as readonly number[]).includes(n),
      `bitrate must be one of ${MINIMAX_BITRATES.join(", ")}`
    ),
  format: z.enum(MINIMAX_FORMATS as [string, ...string[]]),
});

export const trackStyleSchema = z
  .object({
    genre: z.string(),
    moods: z.array(z.string()),
    tempo: z.number().int().min(40).max(220),
    key: z.string().min(1),
    isMinor: z.boolean(),
    instruments: z.array(z.string()),
    vocalStyle: z.string(),
    duration: z.string().min(1),
    provider: z.enum(["suno", "minimax"]).optional(),
    sunoApiVersion: z.string(),
    minimaxModel: z.string().optional(),
    audioQuality: audioQualitySchema.optional(),
  })
  .superRefine((style, ctx) => {
    const provider = style.provider ?? "suno";

    if (provider === "suno") {
      if (!(SUNO_VERSIONS as readonly string[]).includes(style.sunoApiVersion)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sunoApiVersion"],
          message: `sunoApiVersion must be one of ${SUNO_VERSIONS.join(", ")}`,
        });
      }
      return;
    }

    // provider === "minimax"
    const model = style.minimaxModel;
    if (!model) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minimaxModel"],
        message: "minimaxModel is required when provider is minimax",
      });
    } else if (!(MINIMAX_MODELS as readonly string[]).includes(model)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minimaxModel"],
        message: `minimaxModel must be one of ${MINIMAX_MODELS.join(", ")}`,
      });
    }
  });

export class InvalidTrackStyleError extends Error {
  readonly issues: z.ZodIssue[];
  constructor(issues: z.ZodIssue[]) {
    const summary = issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    super(`Invalid track style — ${summary}`);
    this.name = "InvalidTrackStyleError";
    this.issues = issues;
  }
}

export function validateForGeneration(style: unknown): asserts style is z.infer<
  typeof trackStyleSchema
> {
  const result = trackStyleSchema.safeParse(style);
  if (!result.success) {
    throw new InvalidTrackStyleError(result.error.issues);
  }
}
