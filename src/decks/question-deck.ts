export const QUESTION_DECK_SCHEMA_VERSION = 1 as const;

export interface QuestionCard {
  explanation: string;
  id: string;
  prompt: string;
}

export interface QuestionDeck {
  id: string;
  name: string;
  questions: QuestionCard[];
  schemaVersion: typeof QUESTION_DECK_SCHEMA_VERSION;
  subject: string;
}

export class QuestionDeckValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionDeckValidationError";
  }
}

const sampleDeck: QuestionDeck = {
  id: "sample-sql",
  name: "SQL study prompts",
  questions: [
    {
      explanation: "An INNER JOIN keeps rows whose join key exists in both tables.",
      id: "sample-sql-1",
      prompt: "When would you use an INNER JOIN?",
    },
    {
      explanation: "A primary key identifies a row uniquely in its table.",
      id: "sample-sql-2",
      prompt: "What does a primary key identify?",
    },
    {
      explanation: "GROUP BY collects rows so an aggregate can be calculated per group.",
      id: "sample-sql-3",
      prompt: "Why would a query use GROUP BY?",
    },
  ],
  schemaVersion: QUESTION_DECK_SCHEMA_VERSION,
  subject: "SQL",
};

export function sampleQuestionDeck(): QuestionDeck {
  return cloneQuestionDeck(sampleDeck);
}

export function cloneQuestionDeck(deck: QuestionDeck): QuestionDeck {
  return {
    ...deck,
    questions: deck.questions.map((question) => ({ ...question })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new QuestionDeckValidationError(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

export function validateQuestionDeck(value: unknown): QuestionDeck {
  if (!isRecord(value)) {
    throw new QuestionDeckValidationError("Question Deck must be an object.");
  }
  if (value.schemaVersion !== QUESTION_DECK_SCHEMA_VERSION) {
    throw new QuestionDeckValidationError(
      `Unsupported Question Deck version. Expected version ${QUESTION_DECK_SCHEMA_VERSION}.`,
    );
  }

  const questions = value.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new QuestionDeckValidationError("Question Deck must include at least one question.");
  }

  const normalizedQuestions = questions.map((question, index) => {
    if (!isRecord(question)) {
      throw new QuestionDeckValidationError(`Question ${index + 1} must be an object.`);
    }
    const explanation = question.explanation ?? "";
    if (typeof explanation !== "string") {
      throw new QuestionDeckValidationError(`Explanation ${index + 1} must be text.`);
    }
    return {
      explanation: explanation.trim(),
      id: requiredText(question.id, `Question ${index + 1} id`),
      prompt: requiredText(question.prompt, `Question ${index + 1} prompt`),
    };
  });

  if (
    new Set(normalizedQuestions.map((question) => question.id)).size !== normalizedQuestions.length
  ) {
    throw new QuestionDeckValidationError("Question IDs must be unique.");
  }

  return {
    id: requiredText(value.id, "Question Deck id"),
    name: requiredText(value.name, "Question Deck name"),
    questions: normalizedQuestions,
    schemaVersion: QUESTION_DECK_SCHEMA_VERSION,
    subject: requiredText(value.subject, "Question Deck subject"),
  };
}

export function parseQuestionDeckDocument(content: string): QuestionDeck {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new QuestionDeckValidationError("Question Deck import must be valid JSON.");
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== QUESTION_DECK_SCHEMA_VERSION) {
    throw new QuestionDeckValidationError(
      `Unsupported Question Deck version. Expected version ${QUESTION_DECK_SCHEMA_VERSION}.`,
    );
  }
  if (!isRecord(parsed.deck)) {
    throw new QuestionDeckValidationError("Question Deck import must contain a deck record.");
  }

  return validateQuestionDeck(parsed.deck);
}

export function serializeQuestionDeck(deck: QuestionDeck): string {
  return JSON.stringify(
    {
      deck: validateQuestionDeck(deck),
      schemaVersion: QUESTION_DECK_SCHEMA_VERSION,
    },
    null,
    2,
  );
}
