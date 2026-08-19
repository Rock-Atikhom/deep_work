import { describe, expect, it } from "vitest";
import {
  parseQuestionDeckDocument,
  serializeQuestionDeck,
  type QuestionDeck,
} from "./question-deck";

const validDeck: QuestionDeck = {
  id: "biology-basics",
  name: "Biology basics",
  questions: [
    {
      explanation: "Cells use mitochondria to release usable energy.",
      id: "q-1",
      prompt: "What is one role of mitochondria?",
    },
  ],
  schemaVersion: 1,
  subject: "Biology",
};

describe("Question Deck schema", () => {
  it("round-trips a versioned local deck document", () => {
    const parsed = parseQuestionDeckDocument(serializeQuestionDeck(validDeck));

    expect(parsed).toEqual(validDeck);
  });

  it("explains malformed and unsupported imports", () => {
    expect(() => parseQuestionDeckDocument("not json")).toThrow(/valid JSON/i);
    expect(() =>
      parseQuestionDeckDocument(JSON.stringify({ schemaVersion: 2, deck: validDeck })),
    ).toThrow(/version 1/i);
    expect(() =>
      parseQuestionDeckDocument(
        JSON.stringify({
          schemaVersion: 1,
          deck: {
            ...validDeck,
            questions: [validDeck.questions[0], validDeck.questions[0]],
          },
        }),
      ),
    ).toThrow(/question ids must be unique/i);
  });
});
